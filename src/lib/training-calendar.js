/**
 * Training calendar (#108): turn sessions into events and write an RFC 5545 iCalendar
 * feed. Pure: no database access.
 */

const CRLF = '\r\n';

/** Escape TEXT values (RFC 5545 §3.3.11). */
export function icsEscape(value) {
  return String(value ?? '')
    .replace(/\\/g, '\\\\')
    .replace(/\r\n|\r|\n/g, '\\n')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,');
}

/** UTC date-time, e.g. 20261201T090000Z. */
export function icsDate(value) {
  const d = new Date(value);
  return d.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
}

/**
 * Fold a content line to at most 75 octets per line (RFC 5545 §3.1), never splitting a
 * UTF-8 character.
 */
export function foldLine(line) {
  const bytes = (s) => new TextEncoder().encode(s).length;
  if (bytes(line) <= 75) return line;
  const parts = [];
  let current = '';
  let limit = 75;
  for (const ch of line) {
    if (bytes(current + ch) > limit) {
      parts.push(current);
      current = ch;
      limit = 74; // continuation lines start with a space
    } else {
      current += ch;
    }
  }
  if (current) parts.push(current);
  return parts.join(`${CRLF} `);
}

/**
 * Events for a person's calendar: sessions of trainings they hold a place in or
 * facilitate. A training with no sessions becomes one event over its dates.
 * @param {{ training, role: 'participant'|'facilitator', sessionIds?: string[]|null }[]} items
 *   sessionIds: for facilitators of only some sessions
 * @returns {{ uid, start, end, title, location, description, url, status, trainingId, sessionId, role }[]}
 */
export function calendarEvents(items, { baseUrl = '' } = {}) {
  const events = [];
  const seen = new Set();
  for (const { training: t, role, sessionIds = null } of items || []) {
    if (!t) continue;
    const page = role === 'facilitator' ? `${baseUrl}/researcher/training/facilitating` : `${baseUrl}/researcher/training/${t.id}`;
    const sessions = (t.sessions || []).filter((s) => !sessionIds || sessionIds.includes(s.id));
    if (!sessions.length && !(t.sessions || []).length) {
      const uid = `training-${t.id}@hospitiumris`;
      if (seen.has(uid)) continue;
      seen.add(uid);
      events.push({
        uid,
        start: t.startDate,
        end: t.endDate,
        title: t.title,
        location: t.venue || (t.deliveryMode === 'ONLINE' ? 'Online' : '') || '',
        description: [t.description ? t.description.slice(0, 500) : null, `Details: ${page}`].filter(Boolean).join('\n\n'),
        url: page,
        status: t.status === 'CANCELLED' ? 'CANCELLED' : 'CONFIRMED',
        trainingId: t.id,
        sessionId: null,
        role,
      });
      continue;
    }
    for (const s of sessions) {
      const uid = `session-${s.id}@hospitiumris`;
      if (seen.has(uid)) continue;
      seen.add(uid);
      const mode = s.deliveryMode || t.deliveryMode || 'IN_PERSON';
      const venue = mode === 'ONLINE' ? null : s.venue || t.venue || null;
      const online = mode !== 'IN_PERSON' && Boolean(s.onlineLink || t.onlineLink);
      events.push({
        uid,
        start: s.startsAt,
        end: s.endsAt,
        title: `${s.title} · ${t.title}${role === 'facilitator' ? ' (facilitating)' : ''}`,
        location: [venue, online ? 'Online' : null].filter(Boolean).join(' / '),
        description: [
          online ? `Join (sign in first): ${baseUrl}/api/training/sessions/${s.id}/join` : null,
          `Details: ${page}`,
        ].filter(Boolean).join('\n'),
        url: page,
        status: s.status === 'CANCELLED' || t.status === 'CANCELLED' ? 'CANCELLED' : 'CONFIRMED',
        trainingId: t.id,
        sessionId: s.id,
        role,
      });
    }
  }
  return events.sort((a, b) => new Date(a.start) - new Date(b.start));
}

/**
 * Write the iCalendar text (CRLF line endings, folded lines).
 * @param {object[]} events from calendarEvents
 */
export function buildIcs(events, { name = 'HospitiumRIS training', now = new Date() } = {}) {
  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//HospitiumRIS//Training//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    `X-WR-CALNAME:${icsEscape(name)}`,
    'X-PUBLISHED-TTL:PT1H',
    'REFRESH-INTERVAL;VALUE=DURATION:PT1H',
  ];
  const stamp = icsDate(now);
  for (const e of events || []) {
    const start = new Date(e.start);
    let end = new Date(e.end || e.start);
    if (!(end > start)) end = new Date(start.getTime() + 60 * 60 * 1000);
    lines.push(
      'BEGIN:VEVENT',
      `UID:${e.uid}`,
      `DTSTAMP:${stamp}`,
      `DTSTART:${icsDate(start)}`,
      `DTEND:${icsDate(end)}`,
      `SUMMARY:${icsEscape(e.title)}`,
    );
    if (e.location) lines.push(`LOCATION:${icsEscape(e.location)}`);
    if (e.description) lines.push(`DESCRIPTION:${icsEscape(e.description)}`);
    if (e.url) lines.push(`URL:${e.url}`);
    lines.push(`STATUS:${e.status === 'CANCELLED' ? 'CANCELLED' : 'CONFIRMED'}`, 'TRANSP:OPAQUE', 'END:VEVENT');
  }
  lines.push('END:VCALENDAR');
  return lines.map(foldLine).join(CRLF) + CRLF;
}
