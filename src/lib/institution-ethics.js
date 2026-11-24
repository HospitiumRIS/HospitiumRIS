/**
 * Institution ethics applications register (#21): rows, tabs, summary figures and
 * export rows for the research office. Pure: no database.
 */

const DAY = 24 * 60 * 60 * 1000;
export const EXPIRING_DAYS = 60;

export const ETHICS_STATUS_LABELS = {
  DRAFT: 'Draft',
  SUBMITTED: 'Submitted',
  UNDER_REVIEW: 'Under review',
  APPROVED: 'Approved',
  CONDITIONAL_APPROVAL: 'Conditional approval',
  REJECTED: 'Rejected',
  REVISION_REQUESTED: 'Revision requested',
  WITHDRAWN: 'Withdrawn',
  EXPIRED: 'Expired',
};

/** Register tabs and which statuses (or expiry rules) they hold. */
export const ETHICS_TABS = [
  { key: 'all', label: 'All' },
  { key: 'to_review', label: 'To review', statuses: ['SUBMITTED', 'UNDER_REVIEW'] },
  { key: 'approved', label: 'Approved', statuses: ['APPROVED', 'CONDITIONAL_APPROVAL'] },
  { key: 'expiring', label: `Expiring in ${EXPIRING_DAYS} days` },
  { key: 'with_researcher', label: 'With researcher', statuses: ['DRAFT', 'REVISION_REQUESTED'] },
  { key: 'closed', label: 'Closed', statuses: ['REJECTED', 'WITHDRAWN', 'EXPIRED'] },
];

const name = (u) => (u ? `${u.givenName || ''} ${u.familyName || ''}`.trim() || u.email : null);

/**
 * One register row. An approval past its expiry date shows as Expired even if the stored
 * status was not updated; an uploaded external certificate is marked as such.
 */
export function ethicsRow(app, owner, now = new Date()) {
  const expires = app.expiryDate ? new Date(app.expiryDate) : null;
  const approved = app.status === 'APPROVED' || app.status === 'CONDITIONAL_APPROVAL';
  const lapsed = approved && expires && expires < now;
  const daysToExpiry = approved && expires && !lapsed ? Math.ceil((expires - now) / DAY) : null;
  const status = lapsed ? 'EXPIRED' : app.status;
  return {
    id: app.id,
    referenceNumber: app.referenceNumber || null,
    title: app.title,
    principalInvestigator: app.principalInvestigator || name(owner) || '—',
    applicant: owner ? { id: owner.id, name: name(owner), email: owner.email } : null,
    department: app.department || null,
    researchType: app.researchType || null,
    riskLevel: app.riskLevel || null,
    committeeName: app.committeeName || null,
    status,
    statusLabel: ETHICS_STATUS_LABELS[status] || status,
    external: app.source === 'EXTERNAL_CERTIFICATE',
    source: app.source || null,
    submittedDate: app.submittedDate || null,
    approvalDate: app.approvalDate || null,
    expiryDate: app.expiryDate || null,
    daysToExpiry,
    expiringSoon: daysToExpiry !== null && daysToExpiry <= EXPIRING_DAYS,
    linkedProposals: app._count?.linkedProposals ?? 0,
    createdAt: app.createdAt,
    updatedAt: app.updatedAt,
  };
}

export function inTab(row, tab) {
  if (!tab || tab === 'all') return true;
  if (tab === 'expiring') return row.expiringSoon;
  const def = ETHICS_TABS.find((t) => t.key === tab);
  return Boolean(def?.statuses?.includes(row.status));
}

export function tabCounts(rows) {
  return Object.fromEntries(ETHICS_TABS.map((t) => [t.key, rows.filter((r) => inTab(r, t.key)).length]));
}

/** Headline figures for the stat cards. */
export function ethicsSummary(rows) {
  const counts = tabCounts(rows);
  return {
    total: rows.length,
    toReview: counts.to_review,
    approved: counts.approved,
    expiring: counts.expiring,
    expired: rows.filter((r) => r.status === 'EXPIRED').length,
    withResearcher: counts.with_researcher,
    external: rows.filter((r) => r.external).length,
  };
}

export function filterEthicsRows(rows, { tab = 'all', search = '', department = 'all' } = {}) {
  const q = search.trim().toLowerCase();
  return rows.filter((r) => inTab(r, tab)
    && (department === 'all' || r.department === department)
    && (!q || `${r.title} ${r.referenceNumber || ''} ${r.principalInvestigator} ${r.department || ''} ${r.committeeName || ''}`.toLowerCase().includes(q)));
}

const d10 = (v) => (v ? new Date(v).toISOString().slice(0, 10) : '');

export function ethicsExportRows(rows) {
  return rows.map((r) => ({
    Reference: r.referenceNumber || '',
    Title: r.title,
    'Principal investigator': r.principalInvestigator,
    Department: r.department || '',
    'Research type': r.researchType || '',
    Risk: r.riskLevel || '',
    Committee: r.committeeName || '',
    Status: r.statusLabel,
    Source: r.external ? 'External certificate' : 'Application',
    Submitted: d10(r.submittedDate),
    Approved: d10(r.approvalDate),
    Expires: d10(r.expiryDate),
    'Days to expiry': r.daysToExpiry ?? '',
    'Linked proposals': r.linkedProposals,
  }));
}
