/**
 * Attendance rules (#92). Pure: no database access.
 *
 * Attendance % = (PRESENT + LATE) / counted sessions, where counted sessions are the
 * training's SCHEDULED sessions that count towards attendance and have started.
 * EXCUSED sessions are removed from the denominator when the training's
 * `excludeExcusedSessions` is on (the default, decision D5); otherwise they count
 * as missed. Sessions with no record yet count as missed once they have started.
 */

export const ATTENDANCE_STATUSES = ['PRESENT', 'LATE', 'ABSENT', 'EXCUSED'];
export const ATTENDANCE_METHODS = ['MANUAL', 'QR', 'CODE', 'VIRTUAL_JOIN', 'IMPORT'];

export const ATTENDANCE_LABELS = {
  PRESENT: 'Present',
  LATE: 'Late',
  ABSENT: 'Absent',
  EXCUSED: 'Excused',
};

export const ATTENDED_STATUSES = ['PRESENT', 'LATE'];

export function isValidAttendanceStatus(status) {
  return ATTENDANCE_STATUSES.includes(status);
}

/** Sessions that count towards attendance at `now`. */
export function countedSessions(sessions, now = new Date()) {
  return (sessions || []).filter(
    (s) => s.status === 'SCHEDULED' && s.isAttendanceRequired !== false && new Date(s.startsAt) <= now
  );
}

/**
 * @param {object[]} sessions   training sessions (status, isAttendanceRequired, startsAt, id)
 * @param {object[]} records    this registration's attendance rows (sessionId, status)
 * @param {{ excludeExcused?: boolean, now?: Date }} [options]
 * @returns {{ percent: number|null, attended, late, absent, excused, unmarked, counted }}
 *   percent is null when no session has been held yet.
 */
export function computeAttendance(sessions, records, { excludeExcused = true, now = new Date() } = {}) {
  const counted = countedSessions(sessions, now);
  const bySession = new Map((records || []).map((r) => [r.sessionId, r.status]));

  let attended = 0;
  let late = 0;
  let absent = 0;
  let excused = 0;
  let unmarked = 0;
  for (const session of counted) {
    const status = bySession.get(session.id);
    if (status === 'PRESENT') attended += 1;
    else if (status === 'LATE') { attended += 1; late += 1; }
    else if (status === 'EXCUSED') excused += 1;
    else if (status === 'ABSENT') absent += 1;
    else unmarked += 1;
  }

  const denominator = counted.length - (excludeExcused ? excused : 0);
  const percent = denominator > 0
    ? Math.round((attended / denominator) * 1000) / 10
    : (counted.length > 0 ? 100 : null); // every held session excused: nothing missed

  return { percent, attended, late, absent, excused, unmarked, counted: counted.length };
}

/** Per-session totals for the register header. */
export function sessionAttendanceSummary(session, records, activeRegistrationCount) {
  const rows = (records || []).filter((r) => r.sessionId === session.id);
  const count = (status) => rows.filter((r) => r.status === status).length;
  const present = count('PRESENT');
  const late = count('LATE');
  const marked = rows.length;
  return {
    present,
    late,
    absent: count('ABSENT'),
    excused: count('EXCUSED'),
    unmarked: Math.max(0, activeRegistrationCount - marked),
    rate: activeRegistrationCount > 0 ? Math.round(((present + late) / activeRegistrationCount) * 1000) / 10 : null,
  };
}

/**
 * Validate a bulk attendance update for one session.
 * @param {object} body   { records: [{ registrationId, status|null, note? }] }
 * @param {Set<string>} activeRegistrationIds
 * @returns {{ ok: true, upserts, clears } | { ok: false, error }}
 */
export function validateAttendanceUpdate(body, activeRegistrationIds) {
  const records = body?.records;
  if (!Array.isArray(records) || records.length === 0) {
    return { ok: false, error: 'records must be a non-empty array' };
  }
  if (records.length > 2000) return { ok: false, error: 'Too many records in one request' };

  const seen = new Set();
  const upserts = [];
  const clears = [];
  for (const record of records) {
    const registrationId = record?.registrationId;
    if (!registrationId || !activeRegistrationIds.has(registrationId)) {
      return { ok: false, error: 'Unknown or inactive registration for this training' };
    }
    if (seen.has(registrationId)) return { ok: false, error: 'Each participant can appear only once' };
    seen.add(registrationId);

    if (record.status === null || record.status === '') {
      clears.push(registrationId);
      continue;
    }
    if (!isValidAttendanceStatus(record.status)) {
      return { ok: false, error: `Invalid attendance status "${record.status}". Allowed: ${ATTENDANCE_STATUSES.join(', ')}` };
    }
    const note = record.note === undefined ? undefined : String(record.note || '').trim().slice(0, 500) || null;
    upserts.push({ registrationId, status: record.status, note });
  }
  return { ok: true, upserts, clears };
}

/** Bulk actions for one session: which participants get which status. */
export function bulkMarkRecords(action, registrationIds, existingBySession) {
  if (action === 'all-present') {
    return registrationIds.map((registrationId) => ({ registrationId, status: 'PRESENT' }));
  }
  if (action === 'remaining-absent') {
    return registrationIds
      .filter((id) => !existingBySession.has(id))
      .map((registrationId) => ({ registrationId, status: 'ABSENT' }));
  }
  return [];
}
