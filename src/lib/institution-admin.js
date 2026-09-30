import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getAuthenticatedUser } from '@/lib/auth-server';
import { getInstitutionVerifiedDomains } from '@/lib/institution-domain';

const ALLOWED_ACCOUNT_TYPES = ['INSTITUTION_ADMIN', 'RESEARCH_ADMIN'];

export async function requireInstitutionAdmin() {
  const user = await getAuthenticatedUser();

  if (!user) {
    return {
      error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }),
    };
  }

  if (!ALLOWED_ACCOUNT_TYPES.includes(user.accountType)) {
    return {
      error: NextResponse.json(
        { error: 'Forbidden - Institution Admin access required' },
        { status: 403 }
      ),
    };
  }

  return { user };
}

/**
 * Build a Prisma where clause for institution members:
 * - explicitly linked via secondaryInstitutionId
 * - institution owner
 * - email matches any verified domain (unless linked to a different institution)
 */
export function institutionMemberWhere(institution, verifiedDomains = []) {
  const clauses = [{ secondaryInstitutionId: institution.id }];

  if (institution.userId) {
    clauses.push({ id: institution.userId });
  }

  for (const domain of verifiedDomains) {
    const normalized = domain?.toLowerCase?.()?.trim();
    if (!normalized) continue;

    clauses.push({
      AND: [
        { email: { endsWith: `@${normalized}`, mode: 'insensitive' } },
        {
          OR: [
            { secondaryInstitutionId: null },
            { secondaryInstitutionId: institution.id },
          ],
        },
      ],
    });
  }

  return {
    AND: [{ OR: clauses }, { accountType: { not: 'GLOBAL_ADMIN' } }],
  };
}

export async function resolveInstitutionMemberScope(institution) {
  const verifiedDomains = await getInstitutionVerifiedDomains(prisma, institution.id);
  return {
    verifiedDomains,
    memberWhere: institutionMemberWhere(institution, verifiedDomains),
  };
}

export async function getInstitutionMemberIds(institution, options = {}) {
  const scope =
    options.memberWhere != null
      ? {
          memberWhere: options.memberWhere,
          verifiedDomains: options.verifiedDomains || [],
        }
      : await resolveInstitutionMemberScope(institution);

  const members = await prisma.user.findMany({
    where: scope.memberWhere,
    select: { id: true },
  });

  return members.map((member) => member.id);
}

const SAFE_USER_SELECT = {
  id: true,
  accountType: true,
  status: true,
  givenName: true,
  familyName: true,
  email: true,
  emailVerified: true,
  orcidId: true,
  primaryInstitution: true,
  secondaryInstitutionId: true,
  institutionVerifiedAt: true,
  createdAt: true,
  updatedAt: true,
};

export async function fetchInstitutionScopedData(institution, scope = 'all') {
  const { memberWhere } = await resolveInstitutionMemberScope(institution);
  const userIds = await getInstitutionMemberIds(institution, { memberWhere });

  const fetchUsers = () =>
    prisma.user.findMany({
      where: memberWhere,
      select: SAFE_USER_SELECT,
    });

  const fetchManuscripts = () =>
    userIds.length
      ? prisma.manuscript.findMany({
          where: { createdBy: { in: userIds } },
          include: {
            creator: { select: SAFE_USER_SELECT },
          },
        })
      : Promise.resolve([]);

  const fetchPublications = () =>
    userIds.length
      ? prisma.publication.findMany({
          where: { authorRelations: { some: { userId: { in: userIds } } } },
          include: {
            authorRelations: {
              include: { user: { select: SAFE_USER_SELECT } },
            },
          },
        })
      : Promise.resolve([]);

  const fetchProposals = async () => {
    const tracking = await prisma.proposalReviewTracking.findMany({
      where: { pipeline: { institutionId: institution.id } },
      include: { proposal: true },
    });
    return tracking.map((entry) => entry.proposal);
  };

  switch (scope) {
    case 'users':
      return { users: await fetchUsers() };
    case 'manuscripts':
      return { manuscripts: await fetchManuscripts() };
    case 'publications':
      return { publications: await fetchPublications() };
    case 'proposals':
      return { proposals: await fetchProposals() };
    case 'all':
    default:
      return {
        users: await fetchUsers(),
        manuscripts: await fetchManuscripts(),
        publications: await fetchPublications(),
        proposals: await fetchProposals(),
      };
  }
}

export async function getOwnedInstitution(user, extra = {}) {
  if (!user) return null;

  const include = extra.include || undefined;

  const byOwner = await prisma.institution.findUnique({
    where: { userId: user.id },
    include,
  });
  if (byOwner) return byOwner;

  if (user.secondaryInstitutionId) {
    return prisma.institution.findUnique({
      where: { id: user.secondaryInstitutionId },
      include,
    });
  }

  return null;
}
