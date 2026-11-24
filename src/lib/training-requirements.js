/**
 * Training requirements (compliance v2): standing rules such as "all Nursing staff
 * complete BLS every 24 months". A requirement is met by completing any training
 * (cohort) linked to it. Pure: no database access.
 *
 * Person × requirement states
 *   COMPLIANT    completed, still valid
 *   EXPIRING     completed, validity ends within 30 days
 *   DUE          enrolled in a cohort, due date not passed
 *   OVERDUE      enrolled, due date passed
 *   EXPIRED      completed before, validity ended, not re-enrolled
 *   MISSING      never completed, not enrolled
 *   EXEMPT       exempted by an admin
 *   NOT_REQUIRED the person's department is outside the requirement
 */

const DAY = 24 * 60 * 60 * 1000;
export const EXPIRING_DAYS = 30;
export const REQUIREMENT_STATES = ['OVERDUE', 'EXPIRED', 'MISSING', 'DUE', 'EXPIRING', 'COMPLIANT', 'EXEMPT', 'NOT_REQUIRED'];
export const REQUIREMENT_STATE_LABELS = {
  OVERDUE: 'Overdue',
  EXPIRED: 'Expired',
  MISSING: 'Not done',
  DUE: 'Enrolled',
  EXPIRING: 'Expiring',
  COMPLIANT: 'Compliant',
  EXEMPT: 'Exempt',
  NOT_REQUIRED: 'Not required',
};
const COUNTS_AS_COMPLIANT = new Set(['COMPLIANT', 'EXPIRING']);
const ACTIVE = new Set(['REGISTERED', 'PENDING_APPROVAL', 'WAITLISTED']);

const norm = (v) => String(v || '').trim().toLowerCase();
const addMonths = (date, months) => {
  const d = new Date(date);
  const day = d.getUTCDate();
  d.setUTCMonth(d.getUTCMonth() + months);
  if (d.getUTCDate() < day) d.setUTCDate(0); // 31 Jan + 1 month → 28/29 Feb
  return d;
};

/**
 * Validate a requirement.
 * @returns {{ ok: true, data } | { ok: false, error }}
 */
export function validateRequirement(body) {
  const b = body || {};
  const title = typeof b.title === 'string' ? b.title.trim().slice(0, 200) : '';
  if (!title) return { ok: false, error: 'Name the requirement, e.g. "Basic Life Support"' };
  const departments = [...new Set((Array.isArray(b.departments) ? b.departments : []).map((d) => String(d || '').trim()).filter(Boolean))].slice(0, 50);
  const validity = b.validityMonths === null || b.validityMonths === '' || b.validityMonths === undefined ? null : Number(b.validityMonths);
  if (validity !== null && (!Number.isInteger(validity) || validity < 1 || validity > 120)) return { ok: false, error: 'Valid for must be 1 to 120 months, or empty for no expiry' };
  const due = b.dueWithinDays === undefined || b.dueWithinDays === '' ? 30 : Number(b.dueWithinDays);
  if (!Number.isInteger(due) || due < 1 || due > 365) return { ok: false, error: 'Due within must be 1 to 365 days' };
  return {
    ok: true,
    data: {
      title,
      description: typeof b.description === 'string' && b.description.trim() ? b.description.trim().slice(0, 2000) : null,
      departments,
      validityMonths: validity,
      dueWithinDays: due,
      autoAssign: b.autoAssign !== false,
      isActive: b.isActive !== false,
    },
  };
}

/** Does the requirement apply to someone in this department? (empty = everyone) */
export function appliesTo(requirement, department) {
  const list = requirement?.departments || [];
  if (!list.length) return true;
  return list.map(norm).includes(norm(department));
}

/** When a completion stops counting: the certificate's expiry, else completion + validity. */
export function validUntil(registration, requirement) {
  if (registration.certificate?.expiresAt && registration.certificate.status !== 'REVOKED') return new Date(registration.certificate.expiresAt);
  if (!requirement?.validityMonths) return null;
  const done = registration.completedAt || registration.training?.endDate;
  return done ? addMonths(done, requirement.validityMonths) : null;
}

/**
 * State of one person for one requirement.
 * @param {object} args
 *   requirement   { id, departments, validityMonths }
 *   department    the person's department
 *   registrations the person's registrations in trainings linked to the requirement
 *                 [{ id, status, completedAt, dueDate, trainingId, training: { endDate, startDate, title }, certificate }]
 *   exempt        an exemption for this person and requirement, if any
 * @returns {{ state, until?, dueDate?, registrationId?, trainingId?, completedAt? }}
 */
export function requirementState({ requirement, department, registrations = [], exempt = null }, now = new Date()) {
  if (!appliesTo(requirement, department)) return { state: 'NOT_REQUIRED' };
  if (exempt) return { state: 'EXEMPT', reason: exempt.reason || null };

  const completions = registrations
    .filter((r) => r.status === 'COMPLETED')
    .map((r) => ({ r, until: validUntil(r, requirement), at: new Date(r.completedAt || r.training?.endDate || 0) }))
    .sort((a, b) => b.at - a.at);
  const latest = completions[0];
  if (latest && (!latest.until || latest.until > now)) {
    const soon = latest.until && latest.until.getTime() - now.getTime() <= EXPIRING_DAYS * DAY;
    // Already enrolled in the next cohort while expiring: still compliant, show expiring.
    return { state: soon ? 'EXPIRING' : 'COMPLIANT', until: latest.until, completedAt: latest.at, registrationId: latest.r.id, trainingId: latest.r.trainingId };
  }

  const active = registrations
    .filter((r) => ACTIVE.has(r.status) && (!r.training?.endDate || new Date(r.training.endDate) >= new Date((latest?.until || 0))))
    .sort((a, b) => new Date(a.training?.startDate || 0) - new Date(b.training?.startDate || 0))[0];
  if (active) {
    const overdue = active.dueDate && new Date(active.dueDate) < now;
    return { state: overdue ? 'OVERDUE' : 'DUE', dueDate: active.dueDate || null, registrationId: active.id, trainingId: active.trainingId };
  }
  if (latest) return { state: 'EXPIRED', until: latest.until, completedAt: latest.at };
  return { state: 'MISSING' };
}

/** Was the person compliant on a given date? null when not required then. */
export function compliantOn({ requirement, department, registrations = [], exempt = null }, date) {
  if (!appliesTo(requirement, department)) return null;
  if (exempt && new Date(exempt.createdAt || 0) <= date) return null; // exempt people are left out
  return registrations.some((r) => {
    if (r.status !== 'COMPLETED') return false;
    const at = new Date(r.completedAt || r.training?.endDate || 0);
    if (at > date) return false;
    const until = validUntil(r, requirement);
    return !until || until > date;
  });
}

/** % compliant among the people a requirement applies to (exempt excluded). */
export function percent(states) {
  const counted = states.filter((s) => s !== 'NOT_REQUIRED' && s !== 'EXEMPT');
  if (!counted.length) return null;
  return Math.round((counted.filter((s) => COUNTS_AS_COMPLIANT.has(s)).length / counted.length) * 1000) / 10;
}

/**
 * Matrix of people × requirements, with totals.
 * @param {{ requirements, people: [{ id, name, email, department }], regsByUserReq: Map<string, object[]>, exemptions: Map<string, object> }} input
 *   keys are `${userId}|${requirementId}`
 */
export function buildMatrix({ requirements = [], people = [], regsByUserReq = new Map(), exemptions = new Map() }, now = new Date()) {
  const rows = people.map((p) => {
    const cells = {};
    for (const req of requirements) {
      const key = `${p.id}|${req.id}`;
      cells[req.id] = requirementState({ requirement: req, department: p.department, registrations: regsByUserReq.get(key) || [], exempt: exemptions.get(key) || null }, now);
    }
    const states = Object.values(cells).map((c) => c.state);
    return { ...p, cells, percent: percent(states), worst: REQUIREMENT_STATES.find((s) => states.includes(s)) || 'NOT_REQUIRED' };
  });
  const byRequirement = requirements.map((req) => {
    const states = rows.map((r) => r.cells[req.id].state);
    const count = (s) => states.filter((x) => x === s).length;
    return {
      id: req.id,
      title: req.title,
      validityMonths: req.validityMonths,
      departments: req.departments || [],
      required: states.filter((s) => s !== 'NOT_REQUIRED').length,
      ...Object.fromEntries(REQUIREMENT_STATES.map((s) => [s, count(s)])),
      percent: percent(states),
    };
  });
  const allStates = rows.flatMap((r) => Object.values(r.cells).map((c) => c.state));
  const departments = new Map();
  for (const r of rows) {
    const key = r.department || 'Not set';
    departments.set(key, [...(departments.get(key) || []), ...Object.values(r.cells).map((c) => c.state)]);
  }
  const byDepartment = [...departments.entries()].map(([key, states]) => ({
    key,
    people: rows.filter((r) => (r.department || 'Not set') === key).length,
    required: states.filter((s) => s !== 'NOT_REQUIRED').length,
    compliant: states.filter((s) => COUNTS_AS_COMPLIANT.has(s)).length,
    overdue: states.filter((s) => s === 'OVERDUE').length,
    gaps: states.filter((s) => s === 'MISSING' || s === 'EXPIRED').length,
    percent: percent(states),
  })).filter((d) => d.required).sort((a, b) => (a.percent ?? 101) - (b.percent ?? 101));
  const total = (s) => allStates.filter((x) => x === s).length;
  return {
    rows,
    byRequirement,
    byDepartment,
    totals: {
      required: allStates.filter((s) => s !== 'NOT_REQUIRED').length,
      ...Object.fromEntries(REQUIREMENT_STATES.map((s) => [s, total(s)])),
      percent: percent(allStates),
    },
  };
}

/** Month-end dates for the last n months (oldest first), the last one being now. */
export function monthEnds(n, now = new Date()) {
  const out = [];
  for (let i = n - 1; i >= 1; i -= 1) out.push(new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - i + 1, 1) - 1));
  out.push(now);
  return out;
}

/**
 * Compliance % at each month end. Uses people as they are now (departments may have
 * changed); completions and validity are historical.
 */
export function complianceTrend({ requirements = [], people = [], regsByUserReq = new Map(), exemptions = new Map() }, months = 12, now = new Date()) {
  return monthEnds(months, now).map((date) => {
    let required = 0;
    let compliant = 0;
    for (const p of people) {
      for (const req of requirements) {
        if (req.createdAt && new Date(req.createdAt) > date) continue;
        const key = `${p.id}|${req.id}`;
        const ok = compliantOn({ requirement: req, department: p.department, registrations: regsByUserReq.get(key) || [], exempt: exemptions.get(key) || null }, date);
        if (ok === null) continue;
        required += 1;
        if (ok) compliant += 1;
      }
    }
    const key = `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, '0')}`;
    return { key, date, required, compliant, percent: required ? Math.round((compliant / required) * 1000) / 10 : null };
  });
}

/**
 * Who to enrol where (auto-assign). People who are MISSING, EXPIRED or EXPIRING go into
 * the earliest upcoming published cohort of the requirement that still has places.
 * Already-enrolled people are left alone, so running it again changes nothing.
 * @param {object} args
 *   requirement { id, dueWithinDays }
 *   rows        matrix rows (with cells)
 *   cohorts     [{ id, title, startDate, endDate, status, maxParticipants, taken }]  linked trainings
 * @returns {{ assign: [{ userId, trainingId, dueDate }], noCohort: string[] }}
 */
export function planAutoAssign({ requirement, rows = [], cohorts = [] }, now = new Date()) {
  const open = cohorts
    .filter((c) => c.status === 'PUBLISHED' && new Date(c.startDate) > now)
    .sort((a, b) => new Date(a.startDate) - new Date(b.startDate))
    .map((c) => ({ ...c, free: Math.max(0, (c.maxParticipants || 0) - (c.taken || 0)) }));
  const assign = [];
  const noCohort = [];
  for (const row of rows) {
    const cell = row.cells?.[requirement.id];
    if (!cell || !['MISSING', 'EXPIRED', 'EXPIRING'].includes(cell.state)) continue;
    const cohort = open.find((c) => c.free > 0);
    if (!cohort) { noCohort.push(row.id); continue; }
    cohort.free -= 1;
    const byPolicy = new Date(now.getTime() + (requirement.dueWithinDays || 30) * DAY);
    const afterCohort = new Date(new Date(cohort.endDate).getTime() + 7 * DAY);
    // Due by the policy, but never before the cohort can be finished; before expiry if expiring.
    let dueDate = byPolicy > afterCohort ? byPolicy : afterCohort;
    if (cell.state === 'EXPIRING' && cell.until && new Date(cell.until) > afterCohort) dueDate = new Date(cell.until);
    assign.push({ userId: row.id, trainingId: cohort.id, dueDate });
  }
  return { assign, noCohort };
}

/** Things to act on from the matrix. */
export function requirementAttention({ byRequirement = [], cohortsByRequirement = new Map() }, now = new Date()) {
  const items = [];
  for (const r of byRequirement) {
    if (r.OVERDUE) items.push({ kind: 'OVERDUE', severity: 'high', requirementId: r.id, count: r.OVERDUE, title: `${r.OVERDUE} overdue: ${r.title}`, action: 'Remind', tab: 'people', filter: { requirementId: r.id, state: 'OVERDUE' } });
    const gaps = r.MISSING + r.EXPIRED;
    const upcoming = (cohortsByRequirement.get(r.id) || []).filter((c) => c.status === 'PUBLISHED' && new Date(c.startDate) > now);
    if (gaps && !upcoming.length) items.push({ kind: 'NO_COHORT', severity: 'high', requirementId: r.id, count: gaps, title: `${gaps} need ${r.title}, but no upcoming cohort`, action: 'Schedule a cohort', href: '/institution/training' });
    else if (gaps) items.push({ kind: 'GAPS', severity: 'medium', requirementId: r.id, count: gaps, title: `${gaps} not enrolled for ${r.title}`, action: 'Assign', tab: 'matrix', filter: { requirementId: r.id, state: 'GAP' } });
    if (r.EXPIRING) items.push({ kind: 'EXPIRING', severity: 'low', requirementId: r.id, count: r.EXPIRING, title: `${r.EXPIRING} expiring within ${EXPIRING_DAYS} days: ${r.title}`, action: 'See who', tab: 'matrix', filter: { requirementId: r.id, state: 'EXPIRING' } });
  }
  const rank = { high: 0, medium: 1, low: 2 };
  return items.sort((a, b) => rank[a.severity] - rank[b.severity] || b.count - a.count);
}

const d10 = (v) => (v ? new Date(v).toISOString().slice(0, 10) : '');

/** Rows for the Excel / CSV export of the compliance page. */
export function complianceSheets(data) {
  const reqs = data.requirements.filter((r) => r.isActive);
  const t = data.matrix.totals;
  const assigned = data.assigned?.totals || {};
  return {
    Summary: [
      { Measure: 'Compliant (requirements)', Value: t.percent === null ? '' : `${t.percent}%` },
      { Measure: 'Compliant last month', Value: data.previousPercent === null || data.previousPercent === undefined ? '' : `${data.previousPercent}%` },
      { Measure: 'Overdue', Value: t.OVERDUE },
      { Measure: 'Expired', Value: t.EXPIRED },
      { Measure: 'Not done', Value: t.MISSING },
      { Measure: 'Expiring within 30 days', Value: t.EXPIRING },
      { Measure: 'Exempt', Value: t.EXEMPT },
      { Measure: 'Assigned trainings: assigned', Value: assigned.assigned ?? '' },
      { Measure: 'Assigned trainings: overdue', Value: assigned.overdue ?? '' },
    ],
    'By requirement': data.matrix.byRequirement.map((r) => ({
      Requirement: r.title,
      Departments: r.departments.length ? r.departments.join(', ') : 'Everyone',
      'Valid for (months)': r.validityMonths ?? 'No expiry',
      Required: r.required,
      Compliant: r.COMPLIANT,
      Expiring: r.EXPIRING,
      Enrolled: r.DUE,
      Overdue: r.OVERDUE,
      Expired: r.EXPIRED,
      'Not done': r.MISSING,
      Exempt: r.EXEMPT,
      'Compliant %': r.percent ?? '',
    })),
    'By department': data.matrix.byDepartment.map((d) => ({ Department: d.key, People: d.people, Required: d.required, Compliant: d.compliant, Overdue: d.overdue, Gaps: d.gaps, 'Compliant %': d.percent ?? '' })),
    Matrix: data.matrix.rows.map((row) => ({
      Name: row.name,
      Email: row.email,
      Department: row.department || '',
      ...Object.fromEntries(reqs.map((r) => {
        const c = row.cells[r.id];
        const label = REQUIREMENT_STATE_LABELS[c.state];
        const extra = c.until ? ` (to ${d10(c.until)})` : c.dueDate ? ` (due ${d10(c.dueDate)})` : '';
        return [r.title.slice(0, 60), c.state === 'NOT_REQUIRED' ? '' : `${label}${extra}`];
      })),
      'Compliant %': row.percent ?? '',
    })),
    People: (data.assigned?.people || []).map((p) => ({
      Name: p.name, Email: p.email, Department: p.department || '', Training: p.trainingTitle, Source: p.source, Status: p.status, State: p.state,
      'Due date': d10(p.dueDate), Completed: d10(p.completedAt), 'Certificate expires': d10(p.certificateExpiresAt), 'Exemption reason': p.exemptReason || '',
    })),
    Trend: data.trend.map((m) => ({ Month: m.key, Required: m.required, Compliant: m.compliant, 'Compliant %': m.percent ?? '' })),
  };
}
