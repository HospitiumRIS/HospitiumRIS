/**
 * Server-side proposal visibility: feeds the pure rules in ./scope.js from the database.
 * Every route that lists or opens proposals should go through proposalListWhere() or
 * canAccessProposal() instead of building its own filter.
 */
import prisma from '@/lib/prisma';
import { getInstitutionMemberIds } from '@/lib/institution-admin';
import {
  NO_PROPOSALS_WHERE,
  canAccessProposalWith,
  institutionProposalWhere,
  isCoInvestigator,
  isProposalAdmin,
  personalProposalWhere,
  proposalListMode,
  userInstitutionId,
} from './scope.js';

/** Fields canAccessProposal() needs; add to any `select` used before an access check. */
export const PROPOSAL_ACCESS_SELECT = Object.freeze({
  id: true,
  status: true,
  createdById: true,
  institutionId: true,
  principalInvestigatorOrcid: true,
  coInvestigators: true,
  grantFollowUpUserId: true,
});

/**
 * IDs of proposals listing the user as a co-investigator.
 * coInvestigators is a Json[] column, so this scans it in application code (the same
 * approach as lib/researcher-output.js). Replace with a ProposalMember table later.
 */
export async function findCoInvestigatorProposalIds(user) {
  if (!user?.id) return [];
  const rows = await prisma.proposal.findMany({
    select: { id: true, coInvestigators: true },
  });
  return rows.filter((row) => isCoInvestigator(user, row)).map((row) => row.id);
}

/** Member user IDs and ORCID iDs of an institution. */
export async function getInstitutionMembers(institutionId) {
  if (!institutionId) return { memberIds: [], memberOrcids: [] };
  const institution = await prisma.institution.findUnique({
    where: { id: institutionId },
    select: { id: true, userId: true, name: true },
  });
  if (!institution) return { memberIds: [], memberOrcids: [] };
  const memberIds = await getInstitutionMemberIds(institution);
  const withOrcid = memberIds.length
    ? await prisma.user.findMany({
        where: { id: { in: memberIds }, orcidId: { not: null } },
        select: { orcidId: true },
      })
    : [];
  return { memberIds, memberOrcids: withOrcid.map((row) => row.orcidId) };
}

/** Prisma where clause for an institution's proposals. */
export async function institutionProposalScopeWhere(institutionId, members = null) {
  if (!institutionId) return NO_PROPOSALS_WHERE;
  const resolved = members || (await getInstitutionMembers(institutionId));
  return institutionProposalWhere(institutionId, resolved);
}

/**
 * Where clause for "the proposals this user may see". Returns null when there is no
 * user, so the caller can answer 401.
 */
export async function proposalListWhere(user) {
  const mode = proposalListMode(user);
  if (mode === 'none') return null;
  if (mode === 'all') return {};
  if (mode === 'institution') return institutionProposalScopeWhere(userInstitutionId(user));
  return personalProposalWhere(user, await findCoInvestigatorProposalIds(user));
}

/** Combine a visibility clause with route-specific filters. */
export function withVisibility(visibilityWhere, extraWhere = {}) {
  if (!visibilityWhere || Object.keys(visibilityWhere).length === 0) return extraWhere;
  if (!extraWhere || Object.keys(extraWhere).length === 0) return visibilityWhere;
  return { AND: [visibilityWhere, extraWhere] };
}

/**
 * Can this user open / change this proposal? `proposal` must include the fields in
 * PROPOSAL_ACCESS_SELECT. For admins and legacy rows (no institutionId) this checks the
 * institution scope in the database.
 */
export async function canAccessProposal(user, proposal) {
  if (!user || !proposal) return false;
  if (canAccessProposalWith(user, proposal)) return true;
  if (!isProposalAdmin(user) || proposal.institutionId) return false;

  const institutionId = userInstitutionId(user);
  if (!institutionId) return false;
  const scopeWhere = await institutionProposalScopeWhere(institutionId);
  const match = await prisma.proposal.findFirst({
    where: { AND: [{ id: proposal.id }, scopeWhere] },
    select: { id: true },
  });
  return canAccessProposalWith(user, proposal, { inInstitutionScope: Boolean(match) });
}

/** Load a proposal by ID only if the user may access it; otherwise null (answer 404). */
export async function findAccessibleProposal(user, id, select = null) {
  if (!user || !id) return null;
  const proposal = await prisma.proposal.findUnique({
    where: { id },
    select: { ...PROPOSAL_ACCESS_SELECT, ...(select || {}) },
  });
  if (!proposal) return null;
  return (await canAccessProposal(user, proposal)) ? proposal : null;
}

/** Proposals the user is personally involved in (creator, PI, co-investigator, follow-up). */
export async function myProposalsWhere(user) {
  if (!user?.id) return NO_PROPOSALS_WHERE;
  return personalProposalWhere(user, await findCoInvestigatorProposalIds(user));
}
