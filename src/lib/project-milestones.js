/**
 * Proposal milestones are stored as JSON. The researcher tracking page records
 * progress in `status` ("Completed", "In Progress", ...); older records may use
 * a boolean `completed`. Treat either as done.
 */
const DONE_STATUSES = new Set(['completed', 'complete', 'done', 'delivered']);

export function isMilestoneDone(milestone) {
  if (!milestone) return false;
  if (milestone.completed === true) return true;
  return DONE_STATUSES.has(String(milestone.status || '').trim().toLowerCase().replace(/_/g, ' '));
}

export function milestoneProgress(milestones) {
  const list = Array.isArray(milestones) ? milestones : [];
  const done = list.filter(isMilestoneDone).length;
  return { done, total: list.length, percent: list.length ? Math.round((done / list.length) * 100) : 0 };
}
