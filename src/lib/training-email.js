/**
 * Training notifications (#97): one builder for every training email and its matching
 * in-app notification. Pure: no database access, no sending.
 */

import { renderBrandedEmail } from './email-layout.js';

export const TRAINING_EMAIL_KINDS = [
  'REGISTRATION_CONFIRMED',
  'REGISTRATION_PENDING',
  'WAITLISTED',
  'PROMOTED_FROM_WAITLIST',
  'REGISTRATION_APPROVED',
  'REGISTRATION_REJECTED',
  'REGISTRATION_CANCELLED',
  'SESSION_REMINDER',
  'SESSION_CANCELLED',
  'CHECKIN_OPEN',
  'TRAINING_ASSIGNED',
  'TRAINING_DUE',
  'TRAINING_OVERDUE',
  'TRAINING_COMPLETED',
  'TRAINING_NOT_COMPLETED',
  'FEEDBACK_REQUESTED',
  'CERTIFICATE_ISSUED',
  'CERTIFICATE_REVOKED',
  'CERTIFICATE_EXPIRING',
  'RETRAINING_DUE',
  'FACILITATOR_ASSIGNED',
  'ASSESSMENT_GRADED',
];

/** In-app notification type (existing NotificationType enum values). */
const NOTIFICATION_TYPE = {
  REGISTRATION_CONFIRMED: 'TRAINING_REGISTERED',
  REGISTRATION_PENDING: 'TRAINING_REGISTERED',
  WAITLISTED: 'TRAINING_REGISTERED',
  PROMOTED_FROM_WAITLIST: 'TRAINING_REGISTERED',
  REGISTRATION_APPROVED: 'TRAINING_REGISTERED',
  REGISTRATION_REJECTED: 'TRAINING_CANCELLED',
  REGISTRATION_CANCELLED: 'TRAINING_CANCELLED',
  SESSION_REMINDER: 'TRAINING_STARTING_SOON',
  SESSION_CANCELLED: 'TRAINING_CANCELLED',
  CHECKIN_OPEN: 'TRAINING_STARTING_SOON',
  TRAINING_ASSIGNED: 'TRAINING_AVAILABLE',
  TRAINING_DUE: 'TRAINING_STARTING_SOON',
  TRAINING_OVERDUE: 'TRAINING_STARTING_SOON',
  TRAINING_COMPLETED: 'TRAINING_MODULE_COMPLETED',
  TRAINING_NOT_COMPLETED: 'SYSTEM_NOTIFICATION',
  FEEDBACK_REQUESTED: 'SYSTEM_NOTIFICATION',
  CERTIFICATE_ISSUED: 'TRAINING_CERTIFICATE_ISSUED',
  CERTIFICATE_REVOKED: 'SYSTEM_NOTIFICATION',
  CERTIFICATE_EXPIRING: 'SYSTEM_NOTIFICATION',
  RETRAINING_DUE: 'SYSTEM_NOTIFICATION',
  FACILITATOR_ASSIGNED: 'TRAINING_AVAILABLE',
  ASSESSMENT_GRADED: 'SYSTEM_NOTIFICATION',
};

const HIGH_PRIORITY = new Set(['SESSION_CANCELLED', 'TRAINING_OVERDUE', 'CERTIFICATE_REVOKED', 'REGISTRATION_REJECTED', 'RETRAINING_DUE']);

function fmt(date, timeZone, options) {
  if (!date) return '';
  try {
    return new Intl.DateTimeFormat('en-GB', { timeZone, ...options }).format(new Date(date));
  } catch {
    return new Date(date).toISOString();
  }
}

const dayFmt = { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' };
const timeFmt = { hour: '2-digit', minute: '2-digit' };

function sessionWhen(session, timeZone) {
  if (!session?.startsAt) return '';
  return `${fmt(session.startsAt, timeZone, dayFmt)}, ${fmt(session.startsAt, timeZone, timeFmt)}–${fmt(session.endsAt || session.startsAt, timeZone, timeFmt)}`;
}

function trainingDates(training, timeZone) {
  if (!training?.startDate) return '';
  const start = fmt(training.startDate, timeZone, { day: 'numeric', month: 'long', year: 'numeric' });
  const end = fmt(training.endDate || training.startDate, timeZone, { day: 'numeric', month: 'long', year: 'numeric' });
  return start === end ? start : `${start} – ${end}`;
}

/**
 * @param {string} kind  one of TRAINING_EMAIL_KINDS
 * @param {object} data
 *   recipient   { givenName?, familyName?, email }
 *   training    { id, title, startDate?, endDate?, venue? }
 *   session?    { title, startsAt, endsAt, venue? }
 *   reason?, dueDate?, reminder? ('24h'|'1h'), waitlistPosition?,
 *   certificate? { number, verifyUrl }, checks? [{ label, met }]
 *   baseUrl, timeZone? (default Africa/Nairobi)
 * @returns {{ subject, html, text, notification: { type, title, message, priority, actionUrl, actionLabel } }}
 */
export function buildTrainingEmail(kind, data) {
  if (!TRAINING_EMAIL_KINDS.includes(kind)) throw new Error(`Unknown training email kind: ${kind}`);
  const tz = data.timeZone || 'Africa/Nairobi';
  const base = String(data.baseUrl || '').replace(/\/$/, '');
  const name = data.recipient?.givenName || 'there';
  const t = data.training || {};
  const title = t.title || 'your training';
  const trainingUrl = `${base}/researcher/training?training=${encodeURIComponent(t.id || '')}`;
  const s = data.session;
  const when = sessionWhen(s, tz);

  let subject;
  let heading;
  let paragraphs = [];
  let details = [['Training', title]];
  let action = { url: trainingUrl, label: 'Open my trainings' };
  let note;
  let message;

  switch (kind) {
    case 'REGISTRATION_CONFIRMED':
      subject = `You're registered: ${title}`;
      heading = "You're registered";
      paragraphs = [`Your place on "${title}" is confirmed.`];
      details.push(['Dates', trainingDates(t, tz)], ['Venue', t.venue]);
      note = 'You will get a reminder before each session. You can cancel from My trainings until the training starts.';
      message = `Your place on "${title}" is confirmed.`;
      break;
    case 'REGISTRATION_PENDING':
      subject = `Request received: ${title}`;
      heading = 'Your request is awaiting approval';
      paragraphs = [`Your request to join "${title}" has been received. A place is held for you while the training team reviews it.`];
      details.push(['Dates', trainingDates(t, tz)]);
      note = 'You will get an email when it is approved or declined.';
      message = `Your request to join "${title}" is awaiting approval.`;
      break;
    case 'WAITLISTED':
      subject = `You're on the waiting list: ${title}`;
      heading = "You're on the waiting list";
      paragraphs = [`"${title}" is full, so you have been added to the waiting list. We will email you if a place opens up.`];
      details.push(['Position', data.waitlistPosition ? `#${data.waitlistPosition}` : null]);
      message = `"${title}" is full; you are on the waiting list${data.waitlistPosition ? ` (#${data.waitlistPosition})` : ''}.`;
      break;
    case 'PROMOTED_FROM_WAITLIST':
      subject = `A place opened up: ${title}`;
      heading = data.awaitingApproval ? 'You moved up from the waiting list' : 'You have a place';
      paragraphs = [data.awaitingApproval
        ? `A place opened up on "${title}". It is held for you while the training team approves your request.`
        : `A place opened up on "${title}" and it is now yours.`];
      details.push(['Dates', trainingDates(t, tz)]);
      message = `A place opened up on "${title}"; you are now registered.`;
      break;
    case 'REGISTRATION_APPROVED':
      subject = `Registration approved: ${title}`;
      heading = 'Your registration was approved';
      paragraphs = [`Your registration for "${title}" has been approved.`];
      details.push(['Dates', trainingDates(t, tz)]);
      message = `Your registration for "${title}" was approved.`;
      break;
    case 'REGISTRATION_REJECTED':
      subject = `Registration not approved: ${title}`;
      heading = 'Your registration was not approved';
      paragraphs = [`Your registration for "${title}" was not approved.`];
      details.push(['Reason', data.reason]);
      message = `Your registration for "${title}" was not approved.`;
      break;
    case 'REGISTRATION_CANCELLED':
      subject = `Registration cancelled: ${title}`;
      heading = 'Your registration was cancelled';
      paragraphs = [`Your registration for "${title}" has been cancelled.`];
      details.push(['Reason', data.reason]);
      note = 'If this is a mistake, you can register again from the training catalogue while registration is open.';
      message = `Your registration for "${title}" was cancelled.`;
      break;
    case 'SESSION_REMINDER':
      subject = `${data.reminder === '1h' ? 'Starting soon' : 'Tomorrow'}: ${s?.title || title}`;
      heading = data.reminder === '1h' ? 'Your session starts in an hour' : 'Your session is tomorrow';
      paragraphs = [`A reminder for your session of "${title}".`];
      details.push(['Session', s?.title], ['When', when], ['Venue', s?.venue]);
      note = 'Check in on arrival with the QR code or 6-digit code shown on screen, or from Training › Session Check-in.';
      message = `${s?.title || 'Your session'} of "${title}" is on ${when}.`;
      break;
    case 'SESSION_CANCELLED':
      subject = `Session cancelled: ${s?.title || title}`;
      heading = 'A session has been cancelled';
      paragraphs = [`The following session of "${title}" has been cancelled.`];
      details.push(['Session', s?.title], ['Was scheduled', when], ['Reason', data.reason]);
      message = `${s?.title || 'A session'} of "${title}" on ${when} was cancelled.`;
      break;
    case 'CHECKIN_OPEN':
      subject = `Check-in is open: ${s?.title || title}`;
      heading = 'Check-in is open';
      paragraphs = [`Check-in for your session of "${title}" is now open.`];
      details.push(['Session', s?.title], ['When', when]);
      action = { url: `${base}/researcher/training/check-in`, label: 'Check in' };
      message = `Check-in for ${s?.title || 'your session'} is open.`;
      break;
    case 'TRAINING_ASSIGNED':
      subject = `Training assigned to you: ${title}`;
      heading = 'A training has been assigned to you';
      paragraphs = [`You have been asked to complete "${title}".`];
      details.push(['Dates', trainingDates(t, tz)], ['Complete by', data.dueDate ? fmt(data.dueDate, tz, dayFmt) : null]);
      message = `You have been assigned "${title}"${data.dueDate ? `, due ${fmt(data.dueDate, tz, { day: 'numeric', month: 'short' })}` : ''}.`;
      break;
    case 'TRAINING_DUE':
      subject = `Due soon: ${title}`;
      heading = 'A required training is due soon';
      paragraphs = [`"${title}" is due on ${fmt(data.dueDate, tz, dayFmt)}.`];
      message = `"${title}" is due ${fmt(data.dueDate, tz, { day: 'numeric', month: 'short' })}.`;
      break;
    case 'TRAINING_OVERDUE':
      subject = `Overdue: ${title}`;
      heading = 'A required training is overdue';
      paragraphs = [`"${title}" was due on ${fmt(data.dueDate, tz, dayFmt)} and has not been completed.`];
      message = `"${title}" is overdue.`;
      break;
    case 'FACILITATOR_ASSIGNED': {
      const roleLabel = { LEAD: 'lead facilitator', CO_FACILITATOR: 'co-facilitator', GUEST: 'guest speaker' }[data.role] || 'facilitator';
      subject = `You're facilitating: ${s?.title || title}`;
      heading = `You are ${roleLabel === 'guest speaker' ? 'a guest speaker' : `the ${roleLabel}`}`;
      paragraphs = [s
        ? `You have been added as ${roleLabel} for the session "${s.title}" of "${title}".`
        : `You have been added as ${roleLabel} for "${title}".`];
      details.push(['When', s ? when : trainingDates(t, tz)], ['Venue', s?.venue || t.venue]);
      note = 'From Training › Facilitating you can show the check-in screen and take the register for your sessions.';
      action = { url: `${base}/researcher/training/facilitating`, label: 'Open my sessions' };
      message = `You are ${roleLabel} for ${s ? `"${s.title}"` : `"${title}"`}.`;
      break;
    }
    case 'ASSESSMENT_GRADED': {
      const a = data.assessment || {};
      subject = `Results: ${a.title || title}`;
      heading = a.passed ? 'You passed' : 'Your assessment has been graded';
      paragraphs = [`Your answers to "${a.title || 'the assessment'}" for "${title}" have been graded.`];
      const pct = a.percent !== undefined && a.percent !== null ? `${a.percent}%` : null;
      details.push(['Score', pct], ['Result', a.passed ? 'Passed' : 'Not passed']);
      note = a.passed ? null : 'Open the training to see whether you have attempts left.';
      message = `"${a.title || 'Your assessment'}" graded${pct ? `: ${pct}` : ''}${a.passed ? ', passed' : ''}.`;
      break;
    }
    case 'CERTIFICATE_EXPIRING':
      subject = `Certificate expiring: ${title}`;
      heading = 'Your certificate expires soon';
      paragraphs = [`Your certificate for "${title}" expires on ${fmt(data.expiresAt, tz, dayFmt)}.`];
      details.push(['Certificate number', data.certificate?.number]);
      note = 'Book a refresher before it expires to stay compliant. Ask your training team which cohort to join.';
      action = { url: `${base}/researcher/training#available`, label: 'Find a refresher' };
      message = `Your "${title}" certificate expires ${fmt(data.expiresAt, tz, { day: 'numeric', month: 'short' })}.`;
      break;
    case 'RETRAINING_DUE':
      subject = `Re-training due: ${title}`;
      heading = 'Your certificate has expired';
      paragraphs = [`Your certificate for "${title}" expired on ${fmt(data.expiresAt, tz, dayFmt)}, so re-training is now due.`];
      details.push(['Certificate number', data.certificate?.number]);
      action = { url: `${base}/researcher/training#available`, label: 'Find a refresher' };
      message = `Your "${title}" certificate has expired: re-training is due.`;
      break;
    case 'TRAINING_COMPLETED':
      subject = `Completed: ${title}`;
      heading = 'Training completed';
      paragraphs = [`Congratulations, you have completed "${title}".`];
      note = 'If your institution issues certificates for this training, you will receive it separately.';
      message = `You completed "${title}".`;
      break;
    case 'TRAINING_NOT_COMPLETED': {
      subject = `Not completed: ${title}`;
      heading = 'Training not completed';
      paragraphs = [`"${title}" has ended and the completion requirements were not met.`];
      const missing = (data.checks || []).filter((c) => !c.met).map((c) => c.label);
      if (missing.length) details.push(['Not met', missing.join('; ')]);
      note = 'If you think this is wrong, contact the training team. They can correct attendance or review your record.';
      message = `"${title}" was not completed.`;
      break;
    }
    case 'FEEDBACK_REQUESTED':
      subject = `Tell us how it went: ${title}`;
      heading = 'Your feedback, please';
      paragraphs = [`Thank you for attending "${title}". Please take a couple of minutes to share your feedback.`];
      action = { url: trainingUrl, label: 'Give feedback' };
      message = `Please give feedback on "${title}".`;
      break;
    case 'CERTIFICATE_ISSUED':
      subject = `Your certificate: ${title}`;
      heading = 'Your certificate is ready';
      paragraphs = [`Your certificate for "${title}" has been issued.`];
      details.push(['Certificate number', data.certificate?.number], ['Verify at', data.certificate?.verifyUrl]);
      action = { url: `${base}/researcher/training/certificates`, label: 'Download certificate' };
      message = `Your certificate for "${title}" is ready.`;
      break;
    case 'CERTIFICATE_REVOKED':
      subject = `Certificate revoked: ${title}`;
      heading = 'A certificate has been revoked';
      paragraphs = [`Your certificate for "${title}" has been revoked and is no longer valid.`];
      details.push(['Certificate number', data.certificate?.number], ['Reason', data.reason]);
      action = { url: `${base}/researcher/training/certificates`, label: 'View certificates' };
      message = `Your certificate for "${title}" was revoked.`;
      break;
    default:
      throw new Error(`Unhandled kind ${kind}`);
  }

  details = details.filter(([, v]) => v);
  const { html, text } = renderBrandedEmail({
    title: heading,
    preheader: message,
    greeting: `Hi ${name},`,
    paragraphs,
    details,
    action,
    note,
    baseUrl: base,
  });

  return {
    subject: `HospitiumRIS - ${subject}`,
    html,
    text,
    notification: {
      type: NOTIFICATION_TYPE[kind],
      title: heading,
      message,
      priority: HIGH_PRIORITY.has(kind) ? 'HIGH' : 'NORMAL',
      actionUrl: action.url.replace(base, '') || '/researcher/training',
      actionLabel: action.label,
    },
  };
}

/**
 * Delivery rules, matching notificationService.shouldSendNotification: do-not-disturb,
 * channel switches and a TRAINING category opt-out.
 * @param {object|null} prefs  NotificationPreference row (null = defaults)
 * @param {'email'|'inApp'} channel
 */
export function shouldDeliver(prefs, channel) {
  if (!prefs) return true;
  if (prefs.doNotDisturb) return false;
  if (channel === 'email' && prefs.emailEnabled === false) return false;
  if (channel === 'inApp' && prefs.inAppEnabled === false) return false;
  const cat = prefs.categoryPreferences?.TRAINING;
  if (cat && cat[channel] === false) return false;
  return true;
}
