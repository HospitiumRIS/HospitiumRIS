/**
 * Training sessions and delivery mode (#91). Pure: no database access, safe to import
 * from client components and node:test.
 */

export const DELIVERY_MODES = ['IN_PERSON', 'ONLINE', 'HYBRID'];
export const SESSION_STATUSES = ['SCHEDULED', 'CANCELLED'];

export const DELIVERY_MODE_LABELS = {
  IN_PERSON: 'In person',
  ONLINE: 'Online',
  HYBRID: 'Hybrid',
};

export const SESSION_DEFAULTS = {
  isAttendanceRequired: true,
  checkInOpensMinutesBefore: 15,
  checkInClosesMinutesAfter: 30,
  lateAfterMinutes: 10,
};

const DAY_MS = 24 * 60 * 60 * 1000;
const MAX_MINUTES = 24 * 60;

/** Form `locationType` (in_person | online | hybrid) -> enum. */
export function deliveryModeFromLocationType(locationType) {
  if (locationType === 'online') return 'ONLINE';
  if (locationType === 'hybrid') return 'HYBRID';
  return 'IN_PERSON';
}

/** Enum -> form `locationType`. */
export function locationTypeFromDeliveryMode(mode) {
  if (mode === 'ONLINE') return 'online';
  if (mode === 'HYBRID') return 'hybrid';
  return 'in_person';
}

export function isHttpUrl(value) {
  if (!value || typeof value !== 'string') return false;
  try {
    const url = new URL(value.trim());
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
}

/**
 * Structured delivery fields for a training (replaces the "address | link" string).
 * @returns {{ deliveryMode, venue, onlineLink } | { error }}
 */
export function buildDeliveryFields({ locationType, locationAddress, onlineLink }) {
  const deliveryMode = deliveryModeFromLocationType(locationType);
  const venue = (locationAddress || '').trim() || null;
  const link = (onlineLink || '').trim() || null;

  if (link && !isHttpUrl(link)) return { error: 'Online meeting link must start with http:// or https://' };
  if (deliveryMode === 'ONLINE' && !link) return { error: 'Online meeting link is required' };
  if (deliveryMode === 'IN_PERSON' && !venue) return { error: 'Venue is required for in-person training' };
  if (deliveryMode === 'HYBRID' && !venue && !link) return { error: 'Provide a venue and/or online link for hybrid training' };

  return {
    deliveryMode,
    venue: deliveryMode === 'ONLINE' ? null : venue,
    onlineLink: deliveryMode === 'IN_PERSON' ? null : link,
  };
}

/**
 * Parse the legacy `location` string the same way the backfill migration does.
 */
export function deliveryFieldsFromLegacyLocation(location) {
  const value = (location || '').trim();
  if (!value) return { deliveryMode: 'IN_PERSON', venue: null, onlineLink: null };
  if (/^https?:\/\//i.test(value)) return { deliveryMode: 'ONLINE', venue: null, onlineLink: value };
  if (value.includes(' | ')) {
    const [venue, link] = value.split(' | ');
    return { deliveryMode: 'HYBRID', venue: venue.trim() || null, onlineLink: (link || '').trim() || null };
  }
  return { deliveryMode: 'IN_PERSON', venue: value, onlineLink: null };
}

/** Legacy `location` string kept in sync for one release (read by older clients). */
export function legacyLocationString({ deliveryMode, venue, onlineLink }) {
  if (deliveryMode === 'ONLINE') return onlineLink || '';
  if (deliveryMode === 'HYBRID') {
    if (venue && onlineLink) return `${venue} | ${onlineLink}`;
    return venue || onlineLink || '';
  }
  return venue || '';
}

/** A session's venue/link fall back to the training's. */
export function effectiveSessionDelivery(session, training) {
  const deliveryMode = session?.deliveryMode || training?.deliveryMode || 'IN_PERSON';
  return {
    deliveryMode,
    venue: deliveryMode === 'ONLINE' ? null : (session?.venue || training?.venue || null),
    onlineLink: deliveryMode === 'IN_PERSON' ? null : (session?.onlineLink || training?.onlineLink || null),
  };
}

function toDate(value) {
  if (value === null || value === undefined || value === '') return null;
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function minutesField(value, fallback, label, errors) {
  if (value === undefined || value === null || value === '') return fallback;
  const n = Number(value);
  if (!Number.isInteger(n) || n < 0 || n > MAX_MINUTES) {
    errors.push(`${label} must be a whole number of minutes between 0 and ${MAX_MINUTES}`);
    return fallback;
  }
  return n;
}

/**
 * Validate a session create/update body against its training.
 * @param {object} input        request body
 * @param {object} training     needs startDate, endDate, deliveryMode, venue, onlineLink
 * @param {{ existing?: object, moduleIds?: string[] }} [ctx]  existing session (update), module ids of the training
 * @returns {{ ok: true, data: object } | { ok: false, errors: string[] }}
 */
export function validateSessionInput(input, training, ctx = {}) {
  const errors = [];
  const existing = ctx.existing || {};
  const body = input || {};
  const pick = (key) => (body[key] !== undefined ? body[key] : existing[key]);

  const title = String(pick('title') ?? '').trim();
  if (!title) errors.push('Session title is required');
  if (title.length > 200) errors.push('Session title must be 200 characters or fewer');

  const startsAt = toDate(pick('startsAt'));
  const endsAt = toDate(pick('endsAt'));
  if (!startsAt) errors.push('Start date and time are required');
  if (!endsAt) errors.push('End date and time are required');
  if (startsAt && endsAt && endsAt <= startsAt) errors.push('Session must end after it starts');

  const trainingStart = toDate(training?.startDate);
  const trainingEnd = toDate(training?.endDate);
  if (startsAt && endsAt && trainingStart && trainingEnd && (startsAt < trainingStart || endsAt > trainingEnd)) {
    errors.push('Session must fall within the training dates. Change the training dates first if needed.');
  }

  const deliveryMode = pick('deliveryMode') || training?.deliveryMode || 'IN_PERSON';
  if (!DELIVERY_MODES.includes(deliveryMode)) errors.push(`Delivery mode must be one of ${DELIVERY_MODES.join(', ')}`);

  const venue = String(pick('venue') ?? '').trim() || null;
  const onlineLink = String(pick('onlineLink') ?? '').trim() || null;
  if (onlineLink && !isHttpUrl(onlineLink)) errors.push('Online link must start with http:// or https://');

  const effective = effectiveSessionDelivery({ deliveryMode, venue, onlineLink }, training);
  if (deliveryMode === 'ONLINE' && !effective.onlineLink) {
    errors.push('Online sessions need a meeting link (on the session or the training)');
  }

  const status = pick('status') || 'SCHEDULED';
  if (!SESSION_STATUSES.includes(status)) errors.push(`Status must be one of ${SESSION_STATUSES.join(', ')}`);

  const moduleId = pick('moduleId') || null;
  if (moduleId && Array.isArray(ctx.moduleIds) && !ctx.moduleIds.includes(moduleId)) {
    errors.push('Linked module does not belong to this training');
  }

  const description = String(pick('description') ?? '').trim() || null;
  const isAttendanceRequired = pick('isAttendanceRequired') === undefined
    ? SESSION_DEFAULTS.isAttendanceRequired
    : pick('isAttendanceRequired') === true;

  const checkInOpensMinutesBefore = minutesField(pick('checkInOpensMinutesBefore'), SESSION_DEFAULTS.checkInOpensMinutesBefore, 'Check-in opening', errors);
  const checkInClosesMinutesAfter = minutesField(pick('checkInClosesMinutesAfter'), SESSION_DEFAULTS.checkInClosesMinutesAfter, 'Check-in closing', errors);
  const lateAfterMinutes = minutesField(pick('lateAfterMinutes'), SESSION_DEFAULTS.lateAfterMinutes, 'Late threshold', errors);

  if (errors.length) return { ok: false, errors };

  return {
    ok: true,
    data: {
      title,
      description,
      startsAt,
      endsAt,
      deliveryMode,
      venue: deliveryMode === 'ONLINE' ? null : venue,
      onlineLink: deliveryMode === 'IN_PERSON' ? null : onlineLink,
      status,
      moduleId,
      isAttendanceRequired,
      checkInOpensMinutesBefore,
      checkInClosesMinutesAfter,
      lateAfterMinutes,
    },
  };
}

/**
 * One session per day for a multi-day training, each running from the training's
 * start time to its end time. A single-day training gives one session.
 * Venue/link are left empty so sessions inherit the training's.
 */
export function buildDailySessions(training) {
  const start = toDate(training?.startDate);
  const end = toDate(training?.endDate);
  if (!start || !end || end <= start) return [];

  const span = end.getTime() - start.getTime();
  const days = Math.floor(span / DAY_MS);
  const remainder = span - days * DAY_MS;
  // Last day ends exactly at the start time-of-day: fall back to 8-hour days.
  const dailyMs = remainder > 0 ? remainder : 8 * 60 * 60 * 1000;
  const count = Math.max(1, days + (remainder > 0 ? 1 : 0));
  const sessions = [];
  for (let d = 0; d < count; d += 1) {
    const s = new Date(start.getTime() + d * DAY_MS);
    let e = new Date(s.getTime() + dailyMs);
    if (e > end) e = end;
    if (e <= s) continue;
    sessions.push({
      title: count > 1 ? `Day ${d + 1}` : (training.title || 'Session'),
      startsAt: s,
      endsAt: e,
      deliveryMode: training.deliveryMode || 'IN_PERSON',
      venue: null,
      onlineLink: null,
      status: training.status === 'CANCELLED' ? 'CANCELLED' : 'SCHEDULED',
      order: d,
      ...SESSION_DEFAULTS,
    });
  }
  return sessions;
}

/** Sessions sorted by start, with a `dayKey` (YYYY-MM-DD in the given offset) for grouping. */
export function groupSessionsByDay(sessions, { timeZone } = {}) {
  const fmt = new Intl.DateTimeFormat('en-CA', { timeZone, year: 'numeric', month: '2-digit', day: '2-digit' });
  const sorted = [...(sessions || [])].sort((a, b) => new Date(a.startsAt) - new Date(b.startsAt));
  const groups = [];
  for (const session of sorted) {
    const key = fmt.format(new Date(session.startsAt));
    const last = groups[groups.length - 1];
    if (last && last.dayKey === key) last.sessions.push(session);
    else groups.push({ dayKey: key, sessions: [session] });
  }
  return groups;
}

/** Sessions that no longer fit the training dates (e.g. after the dates were edited). */
export function sessionsOutsideTraining(sessions, training) {
  const start = toDate(training?.startDate);
  const end = toDate(training?.endDate);
  if (!start || !end) return [];
  return (sessions || []).filter((s) => new Date(s.startsAt) < start || new Date(s.endsAt) > end);
}

/**
 * Delivery fields for a training create/update body. Accepts the structured fields
 * (deliveryMode, venue, onlineLink) or, from older clients, only `location`.
 * Returns the fields to write (including the legacy `location`), {} when the body
 * touches none of them, or { error }.
 */
export function resolveTrainingDeliveryUpdate(body, existing = {}) {
  const b = body || {};
  const structured = ['deliveryMode', 'venue', 'onlineLink'].some((k) => b[k] !== undefined);
  if (!structured) {
    if (b.location === undefined) return {};
    const fields = deliveryFieldsFromLegacyLocation(b.location);
    return { ...fields, location: b.location || null };
  }

  const deliveryMode = b.deliveryMode ?? existing.deliveryMode ?? 'IN_PERSON';
  if (!DELIVERY_MODES.includes(deliveryMode)) {
    return { error: `Delivery mode must be one of ${DELIVERY_MODES.join(', ')}` };
  }
  const fields = buildDeliveryFields({
    locationType: locationTypeFromDeliveryMode(deliveryMode),
    locationAddress: b.venue !== undefined ? b.venue : existing.venue,
    onlineLink: b.onlineLink !== undefined ? b.onlineLink : existing.onlineLink,
  });
  if (fields.error) return fields;
  return { ...fields, location: legacyLocationString(fields) || null };
}
