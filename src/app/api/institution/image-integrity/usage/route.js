import { NextResponse } from 'next/server';
import prisma from '../../../../../lib/prisma';
import { getAuthenticatedUser } from '../../../../../lib/auth-server';
import { parseDateRange, filterCases, buildUsageReport, organizationOptions } from '../../../../../lib/image-integrity-usage';

const INSTITUTION_ROLES = ['RESEARCH_ADMIN', 'INSTITUTION_ADMIN'];

/**
 * GET /api/institution/image-integrity/usage
 * Usage Report for administrators: Summary + Detail (sessions, monthly,
 * account, group, lab) over a date range, with optional org filter.
 */
export async function GET(request) {
  try {
    const user = await getAuthenticatedUser(request);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    if (!INSTITUTION_ROLES.includes(user.accountType)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

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
