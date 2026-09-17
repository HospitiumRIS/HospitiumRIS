import { NextResponse } from 'next/server';
import prisma from '../../../../lib/prisma';
import { isImaChekConfigured } from '../../../../lib/imachek';
import { refreshIntegrityCasesFromImaChek } from '../../../../lib/image-integrity-sync';
import {
  requireInstitutionImageIntegrityAccess,
  institutionCasesWhere,
} from '../../../../lib/image-integrity-institution';

const IMAGE_FORMATS = ['png', 'jpg', 'jpeg'];

function withPreview(record) {
  if (!record) return record;
  return {
    ...record,
    previewUrl: `/api/institution/image-integrity/${record.id}/file`,
    isImagePreview: IMAGE_FORMATS.includes((record.fileFormat || '').toLowerCase()),
  };
}

/**
 * GET /api/institution/image-integrity
 * Read-only oversight view: image integrity submissions for this institution.
 * Supports optional ?status=&search= filtering.
 */
export async function GET(request) {
  try {
    const auth = await requireInstitutionImageIntegrityAccess(request);
    if (auth.errorResponse) return auth.errorResponse;
    const { institution } = auth;

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const search = searchParams.get('search');

    const where = { ...institutionCasesWhere(institution) };
    if (status && status !== 'ALL') {
      where.status = status;
    }
    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { contributor: { contains: search, mode: 'insensitive' } },
        { fileName: { contains: search, mode: 'insensitive' } },
        { doi: { contains: search, mode: 'insensitive' } },
        { submittedBy: { is: { givenName: { contains: search, mode: 'insensitive' } } } },
        { submittedBy: { is: { familyName: { contains: search, mode: 'insensitive' } } } },
        { submittedBy: { is: { email: { contains: search, mode: 'insensitive' } } } },
      ];
    }

    const cases = await prisma.imageIntegrityCase.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        submittedBy: {
          select: { id: true, givenName: true, familyName: true, email: true, primaryInstitution: true },
        },
        labUnit: { select: { id: true, name: true } },
        collection: { select: { id: true, name: true } },
      },
    });

    const refreshed = await refreshIntegrityCasesFromImaChek(cases);

    const summary = {
      total: refreshed.length,
      completed: refreshed.filter((c) => c.status === 'COMPLETED').length,
      processing: refreshed.filter((c) => c.status === 'PROCESSING' || c.status === 'UPLOADING').length,
      failed: refreshed.filter((c) => c.status === 'FAILED').length,
      flagged: refreshed.filter(
        (c) => (c.manipulationCount || 0) > 0 || (c.similarityCount || 0) > 0
      ).length,
    };

    return NextResponse.json({
      success: true,
      configured: isImaChekConfigured(),
      cases: refreshed.map(withPreview),
      summary,
    });
  } catch (error) {
    console.error('Institution Image Integrity list error:', error);
    return NextResponse.json({ error: 'Failed to load submission reports' }, { status: 500 });
  }
}
