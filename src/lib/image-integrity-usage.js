/**
 * Aggregate local ImageIntegrityCase records into ImaChek-style usage reports.
 * ImaChek's admin dashboard exposes Summary + Detail (Sessions, Monthly,
 * Account, Group, Lab/Unit). We recreate that from Hospitium submissions so
 * institutions can audit usage even though the external API has no usage
 * endpoint.
 */

function endOfDay(date) {
  const d = new Date(date);
  d.setHours(23, 59, 59, 999);
  return d;
}

function startOfDay(date) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

function monthKey(value) {
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return null;
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

function monthLabel(key) {
  const [year, month] = String(key).split('-');
  const d = new Date(Number(year), Number(month) - 1, 1);
  return d.toLocaleString(undefined, { month: 'short', year: 'numeric' });
}

function isFlagged(record) {
  return (record.manipulationCount || 0) > 0 || (record.similarityLevel?.high || 0) > 0 || (record.similarityCount || 0) > 0;
}

function displayName(user) {
  if (!user) return 'Unknown';
  return `${user.givenName || ''} ${user.familyName || ''}`.trim() || user.email || 'Unknown';
}

function contributorOf(record) {
  const named = (record.contributor || '').trim();
  return named || displayName(record.submittedBy);
}

function departmentOf(record) {
  return record.submittedBy?.researchProfile?.department?.trim() || '';
}

function labOf(record) {
  return (
    record.submittedBy?.primaryInstitution?.trim() ||
    record.submittedBy?.secondaryInstitution?.name?.trim() ||
    ''
  );
}

export function parseDateRange(startDate, endDate) {
  const start = startDate ? startOfDay(startDate) : null;
  const end = endDate ? endOfDay(endDate) : null;
  if (start && Number.isNaN(start.getTime())) return { start: null, end: null, error: 'Invalid start_date. Use YYYY-MM-DD.' };
  if (end && Number.isNaN(end.getTime())) return { start: null, end: null, error: 'Invalid end_date. Use YYYY-MM-DD.' };
  return { start, end, error: null };
}

export function filterCases(cases, { start, end, org } = {}) {
  return (cases || []).filter((record) => {
    const created = new Date(record.createdAt);
    if (start && created < start) return false;
    if (end && created > end) return false;

    if (org && org !== 'all') {
      if (org.startsWith('group:')) {
        if (departmentOf(record) !== org.slice('group:'.length)) return false;
      } else if (org.startsWith('lab:')) {
        if (labOf(record) !== org.slice('lab:'.length)) return false;
      }
    }
    return true;
  });
}

export function organizationOptions(cases) {
  const groups = new Set();
  const labs = new Set();
  for (const record of cases || []) {
    const dept = departmentOf(record);
    const lab = labOf(record);
    if (dept) groups.add(dept);
    if (lab) labs.add(lab);
  }
  return {
    groups: [...groups].sort().map((name) => ({ value: `group:${name}`, label: name })),
    labs: [...labs].sort().map((name) => ({ value: `lab:${name}`, label: name })),
  };
}

function emptyMonthBucket(key) {
  return {
    month: key,
    label: monthLabel(key),
    submissions: 0,
    completed: 0,
    failed: 0,
    processing: 0,
    flagged: 0,
    researchers: new Set(),
    researcherDays: new Set(),
    contributors: new Set(),
    manipulation: 0,
    similarity: 0,
  };
}

function monthSeries(cases) {
  const byMonth = new Map();
  for (const record of cases) {
    const key = monthKey(record.createdAt);
    if (!key) continue;
    if (!byMonth.has(key)) byMonth.set(key, emptyMonthBucket(key));
    const bucket = byMonth.get(key);
    bucket.submissions += 1;
    if (record.status === 'COMPLETED') bucket.completed += 1;
    else if (record.status === 'FAILED') bucket.failed += 1;
    else bucket.processing += 1;
    if (isFlagged(record)) bucket.flagged += 1;
    if (record.submittedById) {
      bucket.researchers.add(record.submittedById);
      bucket.researcherDays.add(`${record.submittedById}:${key}`);
    }
    bucket.contributors.add(contributorOf(record));
    bucket.manipulation += record.manipulationCount || 0;
    bucket.similarity += record.similarityCount || 0;
  }

  return [...byMonth.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([, bucket]) => ({
      ...bucket,
      uniqueResearchers: bucket.researchers.size,
      sessions: bucket.researcherDays.size,
      contributors: [...bucket.contributors].sort().join(', '),
      researchers: undefined,
      researcherDays: undefined,
    }));
}

function totalsFrom(cases, monthly) {
  const uniqueResearchers = new Set(cases.map((c) => c.submittedById).filter(Boolean));
  const byFormat = {};
  for (const record of cases) {
    const format = (record.fileFormat || 'unknown').toLowerCase();
    byFormat[format] = (byFormat[format] || 0) + 1;
  }
  return {
    submissions: cases.length,
    completed: cases.filter((c) => c.status === 'COMPLETED').length,
    failed: cases.filter((c) => c.status === 'FAILED').length,
    processing: cases.filter((c) => c.status === 'PROCESSING' || c.status === 'UPLOADING').length,
    flagged: cases.filter(isFlagged).length,
    uniqueResearchers: uniqueResearchers.size,
    manipulation: cases.reduce((sum, c) => sum + (c.manipulationCount || 0), 0),
    similarity: cases.reduce((sum, c) => sum + (c.similarityCount || 0), 0),
    byFormat,
    monthsCovered: monthly.length,
  };
}

function byAccount(cases) {
  const map = new Map();
  for (const record of cases) {
    const id = record.submittedById || 'unknown';
    if (!map.has(id)) {
      map.set(id, {
        accountId: id,
        name: displayName(record.submittedBy),
        email: record.submittedBy?.email || '',
        department: departmentOf(record) || '—',
        lab: labOf(record) || '—',
        submissions: 0,
        completed: 0,
        failed: 0,
        flagged: 0,
        manipulation: 0,
        similarity: 0,
        lastSubmitted: null,
        contributorNames: new Set(),
      });
    }
    const row = map.get(id);
    row.submissions += 1;
    if (record.status === 'COMPLETED') row.completed += 1;
    if (record.status === 'FAILED') row.failed += 1;
    if (isFlagged(record)) row.flagged += 1;
    row.manipulation += record.manipulationCount || 0;
    row.similarity += record.similarityCount || 0;
    row.contributorNames.add(contributorOf(record));
    if (!row.lastSubmitted || new Date(record.createdAt) > new Date(row.lastSubmitted)) {
      row.lastSubmitted = record.createdAt;
    }
  }
  return [...map.values()]
    .map((row) => ({
      ...row,
      contributor: [...row.contributorNames].sort().join(', '),
      contributorNames: undefined,
    }))
    .sort((a, b) => b.submissions - a.submissions);
}

function bySubmission(cases) {
  return [...(cases || [])]
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .map((record) => ({
      id: record.id,
      submittedAt: record.createdAt,
      title: record.title,
      fileName: record.fileName,
      contributor: contributorOf(record),
      account: displayName(record.submittedBy),
      email: record.submittedBy?.email || '',
      department: departmentOf(record) || '—',
      lab: labOf(record) || '—',
      status: record.status,
      flagged: isFlagged(record),
      manipulation: record.manipulationCount || 0,
      similarity: record.similarityCount || 0,
    }));
}

function byDimension(cases, getKey, emptyLabel) {
  const map = new Map();
  for (const record of cases) {
    const key = getKey(record) || emptyLabel;
    if (!map.has(key)) {
      map.set(key, {
        name: key,
        submissions: 0,
        completed: 0,
        flagged: 0,
        uniqueResearchers: new Set(),
        manipulation: 0,
        similarity: 0,
      });
    }
    const row = map.get(key);
    row.submissions += 1;
    if (record.status === 'COMPLETED') row.completed += 1;
    if (isFlagged(record)) row.flagged += 1;
    if (record.submittedById) row.uniqueResearchers.add(record.submittedById);
    row.manipulation += record.manipulationCount || 0;
    row.similarity += record.similarityCount || 0;
  }
  return [...map.values()]
    .map((row) => ({
      ...row,
      uniqueResearchers: row.uniqueResearchers.size,
    }))
    .sort((a, b) => b.submissions - a.submissions);
}

export function buildUsageReport(cases, { view = 'summary', type = 'submissions' } = {}) {
  const monthly = monthSeries(cases);
  const summary = totalsFrom(cases, monthly);
  const configuredGroups = byDimension(cases, departmentOf, '').filter((row) => row.name);
  const groups = byDimension(cases, departmentOf, 'Unassigned');
  const labs = byDimension(cases, labOf, 'Unassigned');

  const detail = {
    submissions: bySubmission(cases),
    sessions: monthly.map((row) => ({
      month: row.month,
      label: row.label,
      sessions: row.uniqueResearchers,
      submissions: row.submissions,
      contributors: row.contributors,
    })),
    monthly,
    account: byAccount(cases),
    group: groups,
    lab: labs,
  };

  return {
    view,
    type,
    summary,
    monthly,
    detail: detail[type] || detail.monthly,
    groupsConfigured: configuredGroups.length > 0,
    organizations: organizationOptions(cases),
  };
}
