/**
 * Attendance spreadsheets (#95): export rows, and planning an import of the same
 * layout. Pure: no database access. The exported file doubles as the import template,
 * so an export imported back unchanged makes no changes.
 */

import { ATTENDANCE_LABELS, ATTENDANCE_STATUSES } from './training-attendance.js';

export const SHEET_COLUMNS = [
  'Session ID',
  'Session',
  'Date',
  'Start',
  'Participant',
  'Email',
  'Status',
  'Method',
  'Checked in',
  'Minutes',
  'Note',
];

const STATUS_ALIASES = {
  p: 'PRESENT', present: 'PRESENT', attended: 'PRESENT', yes: 'PRESENT', y: 'PRESENT',
  l: 'LATE', late: 'LATE',
  a: 'ABSENT', absent: 'ABSENT', no: 'ABSENT', n: 'ABSENT', 'no show': 'ABSENT',
  e: 'EXCUSED', excused: 'EXCUSED', apology: 'EXCUSED',
};

/** "Present", "p", "PRESENT" -> enum; "" -> null (no change); unknown -> undefined. */
export function parseStatusCell(value) {
  const v = String(value ?? '').trim();
  if (!v) return null;
  if (ATTENDANCE_STATUSES.includes(v.toUpperCase())) return v.toUpperCase();
  return STATUS_ALIASES[v.toLowerCase()];
}

function parts(date, timeZone) {
  const fmt = new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  });
  const p = Object.fromEntries(fmt.formatToParts(new Date(date)).map((x) => [x.type, x.value]));
  return { date: `${p.year}-${p.month}-${p.day}`, time: `${p.hour}:${p.minute}` };
}

export function sessionKey(session, timeZone) {
  const { date, time } = parts(session.startsAt, timeZone);
  return `${date} ${time}`;
}

const fullName = (user) => [user?.givenName, user?.familyName].filter(Boolean).join(' ');

/**
 * One row per participant per session (scheduled sessions only).
 * @param {{ sessions, participants, records }} matrix  as returned by loadAttendanceMatrix
 * @param {{ timeZone?: string, sessionId?: string }} [options]
 */
export function buildAttendanceRows(matrix, { timeZone = 'Africa/Nairobi', sessionId = null } = {}) {
  const records = new Map((matrix.records || []).map((r) => [`${r.sessionId}:${r.registrationId}`, r]));
  const sessions = (matrix.sessions || []).filter((s) => s.status === 'SCHEDULED' && (!sessionId || s.id === sessionId));
  const rows = [];
  for (const session of sessions) {
    const { date, time } = parts(session.startsAt, timeZone);
    for (const participant of matrix.participants || []) {
      const record = records.get(`${session.id}:${participant.registrationId}`);
      rows.push({
        'Session ID': session.id,
        Session: session.title,
        Date: date,
        Start: time,
        Participant: fullName(participant.user),
        Email: participant.user?.email || '',
        Status: record ? ATTENDANCE_LABELS[record.status] : '',
        Method: record?.method ? record.method.replace('_', ' ').toLowerCase() : '',
        'Checked in': record?.checkedInAt ? `${parts(record.checkedInAt, timeZone).date} ${parts(record.checkedInAt, timeZone).time}` : '',
        Minutes: record?.durationMinutes ?? '',
        Note: record?.note || '',
      });
    }
  }
  return rows;
}

function cell(row, name) {
  const target = name.toLowerCase().replace(/[^a-z]/g, '');
  for (const [key, value] of Object.entries(row || {})) {
    if (key.toLowerCase().replace(/[^a-z]/g, '') === target) return value;
  }
  return undefined;
}

/**
 * Plan an import of a filled-in sheet.
 * @param {object[]} rows           objects keyed by the sheet headers
 * @param {{ sessions, participants, records }} matrix
 * @param {{ timeZone?: string }} [options]
 * @returns {{ ok: true, changes, results, counts } | { ok: false, error }}
 *   results: one entry per row { row, result: 'set'|'same'|'skip'|'error', reason?, ... }
 */
export function planSheetImport(rows, matrix, { timeZone = 'Africa/Nairobi' } = {}) {
  if (!Array.isArray(rows) || rows.length === 0) return { ok: false, error: 'The file has no rows' };
  if (rows.length > 20000) return { ok: false, error: 'The file has too many rows (20,000 max)' };
  const first = rows[0] || {};
  if (cell(first, 'Email') === undefined || cell(first, 'Status') === undefined) {
    return { ok: false, error: 'The file needs at least "Email" and "Status" columns. Download the template to see the layout.' };
  }

  const sessions = (matrix.sessions || []).filter((s) => s.status === 'SCHEDULED');
  const byId = new Map(sessions.map((s) => [s.id, s]));
  const byKey = new Map();
  const byTitle = new Map();
  for (const s of sessions) {
    byKey.set(sessionKey(s, timeZone), s);
    const t = String(s.title || '').trim().toLowerCase();
    byTitle.set(t, byTitle.has(t) ? null : s); // null = ambiguous
  }
  const participants = new Map((matrix.participants || []).map((p) => [String(p.user?.email || '').toLowerCase(), p]));
  const existing = new Map((matrix.records || []).map((r) => [`${r.sessionId}:${r.registrationId}`, r]));

  const results = [];
  const changes = new Map(); // `${sessionId}:${registrationId}` -> change (last row wins)
  rows.forEach((row, index) => {
    const line = index + 2; // header is line 1
    const status = parseStatusCell(cell(row, 'Status'));
    if (status === null) { results.push({ row: line, result: 'skip', reason: 'No status' }); return; }
    if (status === undefined) {
      results.push({ row: line, result: 'error', reason: `Unknown status "${cell(row, 'Status')}" (use Present, Late, Absent or Excused)` });
      return;
    }

    const email = String(cell(row, 'Email') || '').trim().toLowerCase();
    const participant = participants.get(email);
    if (!participant) { results.push({ row: line, result: 'error', reason: email ? `${email} is not an active participant` : 'Missing email' }); return; }

    const sessionIdCell = String(cell(row, 'Session ID') || '').trim();
    let session = sessionIdCell ? byId.get(sessionIdCell) : null;
    if (!session && !sessionIdCell) {
      const date = String(cell(row, 'Date') || '').trim();
      const start = String(cell(row, 'Start') || '').trim().padStart(5, '0');
      if (date && start) session = byKey.get(`${date} ${start}`) || null;
      if (!session) {
        const title = String(cell(row, 'Session') || '').trim().toLowerCase();
        if (title) session = byTitle.get(title) || null;
      }
      if (!session && sessions.length === 1) session = sessions[0];
    }
    if (!session) { results.push({ row: line, result: 'error', reason: 'Session not found (use the Session ID column from the template)' }); return; }

    const noteRaw = cell(row, 'Note');
    const note = noteRaw === undefined ? undefined : String(noteRaw || '').trim().slice(0, 500) || null;
    const key = `${session.id}:${participant.registrationId}`;
    const before = existing.get(key);
    const same = before && before.status === status && (note === undefined || (before.note || null) === note);
    results.push({
      row: line,
      result: same ? 'same' : 'set',
      sessionId: session.id,
      session: session.title,
      registrationId: participant.registrationId,
      email,
      status,
      previous: before?.status || null,
    });
    if (!same) changes.set(key, { sessionId: session.id, registrationId: participant.registrationId, status, note });
    else changes.delete(key);
  });

  const count = (r) => results.filter((x) => x.result === r).length;
  return {
    ok: true,
    changes: [...changes.values()],
    results,
    counts: { set: changes.size, same: count('same'), skip: count('skip'), error: count('error'), rows: rows.length },
  };
}
