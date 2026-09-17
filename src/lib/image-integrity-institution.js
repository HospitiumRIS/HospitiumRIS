import { NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/auth-server';
import { getOwnedInstitution } from '@/lib/institution-admin';

const INSTITUTION_ROLES = ['RESEARCH_ADMIN', 'INSTITUTION_ADMIN'];

/**
 * Resolve which Institution row scopes researcher submissions for an admin.
 * Prefer secondaryInstitution (domain-verified tenant link) over the owned
 * Institution row — researchers are always linked via secondaryInstitutionId,
 * and admins can have both rows when they own one org record but were also
 * domain-linked to the canonical verified institution.
 */
export function resolveInstitutionScope(user) {
  return user?.secondaryInstitution || user?.institution || null;
}

/**
 * Resolve authenticated institution admin access for Image Integrity routes.
 * Returns { user, institution } or { errorResponse }.
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

  return { user, institution };
}

/**
 * Prisma where clause limiting cases to the admin's institution.
 */
export function institutionCasesWhere(institution) {
  const submitterConditions = [{ secondaryInstitutionId: institution.id }];
  if (institution.userId) {
    submitterConditions.push({ id: institution.userId });
  }

  return {
    submittedBy: {
      OR: submitterConditions,
    },
  };
}
