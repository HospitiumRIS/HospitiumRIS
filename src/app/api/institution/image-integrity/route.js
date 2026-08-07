import { NextResponse } from 'next/server';
import prisma from '../../../../lib/prisma';
import { getAuthenticatedUser } from '../../../../lib/auth-server';
import { isImaChekConfigured } from '../../../../lib/imachek';

const INSTITUTION_ROLES = ['RESEARCH_ADMIN', 'INSTITUTION_ADMIN'];

/**
 * GET /api/institution/image-integrity
 * Read-only oversight view: every researcher's image integrity submissions.
 * Supports optional ?status=&search= filtering.
 */
export async function GET(request) {
  try {
    const user = await getAuthenticatedUser(request);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    if (!INSTITUTION_ROLES.includes(user.accountType)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const search = searchParams.get('search');

    const where = {};
    if (status && status !== 'ALL') {
      where.status = status;
    }
    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { contributor: { contains: search, mode: 'insensitive' } },
        { submittedBy: { is: { givenName: { contains: search, mode: 'insensitive' } } } },
        { submittedBy: { is: { familyName: { contains: search, mode: 'insensitive' } } } },
      ];
    }

    const cases = await prisma.imageIntegrityCase.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        submittedBy: {
          select: { id: true, givenName: true, familyName: true, email: true, primaryInstitution: true },
        },
      },
    });

    const summary = {
      total: cases.length,
      completed: cases.filter((c) => c.status === 'COMPLETED').length,
      processing: cases.filter((c) => c.status === 'PROCESSING' || c.status === 'UPLOADING').length,
      failed: cases.filter((c) => c.status === 'FAILED').length,
      flagged: cases.filter(
        (c) => (c.manipulationCount || 0) > 0 || (c.similarityLevel?.high || 0) > 0
      ).length,
    };

    return NextResponse.json({ success: true, configured: isImaChekConfigured(), cases, summary });
  } catch (error) {
    console.error('Institution Image Integrity list error:', error);
    return NextResponse.json({ error: 'Failed to load submission reports' }, { status: 500 });
  }
}
