import { NextResponse } from 'next/server';
import prisma from '../../../../../lib/prisma.js';
import { requireAuth } from '../../../../../lib/auth-server.js';
import {
  canAccessProposal,
  saveProposalDocument,
  resolveProposalTenantId,
} from '../../../../../lib/proposal-files.js';

async function saveMilestoneDocuments(files, options) {
  const saved = [];

  for (const file of files) {
    if (!file || typeof file === 'string' || !file.size) continue;

    const meta = await saveProposalDocument('milestone', file, options);
    saved.push({
      id: `doc-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      originalName: meta.originalName,
      fileName: meta.fileName,
      fileId: meta.fileId || null,
      size: meta.size,
      mimeType: meta.mimeType,
      url: meta.url,
      uploadedAt: new Date().toISOString(),
    });
  }

  return saved;
}

async function authorizeProposal(request, proposalId) {
  const auth = await requireAuth(request);
  if (auth.error) {
    return { error: NextResponse.json({ error: 'Authentication required' }, { status: 401 }) };
  }

  const proposal = await prisma.proposal.findUnique({ where: { id: proposalId } });
  if (!proposal) {
    return { error: NextResponse.json({ error: 'Proposal not found' }, { status: 404 }) };
  }
  if (!canAccessProposal(auth.user, proposal)) {
    return { error: NextResponse.json({ error: 'Not found' }, { status: 404 }) };
  }

  const entityTenantId = await resolveProposalTenantId(proposal);
  return {
    user: auth.user,
    proposal,
    uploadOptions: {
      user: auth.user,
      proposalId,
      entityTenantId,
    },
  };
}

export async function POST(request, { params }) {
  try {
    const { id } = await params;
    const authResult = await authorizeProposal(request, id);
    if (authResult.error) return authResult.error;

    const body = await request.json();
    const milestoneData = body.milestoneData || {};

    if (!milestoneData.title?.trim()) {
      return NextResponse.json({ error: 'Milestone title is required' }, { status: 400 });
    }

    const milestones = Array.isArray(authResult.proposal.milestones)
      ? [...authResult.proposal.milestones]
      : [];
    const newMilestone = {
      title: milestoneData.title.trim(),
      description: milestoneData.description || '',
      status: milestoneData.status
        ? String(milestoneData.status).toLowerCase().replace(/\s+/g, '_')
        : 'pending',
      targetDate: milestoneData.dueDate || null,
      dueDate: milestoneData.dueDate || null,
      progress: milestoneData.progress || 0,
      notes: milestoneData.notes || '',
      completionCriteria: milestoneData.completionCriteria || '',
      blockers: milestoneData.blockers || '',
      linkedDeliverableIds: milestoneData.linkedDeliverableIds || [],
      documents: [],
      createdAt: new Date().toISOString(),
    };

    milestones.push(newMilestone);

    const updatedProposal = await prisma.proposal.update({
      where: { id },
      data: { milestones },
    });

    return NextResponse.json({
      success: true,
      milestone: newMilestone,
      milestones: updatedProposal.milestones,
    });
  } catch (error) {
    console.error('Error creating milestone:', error);
    return NextResponse.json(
      { error: 'Failed to create milestone', details: error.message },
      { status: 500 }
    );
  }
}

export async function PATCH(request, { params }) {
  try {
    const { id } = await params;
    const authResult = await authorizeProposal(request, id);
    if (authResult.error) return authResult.error;

    const contentType = request.headers.get('content-type') || '';
    let milestoneIndex;
    let milestoneData;
    let uploadFiles = [];

    if (contentType.includes('multipart/form-data')) {
      const formData = await request.formData();
      milestoneIndex = Number(formData.get('milestoneIndex'));
      milestoneData = JSON.parse(formData.get('milestoneData') || '{}');
      uploadFiles = formData.getAll('documents');
    } else {
      const body = await request.json();
      milestoneIndex = Number(body.milestoneIndex);
      milestoneData = body.milestoneData || {};
    }

    if (Number.isNaN(milestoneIndex) || milestoneIndex < 0) {
      return NextResponse.json({ error: 'Valid milestone index is required' }, { status: 400 });
    }

    const milestones = Array.isArray(authResult.proposal.milestones)
      ? [...authResult.proposal.milestones]
      : [];
    if (milestoneIndex >= milestones.length) {
      return NextResponse.json({ error: 'Milestone not found' }, { status: 404 });
    }

    const existing = milestones[milestoneIndex] || {};
    const uploadedDocuments = await saveMilestoneDocuments(uploadFiles, authResult.uploadOptions);
    const removedIds = new Set(milestoneData.removedDocumentIds || []);
    const retainedDocuments = (milestoneData.documents || existing.documents || []).filter(
      (doc) => doc?.id && !removedIds.has(doc.id)
    );

    const normalizedStatus = milestoneData.status
      ? String(milestoneData.status).toLowerCase().replace(/\s+/g, '_')
      : existing.status;

    milestones[milestoneIndex] = {
      ...existing,
      title: milestoneData.title ?? existing.title,
      description: milestoneData.description ?? existing.description ?? '',
      status: normalizedStatus,
      targetDate: milestoneData.dueDate ?? existing.targetDate ?? existing.dueDate ?? null,
      dueDate: milestoneData.dueDate ?? existing.dueDate ?? existing.targetDate ?? null,
      completedDate: milestoneData.completedDate ?? existing.completedDate ?? null,
      progress: milestoneData.progress ?? existing.progress ?? 0,
      notes: milestoneData.notes ?? existing.notes ?? '',
      completionCriteria: milestoneData.completionCriteria ?? existing.completionCriteria ?? '',
      blockers: milestoneData.blockers ?? existing.blockers ?? '',
      linkedDeliverableIds: milestoneData.linkedDeliverableIds ?? existing.linkedDeliverableIds ?? [],
      documents: [...retainedDocuments, ...uploadedDocuments],
      updatedAt: new Date().toISOString(),
    };

    const updatedProposal = await prisma.proposal.update({
      where: { id },
      data: { milestones },
    });

    return NextResponse.json({
      success: true,
      milestone: milestones[milestoneIndex],
      milestones: updatedProposal.milestones,
    });
  } catch (error) {
    console.error('Error updating milestone:', error);
    return NextResponse.json(
      { error: 'Failed to update milestone', details: error.message },
      { status: 500 }
    );
  }
}
