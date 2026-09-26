import { NextResponse } from 'next/server';
import prisma from '../../../../../lib/prisma.js';
import { requireAuth } from '../../../../../lib/auth-server.js';
import {
  canAccessProposal,
  saveProposalDocument,
  resolveProposalTenantId,
} from '../../../../../lib/proposal-files.js';

async function saveDeliverableDocuments(files, options) {
  const saved = [];

  for (const file of files) {
    if (!file || typeof file === 'string' || !file.size) continue;

    const meta = await saveProposalDocument('deliverable', file, options);
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

function buildDeliverablePayload(existing, deliverableData, uploadedDocuments) {
  const removedIds = new Set(deliverableData.removedDocumentIds || []);
  const retainedDocuments = (deliverableData.documents || existing.documents || []).filter(
    (doc) => doc?.id && !removedIds.has(doc.id)
  );

  const normalizedStatus = deliverableData.status
    ? String(deliverableData.status).toLowerCase().replace(/\s+/g, '_')
    : existing.status;

  return {
    ...existing,
    title: deliverableData.title ?? existing.title,
    description: deliverableData.description ?? existing.description ?? '',
    type: deliverableData.type ?? existing.type ?? 'Document',
    status: normalizedStatus === 'delivered' ? 'delivered' : normalizedStatus,
    dueDate: deliverableData.dueDate ?? existing.dueDate ?? existing.deadline ?? null,
    deadline: deliverableData.dueDate ?? existing.deadline ?? existing.dueDate ?? null,
    notes: deliverableData.notes ?? existing.notes ?? '',
    completionCriteria: deliverableData.completionCriteria ?? existing.completionCriteria ?? '',
    linkedMilestoneIds: deliverableData.linkedMilestoneIds ?? existing.linkedMilestoneIds ?? [],
    documents: [...retainedDocuments, ...uploadedDocuments],
    updatedAt: new Date().toISOString(),
  };
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

    const contentType = request.headers.get('content-type') || '';
    let deliverableData = {};
    let uploadFiles = [];

    if (contentType.includes('multipart/form-data')) {
      const formData = await request.formData();
      deliverableData = JSON.parse(formData.get('deliverableData') || '{}');
      uploadFiles = formData.getAll('documents');
    } else {
      const body = await request.json();
      deliverableData = body.deliverableData || {};
    }

    if (!deliverableData.title?.trim()) {
      return NextResponse.json({ error: 'Deliverable title is required' }, { status: 400 });
    }

    const uploadedDocuments = await saveDeliverableDocuments(uploadFiles, authResult.uploadOptions);
    const deliverables = Array.isArray(authResult.proposal.deliverables)
      ? [...authResult.proposal.deliverables]
      : [];
    const newDeliverable = buildDeliverablePayload({}, deliverableData, uploadedDocuments);

    deliverables.push(newDeliverable);

    const updatedProposal = await prisma.proposal.update({
      where: { id },
      data: { deliverables },
    });

    return NextResponse.json({
      success: true,
      deliverable: newDeliverable,
      deliverables: updatedProposal.deliverables,
    });
  } catch (error) {
    console.error('Error creating deliverable:', error);
    return NextResponse.json(
      { error: 'Failed to create deliverable', details: error.message },
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
    let deliverableIndex;
    let deliverableData = {};
    let uploadFiles = [];

    if (contentType.includes('multipart/form-data')) {
      const formData = await request.formData();
      deliverableIndex = Number(formData.get('deliverableIndex'));
      deliverableData = JSON.parse(formData.get('deliverableData') || '{}');
      uploadFiles = formData.getAll('documents');
    } else {
      const body = await request.json();
      deliverableIndex = Number(body.deliverableIndex);
      deliverableData = body.deliverableData || {};
    }

    if (Number.isNaN(deliverableIndex) || deliverableIndex < 0) {
      return NextResponse.json({ error: 'Valid deliverable index is required' }, { status: 400 });
    }

    const deliverables = Array.isArray(authResult.proposal.deliverables)
      ? [...authResult.proposal.deliverables]
      : [];
    if (deliverableIndex >= deliverables.length) {
      return NextResponse.json({ error: 'Deliverable not found' }, { status: 404 });
    }

    const uploadedDocuments = await saveDeliverableDocuments(uploadFiles, authResult.uploadOptions);
    deliverables[deliverableIndex] = buildDeliverablePayload(
      deliverables[deliverableIndex] || {},
      deliverableData,
      uploadedDocuments
    );

    const updatedProposal = await prisma.proposal.update({
      where: { id },
      data: { deliverables },
    });

    return NextResponse.json({
      success: true,
      deliverable: deliverables[deliverableIndex],
      deliverables: updatedProposal.deliverables,
    });
  } catch (error) {
    console.error('Error updating deliverable:', error);
    return NextResponse.json(
      { error: 'Failed to update deliverable', details: error.message },
      { status: 500 }
    );
  }
}
