import { NextResponse } from 'next/server';
import prisma from '../../../../../lib/prisma';
import { getAuthenticatedUser } from '../../../../../lib/auth-server';
import imachek, { isImaChekConfigured } from '../../../../../lib/imachek';
import { deleteIntegrityFile } from '../../../../../lib/image-integrity-files';
import { refreshIntegrityCaseFromImaChek } from '../../../../../lib/image-integrity-sync';
import { loadRelatedCases } from '../../../../../lib/image-integrity-compare';
import {
  validateLabUnitForResearcher,
  validateCollectionForResearcher,
  parseTagsInput,
} from '../../../../../lib/image-integrity-lab-units';

const caseInclude = {
  labUnit: { select: { id: true, name: true } },
  collection: { select: { id: true, name: true, color: true } },
};

/** GET /api/researcher/image-integrity/[id] */
export async function GET(request, { params }) {
  try {
    const user = await getAuthenticatedUser(request);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    if (user.accountType !== 'RESEARCHER') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { id } = await params;
    const force = new URL(request.url).searchParams.get('refresh') === '1';
    const original = await prisma.imageIntegrityCase.findFirst({
      where: { id, submittedById: user.id },
      include: caseInclude,
    });

    if (!original) {
      return NextResponse.json({ error: 'Submission not found' }, { status: 404 });
    }

    let record = await refreshIntegrityCaseFromImaChek(original, { force });
    record = {
      ...record,
      labUnit: record.labUnit || original.labUnit,
      collection: record.collection || original.collection,
      labUnitId: record.labUnitId ?? original.labUnitId,
      collectionId: record.collectionId ?? original.collectionId,
    };
    const relatedCases = await loadRelatedCases(record.analysisTarget);

    return NextResponse.json({
      success: true,
      configured: isImaChekConfigured(),
      case: record,
      relatedCases,
    });
  } catch (error) {
    console.error('Image Integrity detail error:', error);
    return NextResponse.json({ error: 'Failed to load submission' }, { status: 500 });
  }
}

/** PATCH /api/researcher/image-integrity/[id] — update collection, lab, notes, tags */
export async function PATCH(request, { params }) {
  try {
    const user = await getAuthenticatedUser(request);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    if (user.accountType !== 'RESEARCHER') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { id } = await params;
    const existing = await prisma.imageIntegrityCase.findFirst({
      where: { id, submittedById: user.id },
    });
    if (!existing) {
      return NextResponse.json({ error: 'Submission not found' }, { status: 404 });
    }

    const body = await request.json().catch(() => ({}));
    const data = {};

    if ('labUnitId' in body) {
      const labCheck = await validateLabUnitForResearcher(user, body.labUnitId || null);
      if (labCheck.error) return NextResponse.json({ error: labCheck.error }, { status: 400 });
      data.labUnitId = labCheck.labUnitId;
    }
    if ('collectionId' in body) {
      const collectionCheck = await validateCollectionForResearcher(user, body.collectionId || null);
      if (collectionCheck.error) return NextResponse.json({ error: collectionCheck.error }, { status: 400 });
      data.collectionId = collectionCheck.collectionId;
    }
    if ('notes' in body) {
      data.notes = String(body.notes || '').trim() || null;
    }
    if ('tags' in body) {
      const tags = parseTagsInput(body.tags);
      data.tags = tags.length ? tags : null;
    }

    const record = await prisma.imageIntegrityCase.update({
      where: { id: existing.id },
      data,
      include: caseInclude,
    });

    return NextResponse.json({ success: true, case: record });
  } catch (error) {
    console.error('Image Integrity patch error:', error);
    return NextResponse.json({ error: 'Failed to update submission' }, { status: 500 });
  }
}

/** DELETE /api/researcher/image-integrity/[id] */
export async function DELETE(request, { params }) {
  try {
    const user = await getAuthenticatedUser(request);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    if (user.accountType !== 'RESEARCHER') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { id } = await params;
    const record = await prisma.imageIntegrityCase.findFirst({
      where: { id, submittedById: user.id },
    });
    if (!record) {
      return NextResponse.json({ error: 'Submission not found' }, { status: 404 });
    }

    if (record.externalCaseId && isImaChekConfigured()) {
      try {
        await imachek.deleteCase(record.externalCaseId);
      } catch (error) {
        // If ImaChek refuses (e.g. analysis still in progress), surface that
        // instead of silently deleting our local record and orphaning theirs.
        console.error('ImaChek delete error:', error);
        return NextResponse.json(
          { error: error?.message || 'ImaChek could not delete this case yet. It may still be processing.' },
          { status: 409 }
        );
      }
    }

    await deleteIntegrityFile(record.id, record.fileName);
    await prisma.imageIntegrityCase.delete({ where: { id: record.id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Image Integrity delete error:', error);
    return NextResponse.json({ error: 'Failed to delete submission' }, { status: 500 });
  }
}
