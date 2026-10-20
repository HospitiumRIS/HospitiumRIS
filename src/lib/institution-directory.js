/**
 * Shared helpers for the researcher institution directory
 * (proposal PI / co-investigator search).
 */

// Only researcher accounts are listed; research administrators and other
// institution roles are excluded from the directory and from ORCID matching.
export const DIRECTORY_ACCOUNT_TYPES = ['RESEARCHER'];

export const DIRECTORY_PAGE_SIZES = [10, 25, 50];

export function resolveDirectoryInstitution(user) {
  const institution = user?.secondaryInstitution || user?.institution || null;
  return institution ? { id: institution.id, name: institution.name } : null;
}

export function activeMemberWhere(institutionId) {
  return {
    secondaryInstitutionId: institutionId,
    status: 'ACTIVE',
    emailVerified: true,
    deletedAt: null,
    anonymizedAt: null,
    accountType: { in: DIRECTORY_ACCOUNT_TYPES },
  };
}

export function toDirectoryResearcher(member, institutionName) {
  const department = member.researchProfile?.department?.trim() || '';
  const academicTitle = member.researchProfile?.academicTitle?.trim() || '';
  return {
    userId: member.id,
    givenNames: member.givenName,
    familyName: member.familyName,
    creditName: `${member.givenName || ''} ${member.familyName || ''}`.trim(),
    orcidId: member.orcidId || '',
    email: member.email,
    department,
    academicTitle,
    employmentSummary: academicTitle,
    avatarUrl: member.avatarUrl || null,
    publicationCount: member._count?.publications ?? null,
    institution: institutionName,
    affiliations: [institutionName],
    hospitium: {
      registered: true,
      sameInstitution: true,
      userId: member.id,
      email: member.email,
      department,
      institution: institutionName,
    },
  };
}
