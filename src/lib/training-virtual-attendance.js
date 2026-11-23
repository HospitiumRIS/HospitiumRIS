/**
 * Virtual attendance (#94). Pure: no database access.
 *
 * - Join window for the logged "Join session" link.
 * - Parser for Zoom and Microsoft Teams attendance reports (CSV / TSV, with or without
 *   the summary preamble those exports put above the participant table).
 * - Turning minutes-in-meeting into PRESENT / LATE / ABSENT.
 */

const MINUTE = 60 * 1000;

/** The join link is live from `checkInOpensMinutesBefore` before the start until the end. */
export function joinWindow(session) {
  const start = new Date(session.startsAt).getTime();
  return {
    opensAt: new Date(start - (session.checkInOpensMinutesBefore ?? 15) * MINUTE),
    closesAt: new Date(session.endsAt),
  };
}

export function isJoinWindowOpen(session, now = new Date()) {
  if (!session || session.status !== 'SCHEDULED') return false;
  const { opensAt, closesAt } = joinWindow(session);
  return now >= opensAt && now <= closesAt;
}

/** Status for a logged join: LATE after the session's late threshold. */
export function statusForJoin(session, joinedAt) {
  const lateAt = new Date(session.startsAt).getTime() + (session.lateAfterMinutes ?? 10) * MINUTE;
  return new Date(joinedAt).getTime() > lateAt ? 'LATE' : 'PRESENT';
}

/** Decode an uploaded report: UTF-16 (Teams) or UTF-8, BOM stripped. */
export function decodeReport(bytes) {
  const view = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes);
  if (view[0] === 0xff && view[1] === 0xfe) return new TextDecoder('utf-16le').decode(view.subarray(2));
  if (view[0] === 0xfe && view[1] === 0xff) return new TextDecoder('utf-16be').decode(view.subarray(2));
  const text = new TextDecoder('utf-8').decode(view);
  return text.charCodeAt(0) === 0xfeff ? text.slice(1) : text;
}

/** Split one CSV/TSV line, honouring double quotes. */
export function splitLine(line, delimiter) {
  const out = [];
  let cur = '';
  let quoted = false;
  for (let i = 0; i < line.length; i += 1) {
    const ch = line[i];
    if (quoted) {
      if (ch === '"' && line[i + 1] === '"') { cur += '"'; i += 1; }
      else if (ch === '"') quoted = false;
      else cur += ch;
    } else if (ch === '"') quoted = true;
    else if (ch === delimiter) { out.push(cur.trim()); cur = ''; }
    else cur += ch;
  }
  out.push(cur.trim());
  return out;
}

const norm = (h) => String(h || '').toLowerCase().replace(/\(.*?\)/g, '').replace(/[^a-z]/g, '');

const COLUMN_ALIASES = {
  email: ['useremail', 'email', 'emailaddress', 'participantidupn', 'upn'],
  name: ['name', 'fullname', 'participant', 'displayname', 'username'],
  join: ['jointime', 'firstjoin', 'joined', 'firstjointime', 'timejoined'],
  leave: ['leavetime', 'lastleave', 'left', 'lastleavetime', 'timeleft'],
  minutes: ['duration', 'durationminutes', 'inmeetingduration', 'attendanceduration', 'timeinmeeting', 'totalduration'],
};

function findColumns(headers) {
  const n = headers.map(norm);
  const pick = (key) => {
    for (const alias of COLUMN_ALIASES[key]) {
      const idx = n.indexOf(alias);
      if (idx !== -1) return idx;
    }
    return -1;
  };
  return { email: pick('email'), name: pick('name'), join: pick('join'), leave: pick('leave'), minutes: pick('minutes') };
}

/** "1h 2m 3s", "62 mins", "01:02:03", "62" -> minutes. */
export function parseDurationMinutes(value) {
  const v = String(value || '').trim().toLowerCase();
  if (!v) return null;
  if (/^\d+(\.\d+)?$/.test(v)) return Number(v);
  const hms = v.match(/^(\d+):(\d{1,2})(?::(\d{1,2}))?$/);
  if (hms) {
    const [, a, b, c] = hms;
    return c !== undefined ? Number(a) * 60 + Number(b) + Number(c) / 60 : Number(a) + Number(b) / 60;
  }
  let total = 0;
  let matched = false;
  for (const [, num, unit] of v.matchAll(/(\d+(?:\.\d+)?)\s*(h|hr|hrs|hour|hours|m|min|mins|minute|minutes|s|sec|secs|second|seconds)\b/g)) {
    matched = true;
    const n = Number(num);
    if (unit.startsWith('h')) total += n * 60;
    else if (unit.startsWith('m')) total += n;
    else total += n / 60;
  }
  return matched ? total : null;
}

/**
 * Parse a report timestamp. Zoom and Teams write local wall-clock times without an
 * offset ("12/01/2026 09:05:00 AM", "12/1/26, 9:05:00 AM", "2026-12-01 09:05:00"), so
 * the caller passes the offset of the time zone the report was exported in, in the
 * same sign convention as Date#getTimezoneOffset (Nairobi = -180).
 */
export function parseReportDate(value, offsetMinutes = 0) {
  const v = String(value || '').trim();
  if (!v) return null;
  if (/[zZ]|[+-]\d{2}:?\d{2}$/.test(v) && /^\d{4}-/.test(v)) {
    const d = new Date(v);
    return Number.isNaN(d.getTime()) ? null : d;
  }
  let y; let mo; let d; let h = 0; let mi = 0; let sec = 0;
  let m = v.match(/^(\d{4})-(\d{1,2})-(\d{1,2})[ T](\d{1,2}):(\d{2})(?::(\d{2}))?\s*(am|pm)?$/i);
  let ampm = null;
  if (m) {
    [, y, mo, d, h, mi, sec, ampm] = m;
  } else {
    m = v.match(/^(\d{1,2})\/(\d{1,2})\/(\d{2,4}),?\s+(\d{1,2}):(\d{2})(?::(\d{2}))?\s*(am|pm)?$/i);
    if (!m) return null;
    [, mo, d, y, h, mi, sec, ampm] = m;
    if (String(y).length === 2) y = `20${y}`;
  }
  let hour = Number(h);
  if (ampm) {
    const pm = ampm.toLowerCase() === 'pm';
    if (hour === 12) hour = pm ? 12 : 0;
    else if (pm) hour += 12;
  }
  const utc = Date.UTC(Number(y), Number(mo) - 1, Number(d), hour, Number(mi), Number(sec || 0));
  if (Number.isNaN(utc)) return null;
  return new Date(utc + offsetMinutes * MINUTE);
}

/**
 * Parse a Zoom or Teams attendance report.
 * @param {string} text
 * @param {{ offsetMinutes?: number }} [options]  time zone of the report's times (see parseReportDate)
 * @returns {{ ok: true, source, rows: [{ email, name, minutes, firstJoin, lastLeave, segments }] , skipped }
 *          | { ok: false, error }}
 */
export function parseAttendanceReport(text, { offsetMinutes = 0 } = {}) {
  const lines = String(text || '').split(/\r?\n/);
  let headerIdx = -1;
  let delimiter = ',';
  let cols = null;
  for (let i = 0; i < lines.length; i += 1) {
    const line = lines[i];
    if (!line.trim()) continue;
    const d = line.includes('\t') ? '\t' : ',';
    const c = findColumns(splitLine(line, d));
    // A participant table has name + email + duration/join. (Zoom's meeting summary
    // above it has an email and a duration but no name column.)
    if (c.email !== -1 && c.name !== -1 && (c.minutes !== -1 || c.join !== -1)) {
      headerIdx = i;
      delimiter = d;
      cols = c;
      break;
    }
  }
  if (headerIdx === -1) {
    return { ok: false, error: 'Could not find a participant table with name, email and duration (or join time) columns.' };
  }

  const source = /in-meeting duration|first join|participant id \(upn\)/i.test(lines[headerIdx]) ? 'teams'
    : /user email|duration \(minutes\)/i.test(lines[headerIdx]) ? 'zoom' : 'csv';

  const byEmail = new Map();
  let skipped = 0;
  for (let i = headerIdx + 1; i < lines.length; i += 1) {
    const line = lines[i];
    if (!line.trim()) {
      // Teams: a blank line ends the participant section.
      if (byEmail.size) break;
      continue;
    }
    if (/^\s*\d+\.\s+\w/.test(line) && !line.includes('@')) break; // next Teams section, e.g. "3. In-Meeting Activities"
    const cells = splitLine(line, delimiter);
    const email = String(cells[cols.email] || '').trim().toLowerCase();
    if (!email || !email.includes('@')) { skipped += 1; continue; }

    const join = cols.join !== -1 ? parseReportDate(cells[cols.join], offsetMinutes) : null;
    const leave = cols.leave !== -1 ? parseReportDate(cells[cols.leave], offsetMinutes) : null;
    let minutes = cols.minutes !== -1 ? parseDurationMinutes(cells[cols.minutes]) : null;
    if (minutes === null && join && leave) minutes = Math.max(0, (leave - join) / MINUTE);
    if (minutes === null) { skipped += 1; continue; }

    const row = byEmail.get(email) || { email, name: cells[cols.name] || '', minutes: 0, firstJoin: null, lastLeave: null, segments: 0 };
    row.minutes += minutes;
    row.segments += 1;
    if (join && (!row.firstJoin || join < row.firstJoin)) row.firstJoin = join;
    if (leave && (!row.lastLeave || leave > row.lastLeave)) row.lastLeave = leave;
    if (!row.name && cells[cols.name]) row.name = cells[cols.name];
    byEmail.set(email, row);
  }

  const rows = [...byEmail.values()].map((r) => ({ ...r, minutes: Math.round(r.minutes * 10) / 10 }));
  if (!rows.length) return { ok: false, error: 'The report has no participant rows with an email address.' };
  return { ok: true, source, rows, skipped };
}

/** Default threshold: half the session's length, rounded. */
export function defaultMinMinutes(session) {
  const length = (new Date(session.endsAt) - new Date(session.startsAt)) / MINUTE;
  return Math.max(1, Math.round(length / 2));
}

/** Minutes in the meeting -> attendance status. */
export function statusForMinutes(session, { minutes, firstJoin }, minMinutes) {
  if (minutes < minMinutes) return 'ABSENT';
  if (firstJoin) return statusForJoin(session, firstJoin);
  return 'PRESENT';
}

/**
 * Match report rows to registrations and propose statuses.
 * @param {object[]} rows               parsed report rows
 * @param {object[]} participants       [{ registrationId, email, name, existingStatus }]
 * @param {object} session
 * @param {{ minMinutes: number, overwrite: boolean }} options
 */
export function planVirtualImport(rows, participants, session, { minMinutes, overwrite = false }) {
  const byEmail = new Map(participants.map((p) => [String(p.email || '').toLowerCase(), p]));
  const matched = [];
  const unmatched = [];
  for (const row of rows) {
    const participant = byEmail.get(row.email);
    if (!participant) { unmatched.push(row); continue; }
    const status = statusForMinutes(session, row, minMinutes);
    const keep = !overwrite && ['PRESENT', 'LATE', 'EXCUSED'].includes(participant.existingStatus);
    matched.push({
      registrationId: participant.registrationId,
      email: row.email,
      name: participant.name || row.name,
      minutes: row.minutes,
      firstJoin: row.firstJoin,
      lastLeave: row.lastLeave,
      existingStatus: participant.existingStatus || null,
      status,
      action: keep ? 'keep' : (participant.existingStatus === status ? 'same' : 'set'),
    });
  }
  const reported = new Set(rows.map((r) => r.email));
  const notInReport = participants.filter((p) => !reported.has(String(p.email || '').toLowerCase()));
  return { matched, unmatched, notInReport };
}
