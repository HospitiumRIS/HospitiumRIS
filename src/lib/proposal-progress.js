/**
 * Milestones and deliverables of a proposal/project (stored as JSON arrays), turned
 * into a flow with a clear state each: done, overdue, due soon or upcoming. Also the
 * lifecycle stage shown at the top of the proposal page. Pure (no DB).
 */

const DONE = new Set(['completed', 'complete', 'done', 'delivered', 'achieved', 'accepted']);
const DAY = 86400000;
export const DUE_SOON_DAYS = 30;

const norm = (v) => String(v || '').trim().toLowerCase().replace(/[\s-]+/g, '_');
const toDate = (v) => {
  if (!v) return null;
  const d = new Date(v);
  return Number.isNaN(d.getTime()) ? null : d;
};
const startOfDay = (d) => { const x = new Date(d); x.setHours(0, 0, 0, 0); return x; };

export const STATE_META = {
  done: { label: 'Done', tone: 'success' },
  delivered: { label: 'Delivered', tone: 'success' },
  overdue: { label: 'Overdue', tone: 'danger' },
  due_soon: { label: 'Due soon', tone: 'warning' },
  in_progress: { label: 'In progress', tone: 'info' },
  upcoming: { label: 'Upcoming', tone: 'neutral' },
  no_date: { label: 'No due date', tone: 'neutral' },
  cancelled: { label: 'Cancelled', tone: 'neutral' },
};

function stateFor({ done, doneLabel, status, due }, now) {
  if (done) return doneLabel;
  if (status === 'cancelled' || status === 'canceled') return 'cancelled';
  if (!due) return status === 'in_progress' ? 'in_progress' : 'no_date';
  const days = Math.round((startOfDay(due) - startOfDay(now)) / DAY);
  if (days < 0) return 'overdue';
  if (days <= DUE_SOON_DAYS) return 'due_soon';
  return status === 'in_progress' ? 'in_progress' : 'upcoming';
}

const daysFrom = (due, now) => (due ? Math.round((startOfDay(due) - startOfDay(now)) / DAY) : null);

export function isMilestoneComplete(m) {
  return Boolean(m && (m.completed === true || DONE.has(norm(m.status))));
}

export function isDeliverableDelivered(d) {
  return Boolean(d && (d.deliveredAt || d.delivered === true || DONE.has(norm(d.status))));
}

export function milestoneFlow(milestones = [], now = new Date()) {
  return (Array.isArray(milestones) ? milestones : []).map((m, index) => {
    const due = toDate(m?.targetDate || m?.dueDate);
    const done = isMilestoneComplete(m);
    const state = stateFor({ done, doneLabel: 'done', status: norm(m?.status), due }, now);
    return {
      index,
      id: m?.id || `ms-${index}`,
      title: m?.title || m?.description || `Milestone ${index + 1}`,
      description: m?.title ? m?.description || '' : '',
      due,
      doneAt: toDate(m?.completedDate || m?.completedAt),
      progress: Math.max(0, Math.min(100, Number(m?.progress) || 0)),
      state,
      ...STATE_META[state],
      daysLeft: done ? null : daysFrom(due, now),
    };
  }).sort(byDue);
}

export function deliverableFlow(deliverables = [], milestones = [], now = new Date()) {
  const msTitles = new Map((Array.isArray(milestones) ? milestones : []).filter((m) => m?.id).map((m) => [m.id, m.title]));
  return (Array.isArray(deliverables) ? deliverables : []).map((d, index) => {
    const item = typeof d === 'string' ? { title: d } : d || {};
    const due = toDate(item.dueDate || item.deadline);
    const done = isDeliverableDelivered(item);
    const state = stateFor({ done, doneLabel: 'delivered', status: norm(item.status), due }, now);
    return {
      index,
      id: item.id || `dl-${index}`,
      title: item.title || item.description || `Deliverable ${index + 1}`,
      description: item.title ? item.description || '' : '',
      type: item.type || null,
      milestone: item.milestoneId ? msTitles.get(item.milestoneId) || null : null,
      due,
      doneAt: toDate(item.deliveredAt || item.completedAt),
      deliveredByName: item.deliveredByName || null,
      deliveryNote: item.deliveryNote || null,
      state,
      ...STATE_META[state],
      daysLeft: done ? null : daysFrom(due, now),
    };
  }).sort(byDue);
}

function byDue(a, b) {
  const ad = a.due ? a.due.getTime() : Number.MAX_SAFE_INTEGER;
  const bd = b.due ? b.due.getTime() : Number.MAX_SAFE_INTEGER;
  return ad - bd || a.index - b.index;
}

export function flowSummary(items) {
  const doneStates = new Set(['done', 'delivered']);
  const done = items.filter((i) => doneStates.has(i.state)).length;
  const open = items.filter((i) => !doneStates.has(i.state) && i.state !== 'cancelled');
  return {
    total: items.length,
    done,
    percent: items.length ? Math.round((done / items.length) * 100) : 0,
    overdue: items.filter((i) => i.state === 'overdue').length,
    dueSoon: items.filter((i) => i.state === 'due_soon').length,
    next: open.find((i) => i.due) || open[0] || null,
  };
}

/** Human "due in" text. */
export function dueText(item) {
  if (!item) return '';
  if (item.doneAt && (item.state === 'done' || item.state === 'delivered')) return '';
  if (item.daysLeft === null || item.daysLeft === undefined) return '';
  if (item.daysLeft < 0) return `${-item.daysLeft} day${item.daysLeft === -1 ? '' : 's'} overdue`;
  if (item.daysLeft === 0) return 'Due today';
  if (item.daysLeft === 1) return 'Due tomorrow';
  if (item.daysLeft <= 60) return `Due in ${item.daysLeft} days`;
  return `Due in ${Math.round(item.daysLeft / 30)} months`;
}

export const LIFECYCLE = ['DRAFT', 'IN_REVIEW', 'APPROVED', 'ACTIVE', 'COMPLETED'];
export const LIFECYCLE_LABELS = { DRAFT: 'Draft', IN_REVIEW: 'In review', APPROVED: 'Approved', ACTIVE: 'Active', COMPLETED: 'Completed' };

/**
 * Where the proposal/project is. Returns { steps:[{key,label,state:'done'|'current'|'todo'}], current, flag }
 * flag = REVISION_REQUESTED | REJECTED when the normal path is interrupted.
 */
export function lifecycle({ status, startDate, endDate }, now = new Date()) {
  let current = 'DRAFT';
  let flag = null;
  if (status === 'SUBMITTED' || status === 'UNDER_REVIEW') current = 'IN_REVIEW';
  else if (status === 'REVISION_REQUESTED') { current = 'IN_REVIEW'; flag = 'REVISION_REQUESTED'; }
  else if (status === 'REJECTED') { current = 'IN_REVIEW'; flag = 'REJECTED'; }
  else if (status === 'APPROVED') {
    const start = toDate(startDate);
    const end = toDate(endDate);
    if (end && now > end) current = 'COMPLETED';
    else if (!start || now >= start) current = 'ACTIVE';
    else current = 'APPROVED';
  }
  const at = LIFECYCLE.indexOf(current);
  const steps = LIFECYCLE.map((key, i) => ({
    key,
    label: LIFECYCLE_LABELS[key],
    state: i < at || (current === 'COMPLETED' && i === at) ? 'done' : i === at ? 'current' : 'todo',
  }));
  return { steps, current, flag };
}

export function timeElapsed(startDate, endDate, now = new Date()) {
  const start = toDate(startDate);
  const end = toDate(endDate);
  if (!start || !end || end <= start) return null;
  return Math.max(0, Math.min(100, Math.round(((now - start) / (end - start)) * 100)));
}

export function durationMonths(startDate, endDate) {
  const start = toDate(startDate);
  const end = toDate(endDate);
  if (!start || !end || end <= start) return null;
  return Math.max(1, Math.round((end - start) / (DAY * 30.44)));
}

/**
 * Mark a deliverable delivered (or undo). Finds it by id, falling back to its index
 * for older rows without ids. Returns { deliverables } or { error }.
 */
export function setDeliverableDelivered(deliverables, { id, index, delivered, note, user }, now = new Date()) {
  const list = Array.isArray(deliverables) ? deliverables.map((d) => (typeof d === 'string' ? { title: d } : { ...d })) : [];
  let at = id ? list.findIndex((d) => d.id === id) : -1;
  if (at < 0 && Number.isInteger(index) && index >= 0 && index < list.length && (!id || !list[index].id || id === `dl-${index}`)) at = index;
  if (at < 0) return { error: 'Deliverable not found' };
  const d = list[at];
  if (delivered) {
    if (isDeliverableDelivered(d)) return { error: 'Already marked as delivered' };
    list[at] = {
      ...d,
      id: d.id || `dl-${index ?? at}`,
      status: 'delivered',
      deliveredAt: now.toISOString(),
      deliveredById: user?.id || null,
      deliveredByName: user ? `${user.givenName || ''} ${user.familyName || ''}`.trim() || user.email || null : null,
      deliveryNote: typeof note === 'string' && note.trim() ? note.trim().slice(0, 500) : null,
    };
  } else {
    if (!isDeliverableDelivered(d)) return { error: 'Not marked as delivered' };
    const { deliveredAt, deliveredById, deliveredByName, deliveryNote, delivered: _d, ...rest } = d;
    list[at] = { ...rest, status: 'pending' };
  }
  return { deliverables: list, deliverable: list[at] };
}
