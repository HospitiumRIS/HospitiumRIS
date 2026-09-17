import { NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import prisma from '../../../../../lib/prisma.js';
import { getUserId } from '../../../../../lib/auth-server.js';

const uploadsDir = () => join(process.cwd(), 'uploads', 'proposals', 'milestones');

async function saveMilestoneDocuments(files) {
  await mkdir(uploadsDir(), { recursive: true });
  const saved = [];

  for (const file of files) {
    if (!file || typeof file === 'string' || !file.size) continue;

    const safeName = file.name.replace(/[^\w.\-() ]+/g, '_');
    const fileName = `milestone_${Date.now()}_${safeName}`;
    const filePath = join(uploadsDir(), fileName);
    const bytes = await file.arrayBuffer();

    await writeFile(filePath, Buffer.from(bytes));

    saved.push({
      id: `doc-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      originalName: file.name,
      fileName,
      size: file.size,
      mimeType: file.type || 'application/octet-stream',
      url: `/uploads/proposals/milestones/${fileName}`,
      uploadedAt: new Date().toISOString(),
    });
  }

  return saved;
}

export async function POST(request, { params }) {
  try {
    const userId = await getUserId(request);
    if (!userId) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const milestoneData = body.milestoneData || {};

    if (!milestoneData.title?.trim()) {
      return NextResponse.json({ error: 'Milestone title is required' }, { status: 400 });
    }

    const proposal = await prisma.proposal.findUnique({ where: { id } });
    if (!proposal) {
      return NextResponse.json({ error: 'Proposal not found' }, { status: 404 });
    }

    const milestones = Array.isArray(proposal.milestones) ? [...proposal.milestones] : [];
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
    const userId = await getUserId(request);
    if (!userId) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const { id } = await params;
    if (!id) {
      return NextResponse.json({ error: 'Proposal ID is required' }, { status: 400 });
    }

    const proposal = await prisma.proposal.findUnique({ where: { id } });
    if (!proposal) {
      return NextResponse.json({ error: 'Proposal not found' }, { status: 404 });
    }

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

    const milestones = Array.isArray(proposal.milestones) ? [...proposal.milestones] : [];
    if (milestoneIndex >= milestones.length) {
      return NextResponse.json({ error: 'Milestone not found' }, { status: 404 });
    }

    const existing = milestones[milestoneIndex] || {};
    const uploadedDocuments = await saveMilestoneDocuments(uploadFiles);
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
