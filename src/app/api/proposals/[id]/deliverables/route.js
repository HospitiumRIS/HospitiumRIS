import { NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import prisma from '../../../../../lib/prisma.js';
import { getUserId } from '../../../../../lib/auth-server.js';

const uploadsDir = () => join(process.cwd(), 'uploads', 'proposals', 'deliverables');

async function saveDeliverableDocuments(files) {
  await mkdir(uploadsDir(), { recursive: true });
  const saved = [];

  for (const file of files) {
    if (!file || typeof file === 'string' || !file.size) continue;

    const safeName = file.name.replace(/[^\w.\-() ]+/g, '_');
    const fileName = `deliverable_${Date.now()}_${safeName}`;
    const filePath = join(uploadsDir(), fileName);
    const bytes = await file.arrayBuffer();

    await writeFile(filePath, Buffer.from(bytes));

    saved.push({
      id: `doc-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      originalName: file.name,
      fileName,
      size: file.size,
      mimeType: file.type || 'application/octet-stream',
      url: `/uploads/proposals/deliverables/${fileName}`,
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

export async function POST(request, { params }) {
  try {
    const userId = await getUserId(request);
    if (!userId) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const { id } = await params;
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

    const proposal = await prisma.proposal.findUnique({ where: { id } });
    if (!proposal) {
      return NextResponse.json({ error: 'Proposal not found' }, { status: 404 });
    }

    const uploadedDocuments = await saveDeliverableDocuments(uploadFiles);
    const deliverables = Array.isArray(proposal.deliverables) ? [...proposal.deliverables] : [];
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
    const userId = await getUserId(request);
    if (!userId) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const { id } = await params;
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

    const proposal = await prisma.proposal.findUnique({ where: { id } });
    if (!proposal) {
      return NextResponse.json({ error: 'Proposal not found' }, { status: 404 });
    }

    const deliverables = Array.isArray(proposal.deliverables) ? [...proposal.deliverables] : [];
    if (deliverableIndex >= deliverables.length) {
      return NextResponse.json({ error: 'Deliverable not found' }, { status: 404 });
    }

    const uploadedDocuments = await saveDeliverableDocuments(uploadFiles);
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
