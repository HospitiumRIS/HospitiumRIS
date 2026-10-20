import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getAuthenticatedUser } from '@/lib/auth-server';
import { DIRECTORY_ACCOUNT_TYPES } from '@/lib/institution-directory';

const ORCID_PATTERN = /^\d{4}-\d{4}-\d{4}-\d{3}[\dX]$/i;
const MAX_ORCIDS = 25;

/**
 * GET /api/researcher/institution-directory/match?orcids=0000-...,0000-...
 * Flags which ORCID iDs belong to registered Hospitium users.
 * Email and department are only returned for colleagues at the caller's own
 * institution; users elsewhere are reported as registered without contact details.
 */
export async function GET(request) {
  try {
    const user = await getAuthenticatedUser(request);
    if (!user) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const orcids = [...new Set(
      (searchParams.get('orcids') || '')
        .split(',')
        .map((value) => value.trim().toUpperCase())
        .filter((value) => ORCID_PATTERN.test(value)),
    )].slice(0, MAX_ORCIDS);

    if (!orcids.length) return NextResponse.json({ success: true, matches: {} });

    const institutionId = user.secondaryInstitutionId || user.institution?.id || null;

    const users = await prisma.user.findMany({
      where: {
        orcidId: { in: orcids },
        status: 'ACTIVE',
        deletedAt: null,
        anonymizedAt: null,
      },
      select: {
        id: true,
        accountType: true,
        emailVerified: true,
        orcidId: true,
        email: true,
        secondaryInstitutionId: true,
        secondaryInstitution: { select: { name: true } },
        researchProfile: { select: { department: true } },
      },
    });

    const matches = {};
    for (const match of users) {
      const key = match.orcidId.toUpperCase();
      const isCurrentUser = match.id === user.id;
      // Contact details are only prefilled for verified researcher colleagues
      const sameInstitution = Boolean(institutionId)
        && match.secondaryInstitutionId === institutionId
        && !isCurrentUser
        && match.emailVerified
        && DIRECTORY_ACCOUNT_TYPES.includes(match.accountType);

      // Prefer a same-institution record if more than one account shares an ORCID iD
      if (matches[key]?.sameInstitution) continue;

      matches[key] = sameInstitution
        ? {
            registered: true,
            sameInstitution: true,
            userId: match.id,
            email: match.email,
            department: match.researchProfile?.department?.trim() || '',
            institution: match.secondaryInstitution?.name || '',
          }
        : { registered: true, sameInstitution: false, isCurrentUser };
    }

    return NextResponse.json({ success: true, matches });
  } catch (error) {
    console.error('Institution directory match error:', error);
    return NextResponse.json({ success: false, error: 'Failed to match researchers' }, { status: 500 });
  }
}
