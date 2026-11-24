/**
 * Who may read and act on proposal reviews, ethics reviews, grant applications and
 * manuscript citations (#6, audit G-1). Pure: no database, no Next.js. Routes load the
 * data and pass the facts in; the acting user always comes from the session.
 */

export const REVIEW_ADMIN_ROLES = ['RESEARCH_ADMIN', 'INSTITUTION_ADMIN'];

const lower = (v) => String(v || '').trim().toLowerCase();

export function isReviewAdmin(user) {
  return Boolean(user && (REVIEW_ADMIN_ROLES.includes(user.accountType) || user.accountType === 'GLOBAL_ADMIN'));
}

/** Display identity of the signed-in reviewer: never taken from the request body. */
export function reviewerIdentity(user) {
  const name = `${user?.givenName || ''} ${user?.familyName || ''}`.trim();
  return { reviewerId: user?.id || null, reviewerName: name || user?.email || 'Reviewer', reviewerEmail: user?.email || '' };
}

/** Is the user one of the reviewers assigned to a pipeline stage (by email)? */
export function isAssignedStageReviewer(user, stageProgress, stage) {
  const email = lower(user?.email);
  if (!email) return false;
  const assigned = [
    ...(Array.isArray(stageProgress?.assignedReviewers) ? stageProgress.assignedReviewers : []),
    ...(Array.isArray(stage?.reviewerEmails) ? stage.reviewerEmails : []),
  ];
  return assigned.some((e) => lower(e) === email);
}

/** Assigned to any stage of this proposal's review. */
export function isAssignedProposalReviewer(user, stageProgressList = []) {
  return stageProgressList.some((sp) => isAssignedStageReviewer(user, sp, sp.stage));
}

/**
 * Proposal review permissions.
 * @param {object} user
 * @param {{ inScope: boolean, involved: boolean, assigned: boolean }} facts
 *   inScope   the proposal is visible to the user (institution scope for admins, involvement for others)
 *   involved  the user is creator, PI, co-investigator or follow-up user
 *   assigned  the user is an assigned reviewer of a stage
 */
export function proposalReviewPermissions(user, { inScope = false, involved = false, assigned = false } = {}) {
  if (!user) return { read: false, decide: false, reviewStage: false, submit: false, linkEthics: false };
  const admin = isReviewAdmin(user) && inScope;
  return {
    // Reviews and review status: the research office, assigned reviewers, and the people on the proposal.
    read: admin || assigned || (inScope && involved),
    // The institution's decision (approve, reject, ask for revision): research office only.
    decide: admin && !involved,
    // A stage review: an assigned reviewer, or the research office; never someone reviewing their own proposal.
    reviewStage: (assigned || admin) && !involved,
    // Submitting and linking ethics: the people on the proposal.
    submit: inScope && involved,
    linkEthics: inScope && (involved || admin),
  };
}

/**
 * Which ethics applications a list request may return.
 * @returns {{ mode: 'all' | 'institution' | 'own' | 'none' }}
 *   Researchers only ever see their own; admins see their institution unless they ask
 *   for their own (`mine`, or `userId` equal to their own ID). A `userId` for anyone
 *   else is ignored for non-admins and refused for admins (no cross-user lookup).
 */
export function ethicsListScope(user, { userId = null, mine = false } = {}) {
  if (!user) return { mode: 'none' };
  if (mine || (userId && userId === user.id)) return { mode: 'own' };
  if (user.accountType === 'GLOBAL_ADMIN') return { mode: 'all' };
  if (REVIEW_ADMIN_ROLES.includes(user.accountType)) return { mode: 'institution' };
  return { mode: 'own' };
}

/**
 * Ethics decisions: research office of the applicant's institution (or global admin),
 * never on their own application.
 */
export function canDecideEthics(user, application, { sharesTenant = false } = {}) {
  if (!user || !application) return false;
  if (application.userId === user.id) return false;
  if (user.accountType === 'GLOBAL_ADMIN') return true;
  return REVIEW_ADMIN_ROLES.includes(user.accountType) && sharesTenant;
}

/** Grant applications (legacy tracker) are personal: owner only. */
export function canUseGrantApplication(user, application) {
  return Boolean(user && application && application.userId === user.id);
}

/** Manuscript citations: the creator or a collaborator. */
export function canUseManuscript(user, manuscript) {
  if (!user || !manuscript) return false;
  if (manuscript.createdBy === user.id) return true;
  return (manuscript.collaborators || []).some((c) => c.userId === user.id);
}
