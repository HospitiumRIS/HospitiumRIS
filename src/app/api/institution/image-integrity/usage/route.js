import { NextResponse } from 'next/server';
import prisma from '../../../../../lib/prisma';
import { parseDateRange, filterCases, buildUsageReport, organizationOptions } from '../../../../../lib/image-integrity-usage';
import {
  requireInstitutionImageIntegrityAccess,
  institutionCasesWhere,
} from '../../../../../lib/image-integrity-institution';

/**
 * GET /api/institution/image-integrity/usage
 * Usage Report for administrators: Summary + Detail (sessions, monthly,
 * account, group, lab) over a date range, scoped to this institution.
 */
export async function GET(request) {
  try {
    const auth = await requireInstitutionImageIntegrityAccess(request);
    if (auth.errorResponse) return auth.errorResponse;
    const { institution } = auth;

    const { searchParams } = new URL(request.url);
    const view = searchParams.get('view') === 'detail' ? 'detail' : 'summary';
    const type = ['submissions', 'sessions', 'monthly', 'account', 'group', 'lab'].includes(
      searchParams.get('type')
    )
      ? searchParams.get('type')
      : 'submissions';
    const org = searchParams.get('org') || 'all';
    const { start, end, error } = parseDateRange(searchParams.get('start_date'), searchParams.get('end_date'));
    if (error) {
      return NextResponse.json({ error }, { status: 400 });
    }

    const cases = await prisma.imageIntegrityCase.findMany({
      where: institutionCasesWhere(institution),
      include: {
        submittedBy: {
          select: {
            id: true,
            givenName: true,
            familyName: true,
            email: true,
            primaryInstitution: true,
            secondaryInstitution: { select: { name: true } },
            researchProfile: { select: { department: true } },
          },
        },
        labUnit: { select: { id: true, name: true } },
        collection: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    const organizations = organizationOptions(cases);
    const filtered = filterCases(cases, { start, end, org });
    const report = buildUsageReport(filtered, { view, type });

    return NextResponse.json({
      success: true,
      filters: {
        view,
        type,
        org,
        start_date: searchParams.get('start_date') || null,
        end_date: searchParams.get('end_date') || null,
        total_matched: filtered.length,
      },
      ...report,
      organizations,
    });
  } catch (error) {
    console.error('Institution Image Integrity usage report error:', error);
    return NextResponse.json({ error: 'Failed to load usage report' }, { status: 500 });
  }
}
