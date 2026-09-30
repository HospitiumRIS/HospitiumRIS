import { NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/auth-server';
import {
  getOwnedInstitution,
  institutionMemberWhere,
  resolveInstitutionMemberScope,
} from '@/lib/institution-admin';

const INSTITUTION_ROLES = ['RESEARCH_ADMIN', 'INSTITUTION_ADMIN'];

/**
 * Resolve which Institution row scopes researcher submissions for an admin.
 */
export function resolveInstitutionScope(user) {
  return user?.secondaryInstitution || user?.institution || null;
}

/**
 * Resolve authenticated institution admin access for Image Integrity routes.
 */
export async function requireInstitutionImageIntegrityAccess(request) {
  const user = await getAuthenticatedUser(request);

  if (!user) {
    return {
      errorResponse: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }),
    };
  }

  if (!INSTITUTION_ROLES.includes(user.accountType)) {
    return {
      errorResponse: NextResponse.json({ error: 'Forbidden' }, { status: 403 }),
    };
  }

  let institution = resolveInstitutionScope(user);
  if (!institution) {
    institution = await getOwnedInstitution(user);
  }
  if (!institution) {
    return {
      errorResponse: NextResponse.json(
        { error: 'No institution linked to this account.' },
        { status: 403 }
      ),
    };
  }

  const { verifiedDomains, memberWhere } = await resolveInstitutionMemberScope(institution);

  return { user, institution, verifiedDomains, memberWhere };
}

/**
 * Prisma where clause limiting cases to institution members (incl. verified domains).
 */
export function institutionCasesWhere(institution, verifiedDomains = []) {
  return {
    submittedBy: institutionMemberWhere(institution, verifiedDomains),
  };
}
