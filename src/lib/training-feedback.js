/**
 * Training feedback (#106): form questions, when a participant may answer, response
 * validation, result summaries, anonymity for facilitators and CSV export. Pure.
 *
 * Form questions: [{ id, type, label, required, options? }]
 *   RATING  1–5 stars        LIKERT  1–5 (strongly disagree … strongly agree)
 *   NPS     0–10             TEXT    free text        CHOICE  one of options[]
 */

export const FEEDBACK_QUESTION_TYPES = ['RATING', 'LIKERT', 'NPS', 'TEXT', 'CHOICE'];
export const FEEDBACK_QUESTION_LABELS = {
  RATING: 'Star rating (1–5)',
  LIKERT: 'Agree / disagree (5 points)',
  NPS: 'Recommend score (0–10)',
  TEXT: 'Free text',
  CHOICE: 'Multiple choice (one answer)',
};
export const LIKERT_LABELS = ['Strongly disagree', 'Disagree', 'Neutral', 'Agree', 'Strongly agree'];

export const DEFAULT_FEEDBACK_QUESTIONS = [
  { id: 'overall', type: 'RATING', label: 'Overall, how would you rate this training?', required: true },
  { id: 'objectives', type: 'LIKERT', label: 'The training met its stated objectives.', required: true },
  { id: 'relevant', type: 'LIKERT', label: 'The content is relevant to my work.', required: true },
  { id: 'facilitator', type: 'RATING', label: 'How would you rate the facilitator(s)?', required: true },
  { id: 'organisation', type: 'LIKERT', label: 'The training was well organised (venue, timing, materials).', required: false },
  { id: 'nps', type: 'NPS', label: 'How likely are you to recommend this training to a colleague?', required: true },
  { id: 'best', type: 'TEXT', label: 'What was most useful?', required: false },
  { id: 'improve', type: 'TEXT', label: 'What could be improved?', required: false },
];

const SCALE = { RATING: [1, 5], LIKERT: [1, 5], NPS: [0, 10] };
const str = (v, max) => (typeof v === 'string' ? v.trim().slice(0, max) : '');

/**
 * Validate a form definition.
 * @returns {{ ok: true, data: { title, intro, questions, anonymousToFacilitators } } | { ok: false, error }}
 */
export function validateFeedbackForm(body) {
  const b = body || {};
  const title = str(b.title, 200) || 'Training feedback';
  const intro = str(b.intro, 2000) || null;
  const raw = Array.isArray(b.questions) ? b.questions : [];
  if (!raw.length) return { ok: false, error: 'Add at least one question' };
  if (raw.length > 40) return { ok: false, error: 'At most 40 questions' };
  const seen = new Set();
  const questions = [];
  for (const [i, q] of raw.entries()) {
    const type = q?.type;
    if (!FEEDBACK_QUESTION_TYPES.includes(type)) return { ok: false, error: `Question ${i + 1}: unknown type` };
    const label = str(q.label, 500);
    if (!label) return { ok: false, error: `Question ${i + 1}: text is required` };
    let id = str(q.id, 40).replace(/[^A-Za-z0-9_-]/g, '') || `q${i + 1}`;
    while (seen.has(id)) id = `${id}_`;
    seen.add(id);
    const out = { id, type, label, required: q.required === true };
    if (type === 'CHOICE') {
      const options = [...new Set((Array.isArray(q.options) ? q.options : []).map((o) => str(o, 200)).filter(Boolean))];
      if (options.length < 2) return { ok: false, error: `Question ${i + 1}: add at least two choices` };
      out.options = options.slice(0, 12);
    }
    questions.push(out);
  }
  return { ok: true, data: { title, intro, questions, anonymousToFacilitators: b.anonymousToFacilitators !== false } };
}

/**
 * May the participant give feedback now? Once the training has ended, or once they
 * meet the training's attendance minimum.
 * @returns {{ unlocked: boolean, reason: string|null }}
 */
export function feedbackUnlocked(training, registration, now = new Date()) {
  if (!registration || !['REGISTERED', 'COMPLETED', 'NOT_COMPLETED'].includes(registration.status)) {
    return { unlocked: false, reason: 'Only participants can give feedback' };
  }
  if (training?.endDate && now >= new Date(training.endDate)) return { unlocked: true, reason: null };
  const min = Number(training?.minAttendancePercent);
  if (Number.isFinite(min) && min > 0 && registration.attendancePercent !== null && registration.attendancePercent !== undefined && registration.attendancePercent >= min) {
    return { unlocked: true, reason: null };
  }
  return { unlocked: false, reason: 'Feedback opens when the training ends' };
}

/**
 * Validate a participant's answers against the form.
 * @returns {{ ok: true, answers } | { ok: false, error, missing?: string[] }}
 */
export function validateResponse(form, input) {
  const answers = {};
  const missing = [];
  for (const q of form?.questions || []) {
    const v = input?.[q.id];
    if (q.type === 'TEXT') {
      const text = str(v, 4000);
      if (text) answers[q.id] = text;
    } else if (q.type === 'CHOICE') {
      if (typeof v === 'string' && q.options.includes(v)) answers[q.id] = v;
    } else if (v !== null && v !== undefined && v !== '') {
      const n = Number(v);
      const [lo, hi] = SCALE[q.type];
      if (!Number.isInteger(n) || n < lo || n > hi) return { ok: false, error: `"${q.label}" must be ${lo} to ${hi}` };
      answers[q.id] = n;
    }
    if (q.required && answers[q.id] === undefined) missing.push(q.label);
  }
  if (missing.length) return { ok: false, error: `Please answer: ${missing.join('; ')}`, missing };
  return { ok: true, answers };
}

/** Net Promoter Score: % promoters (9–10) minus % detractors (0–6). */
export function npsScore(values) {
  const v = (values || []).filter((x) => Number.isFinite(x));
  if (!v.length) return null;
  const promoters = v.filter((x) => x >= 9).length;
  const detractors = v.filter((x) => x <= 6).length;
  return Math.round(((promoters - detractors) / v.length) * 100);
}

const avg = (v) => (v.length ? Math.round((v.reduce((s, x) => s + x, 0) / v.length) * 100) / 100 : null);

/**
 * Per-question summary of responses. Text answers are listed without who wrote them.
 */
export function summarizeFeedback(form, responses) {
  const list = responses || [];
  return {
    responses: list.length,
    questions: (form?.questions || []).map((q) => {
      const values = list.map((r) => r.answers?.[q.id]).filter((x) => x !== undefined && x !== null && x !== '');
      const base = { id: q.id, type: q.type, label: q.label, answered: values.length };
      if (q.type === 'TEXT') return { ...base, texts: values };
      if (q.type === 'CHOICE') {
        return { ...base, distribution: q.options.map((o) => ({ label: o, count: values.filter((x) => x === o).length })) };
      }
      const [lo, hi] = SCALE[q.type];
      const nums = values.map(Number).filter(Number.isFinite);
      const distribution = [];
      for (let n = lo; n <= hi; n += 1) {
        distribution.push({ value: n, label: q.type === 'LIKERT' ? LIKERT_LABELS[n - 1] : String(n), count: nums.filter((x) => x === n).length });
      }
      return { ...base, average: avg(nums), distribution, ...(q.type === 'NPS' ? { nps: npsScore(nums) } : {}) };
    }),
  };
}

/**
 * Responses as a given viewer may see them. Facilitators of an anonymous form get no
 * identities at all, and the order is shuffled by response id so position can't hint.
 */
export function responsesForViewer(responses, { role, anonymous }) {
  const hide = role === 'facilitator' && anonymous;
  const rows = (responses || []).map((r) => ({
    id: hide ? null : r.id,
    submittedAt: hide ? null : r.submittedAt,
    answers: r.answers || {},
    respondent: hide ? null : r.respondent || null,
  }));
  return hide ? rows.sort((a, b) => JSON.stringify(a.answers).localeCompare(JSON.stringify(b.answers))) : rows;
}

/** CSV of responses (identity columns only when allowed). */
export function feedbackCsv(form, rows, { includeIdentity }) {
  const qs = form?.questions || [];
  const esc = (v) => `"${String(v ?? '').replace(/"/g, '""')}"`;
  const head = [...(includeIdentity ? ['Name', 'Email', 'Submitted'] : []), ...qs.map((q) => q.label)];
  const lines = rows.map((r) => [
    ...(includeIdentity ? [r.respondent?.name, r.respondent?.email, r.submittedAt ? new Date(r.submittedAt).toISOString() : ''] : []),
    ...qs.map((q) => {
      const v = r.answers?.[q.id];
      return q.type === 'LIKERT' && Number.isInteger(v) ? `${v} (${LIKERT_LABELS[v - 1]})` : v;
    }),
  ].map(esc).join(','));
  return [head.map(esc).join(','), ...lines].join('\n');
}

/** The form that applies to a training: its own, else the institution default. */
export function effectiveForm(trainingForm, institutionDefault) {
  if (trainingForm && trainingForm.isActive !== false) return { form: trainingForm, source: 'TRAINING' };
  if (institutionDefault && institutionDefault.isActive !== false) return { form: institutionDefault, source: 'INSTITUTION' };
  return { form: null, source: null };
}
