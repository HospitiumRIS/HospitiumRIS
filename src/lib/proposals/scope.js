/**
 * Proposal visibility rules (tenant isolation).
 *
 * Pure functions only: no Prisma, no Next.js imports. They build Prisma `where`
 * fragments and make access decisions from plain data, so they can be unit-tested
 * and ported to the Python backend unchanged.
 *
 * Who may see a proposal:
 *   - GLOBAL_ADMIN: every proposal.
 *   - RESEARCH_ADMIN / INSTITUTION_ADMIN: proposals of their own institution only.
 *   - Everyone else: proposals they are personally involved in, meaning they created
 *     it, are the PI (ORCID), are a co-investigator, or are the grant follow-up user.
 *   - Anyone without a session: nothing.
 *
 * A proposal belongs to the institution recorded when it was created
 * (`proposal.institutionId`). Rows created before that column existed fall back to
 * membership of the people involved; see institutionProposalWhere().
 */

export const PROPOSAL_ADMIN_ROLES = ['RESEARCH_ADMIN', 'INSTITUTION_ADMIN'];

/** A where clause that matches nothing (Prisma rejects `in: []` in some contexts). */
export const NO_PROPOSALS_WHERE = Object.freeze({ id: { in: ['__none__'] } });

/** Statuses a researcher may move their own proposal to through PATCH. */
export const OWNER_SETTABLE_STATUSES = Object.freeze({
  // resubmitting after the institution asked for changes
  REVISION_REQUESTED: ['UNDER_REVIEW'],
});

/** Statuses in which the creator / PI may still delete their proposal. */
export const OWNER_DELETABLE_STATUSES = Object.freeze(['DRAFT', 'REJECTED']);

export function bareOrcid(value) {
  const match = String(value || '').match(/\d{4}-\d{4}-\d{4}-\d{3}[\dX]/i);
  return match ? match[0].toUpperCase() : null;
}

/** ORCID values as they may be stored on proposals: bare and URL form. */
export function orcidVariants(value) {
  const orcid = bareOrcid(value);
  return orcid ? [orcid, `https://orcid.org/${orcid}`] : [];
}

const lower = (value) => String(value || '').trim().toLowerCase();

/** Institution a user acts for: verified membership first, then an owned institution. */
export function userInstitutionId(user) {
  if (!user) return null;
  return user.secondaryInstitutionId || user.institution?.id || null;
}

export function isProposalAdmin(user) {
  return Boolean(user && PROPOSAL_ADMIN_ROLES.includes(user.accountType));
}

export function isGlobalAdmin(user) {
  return user?.accountType === 'GLOBAL_ADMIN';
}

/** True when the user appears in the proposal's coInvestigators JSON (by id, ORCID or email). */
export function isCoInvestigator(user, proposal) {
  if (!user || !Array.isArray(proposal?.coInvestigators)) return false;
  const orcid = bareOrcid(user.orcidId);
  const email = lower(user.email);
  return proposal.coInvestigators.some((ci) => {
    if (!ci || typeof ci !== 'object') return false;
    if (ci.userId && ci.userId === user.id) return true;
    const ciOrcid = bareOrcid(ci.orcidId || ci.orcid);
    if (orcid && ciOrcid && ciOrcid === orcid) return true;
    return Boolean(email && ci.email && lower(ci.email) === email);
  });
}

/** Creator, PI, co-investigator or grant follow-up user. */
export function isPersonallyInvolved(user, proposal) {
  if (!user || !proposal) return false;
  if (proposal.createdById && proposal.createdById === user.id) return true;
  if (proposal.grantFollowUpUserId && proposal.grantFollowUpUserId === user.id) return true;
  const orcid = bareOrcid(user.orcidId);
  if (orcid && bareOrcid(proposal.principalInvestigatorOrcid) === orcid) return true;
  return isCoInvestigator(user, proposal);
}

/**
 * Proposals a user is personally involved in.
 * @param {object} user
 * @param {string[]} coInvestigatorProposalIds IDs found by scanning coInvestigators JSON
 *   (Prisma cannot filter inside Json[] arrays portably; see findCoInvestigatorProposalIds).
 */
export function personalProposalWhere(user, coInvestigatorProposalIds = []) {
  if (!user?.id) return NO_PROPOSALS_WHERE;
  const clauses = [{ createdById: user.id }, { grantFollowUpUserId: user.id }];
  const variants = orcidVariants(user.orcidId);
  if (variants.length) clauses.push({ principalInvestigatorOrcid: { in: variants } });
  if (coInvestigatorProposalIds.length) clauses.push({ id: { in: [...new Set(coInvestigatorProposalIds)] } });
  return { OR: clauses };
}

/**
 * Proposals belonging to an institution.
 *
 * Rows that carry `institutionId` are matched on it directly. Older rows (no
 * institutionId yet) are attributed through the people involved: created by a member,
 * PI ORCID of a member, or a member's follow-up / manuscript link. Rows recorded for a
 * different institution are always excluded, so a researcher who moves does not take
 * their old institution's proposals with them.
 *
 * Deliberately NOT used any more: the free-text `departments` array (anyone could type
 * another institution's name) and membership of a review pipeline (pipelines were
 * shared across institutions).
 *
 * @param {string} institutionId
 * @param {{ memberIds?: string[], memberOrcids?: string[] }} members
 */
export function institutionProposalWhere(institutionId, { memberIds = [], memberOrcids = [] } = {}) {
  if (!institutionId) return NO_PROPOSALS_WHERE;

  const legacy = [];
  if (memberIds.length) {
    legacy.push({ createdById: { in: memberIds } });
    legacy.push({ grantFollowUpUserId: { in: memberIds } });
    legacy.push({ manuscripts: { some: { manuscript: { createdBy: { in: memberIds } } } } });
  }
  const variants = [...new Set(memberOrcids.flatMap((orcid) => orcidVariants(orcid)))];
  if (variants.length) legacy.push({ principalInvestigatorOrcid: { in: variants } });

  const clauses = [{ institutionId }];
  if (legacy.length) clauses.push({ AND: [{ institutionId: null }, { OR: legacy }] });
  return { OR: clauses };
}

/** Which scope the proposal list uses for this user: 'none' | 'all' | 'institution' | 'personal'. */
export function proposalListMode(user) {
  if (!user) return 'none';
  if (isGlobalAdmin(user)) return 'all';
  if (isProposalAdmin(user)) return userInstitutionId(user) ? 'institution' : 'personal';
  return 'personal';
}

/**
 * Read / edit access to one proposal.
 * @param {object} user
 * @param {object} proposal needs id, createdById, institutionId, principalInvestigatorOrcid,
 *   coInvestigators, grantFollowUpUserId
 * @param {{ inInstitutionScope?: boolean }} ctx  for admins: whether the proposal falls inside
 *   their institution's scope (computed by the caller with institutionProposalWhere)
 */
export function canAccessProposalWith(user, proposal, { inInstitutionScope = false } = {}) {
  if (!user || !proposal) return false;
  if (isGlobalAdmin(user)) return true;
  if (isPersonallyInvolved(user, proposal)) return true;
  if (isProposalAdmin(user)) {
    const institutionId = userInstitutionId(user);
    if (!institutionId) return false;
    if (proposal.institutionId) return proposal.institutionId === institutionId;
    return Boolean(inInstitutionScope);
  }
  return false;
}

/**
 * May this user apply this PATCH (status / award) to the proposal?
 * Institution admins with access may set any status; the creator/PI may only resubmit.
 * Returns { ok: true } or { ok: false, status, error }.
 */
export function authorizeProposalPatch(user, proposal, { status, awardedAmount } = {}, { hasAccess = false } = {}) {
  if (!hasAccess) return { ok: false, status: 404, error: 'Proposal not found' };
  if (isGlobalAdmin(user) || isProposalAdmin(user)) return { ok: true };

  const wantsAward = awardedAmount !== undefined && awardedAmount !== null;
  if (wantsAward) {
    return { ok: false, status: 403, error: 'Only the research office can record an award' };
  }
  if (!status) return { ok: true };
  const allowed = OWNER_SETTABLE_STATUSES[proposal.status] || [];
  if (allowed.includes(status)) return { ok: true };
  return { ok: false, status: 403, error: 'You cannot change this proposal to that status' };
}

/** May this user delete the proposal? Returns { ok, status?, error? }. */
export function authorizeProposalDelete(user, proposal, { hasAccess = false } = {}) {
  if (!hasAccess) return { ok: false, status: 404, error: 'Proposal not found' };
  if (isGlobalAdmin(user)) return { ok: true };
  if (!isPersonallyInvolved(user, proposal)) {
    return { ok: false, status: 403, error: 'Only the proposal owner can delete it' };
  }
  if (!OWNER_DELETABLE_STATUSES.includes(proposal.status)) {
    return { ok: false, status: 409, error: 'Only draft or rejected proposals can be deleted' };
  }
  return { ok: true };
}
