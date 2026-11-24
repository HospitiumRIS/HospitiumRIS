/**
 * Training transcript and CPD (#108): one row per training a person took part in, with
 * attended contact hours, certificate numbers, and CPD per year and accreditation body.
 * Pure: no database access.
 */

const HOUR = 60 * 60 * 1000;
export const TRANSCRIPT_STATUSES = ['COMPLETED', 'NOT_COMPLETED', 'REGISTERED'];
export const TRANSCRIPT_STATUS_LABELS = { COMPLETED: 'Completed', NOT_COMPLETED: 'Not completed', REGISTERED: 'In progress' };

const round1 = (n) => Math.round(n * 10) / 10;

/** Hours of the held sessions the person attended (present or late). */
export function attendedHours(sessions, attendance) {
  const attended = new Set((attendance || []).filter((a) => a.status === 'PRESENT' || a.status === 'LATE').map((a) => a.sessionId));
  return round1((sessions || [])
    .filter((s) => s.status !== 'CANCELLED' && attended.has(s.id))
    .reduce((sum, s) => sum + Math.max(0, new Date(s.endsAt) - new Date(s.startsAt)) / HOUR, 0));
}

/** The year a row belongs to: completion date, else the training's end date. */
export function transcriptYear(row) {
  return new Date(row.completedAt || row.endDate || row.startDate).getFullYear();
}

/**
 * Transcript rows, newest first. CPD counts only for completed trainings.
 * @param {{ status, completedAt, training: { id, title, code, startDate, endDate, cpdHours, cpdPoints, accreditationBody, accreditationNumber, sessions }, attendance, certificate }[]} registrations
 */
export function buildTranscript(registrations) {
  return (registrations || [])
    .filter((r) => TRANSCRIPT_STATUSES.includes(r.status))
    .map((r) => {
      const t = r.training;
      const completed = r.status === 'COMPLETED';
      const cert = r.certificate && r.certificate.status !== 'REVOKED' ? r.certificate : null;
      return {
        registrationId: r.id,
        trainingId: t.id,
        title: t.title,
        code: t.code || null,
        startDate: t.startDate,
        endDate: t.endDate,
        status: r.status,
        completedAt: r.completedAt || null,
        contactHours: attendedHours(t.sessions, r.attendance),
        cpdHours: completed ? Number(t.cpdHours) || 0 : 0,
        cpdPoints: completed ? Number(t.cpdPoints) || 0 : 0,
        accreditationBody: t.accreditationBody || null,
        accreditationNumber: t.accreditationNumber || null,
        certificateNumber: cert?.certificateNumber || null,
        certificateExpiresAt: cert?.expiresAt || null,
      };
    })
    .map((row) => ({ ...row, year: transcriptYear(row) }))
    .sort((a, b) => new Date(b.completedAt || b.endDate) - new Date(a.completedAt || a.endDate));
}

/** Years present in the transcript, newest first. */
export function transcriptYears(rows) {
  return [...new Set((rows || []).map((r) => r.year))].sort((a, b) => b - a);
}

/**
 * CPD per year and accreditation body (completed trainings with CPD only).
 * @returns {{ year, body, hours, points, trainings }[]}  newest year first, then body
 */
export function cpdByYearAndBody(rows) {
  const map = new Map();
  for (const r of rows || []) {
    if (r.status !== 'COMPLETED' || !(r.cpdHours > 0 || r.cpdPoints > 0)) continue;
    const body = r.accreditationBody || 'Not accredited';
    const key = `${r.year}|${body}`;
    const cur = map.get(key) || { year: r.year, body, hours: 0, points: 0, trainings: 0 };
    cur.hours = round1(cur.hours + r.cpdHours);
    cur.points = round1(cur.points + r.cpdPoints);
    cur.trainings += 1;
    map.set(key, cur);
  }
  return [...map.values()].sort((a, b) => b.year - a.year || a.body.localeCompare(b.body));
}

/** Totals for a set of rows. */
export function transcriptTotals(rows) {
  const list = rows || [];
  return {
    trainings: list.length,
    completed: list.filter((r) => r.status === 'COMPLETED').length,
    contactHours: round1(list.reduce((s, r) => s + r.contactHours, 0)),
    cpdHours: round1(list.reduce((s, r) => s + r.cpdHours, 0)),
    cpdPoints: round1(list.reduce((s, r) => s + r.cpdPoints, 0)),
  };
}
