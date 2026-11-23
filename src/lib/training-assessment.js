/**
 * Training assessments (#105): validation, attempt layout, grading, attempt rules,
 * what the participant may see, and item analysis. Pure: no database access.
 *
 * Question storage
 *   options  [{ id, text }]               SINGLE / MULTI (TRUE_FALSE uses fixed ids)
 *   correct  string[]                     option ids; TRUE_FALSE ['true'|'false'];
 *                                         SHORT_TEXT accepted answers (may be empty)
 * Attempt answers: { [questionId]: string | string[] }  (option id(s), 'true'/'false', text)
 */

export const ASSESSMENT_TYPES = ['PRE_TEST', 'POST_TEST', 'QUIZ'];
export const ASSESSMENT_TYPE_LABELS = { PRE_TEST: 'Pre-test', POST_TEST: 'Post-test', QUIZ: 'Quiz' };
export const QUESTION_TYPES = ['SINGLE', 'MULTI', 'TRUE_FALSE', 'SHORT_TEXT'];
export const QUESTION_TYPE_LABELS = {
  SINGLE: 'One correct answer',
  MULTI: 'Several correct answers',
  TRUE_FALSE: 'True / false',
  SHORT_TEXT: 'Short text',
};
export const TRUE_FALSE_OPTIONS = [{ id: 'true', text: 'True' }, { id: 'false', text: 'False' }];
/** Grace after the time limit, for network latency on submit. */
export const DEADLINE_GRACE_MS = 30 * 1000;

const str = (v, max) => (typeof v === 'string' ? v.trim().slice(0, max) : '');
const normText = (v) => String(v ?? '').trim().toLowerCase().replace(/\s+/g, ' ');

function intOrNull(value, { min, max }) {
  if (value === null || value === undefined || value === '') return { ok: true, value: null };
  const n = Number(value);
  if (!Number.isInteger(n) || n < min || n > max) return { ok: false };
  return { ok: true, value: n };
}

function dateOrNull(value) {
  if (value === null || value === undefined || value === '') return { ok: true, value: null };
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? { ok: false } : { ok: true, value: d };
}

/**
 * Validate assessment settings (create: all fields; update: only the ones present).
 * @returns {{ ok: true, data } | { ok: false, error }}
 */
export function validateAssessment(body, { partial = false, moduleIds = [] } = {}) {
  const b = body || {};
  const data = {};
  const has = (k) => !partial || b[k] !== undefined;

  if (has('title')) {
    const title = str(b.title, 200);
    if (!title) return { ok: false, error: 'Title is required' };
    data.title = title;
  }
  if (has('description')) data.description = str(b.description, 4000) || null;
  if (has('type')) {
    const type = b.type || 'QUIZ';
    if (!ASSESSMENT_TYPES.includes(type)) return { ok: false, error: 'Unknown assessment type' };
    data.type = type;
  }
  if (has('moduleId')) {
    const moduleId = b.moduleId || null;
    if (moduleId && !moduleIds.includes(moduleId)) return { ok: false, error: 'Module not found in this training' };
    data.moduleId = moduleId;
  }
  if (has('passMark')) {
    const v = intOrNull(b.passMark ?? 70, { min: 0, max: 100 });
    if (!v.ok || v.value === null) return { ok: false, error: 'Pass mark must be 0 to 100 (%)' };
    data.passMark = v.value;
  }
  if (has('maxAttempts')) {
    const v = intOrNull(b.maxAttempts, { min: 1, max: 50 });
    if (!v.ok) return { ok: false, error: 'Attempts must be 1 to 50, or empty for unlimited' };
    data.maxAttempts = v.value;
  }
  if (has('timeLimitMinutes')) {
    const v = intOrNull(b.timeLimitMinutes, { min: 1, max: 600 });
    if (!v.ok) return { ok: false, error: 'Time limit must be 1 to 600 minutes, or empty for none' };
    data.timeLimitMinutes = v.value;
  }
  for (const key of ['shuffleQuestions', 'shuffleOptions', 'showCorrectAnswers', 'isRequiredForCompletion', 'isPublished']) {
    if (has(key)) data[key] = b[key] === true;
  }
  for (const key of ['availableFrom', 'availableUntil']) {
    if (has(key)) {
      const v = dateOrNull(b[key]);
      if (!v.ok) return { ok: false, error: `${key === 'availableFrom' ? 'Opens' : 'Closes'} is not a valid date` };
      data[key] = v.value;
    }
  }
  if (data.availableFrom && data.availableUntil && data.availableUntil <= data.availableFrom) {
    return { ok: false, error: 'The assessment must close after it opens' };
  }
  return { ok: true, data };
}

/**
 * Validate one question.
 * @returns {{ ok: true, data: { type, prompt, options, correct, points, explanation } } | { ok: false, error }}
 */
export function validateQuestion(body) {
  const b = body || {};
  const type = b.type || 'SINGLE';
  if (!QUESTION_TYPES.includes(type)) return { ok: false, error: 'Unknown question type' };
  const prompt = str(b.prompt, 4000);
  if (!prompt) return { ok: false, error: 'Question text is required' };
  const points = Number(b.points ?? 1);
  if (!Number.isFinite(points) || points <= 0 || points > 100) return { ok: false, error: 'Points must be more than 0 and at most 100' };
  const explanation = str(b.explanation, 4000) || null;

  let options = [];
  let correct = [];
  if (type === 'SINGLE' || type === 'MULTI') {
    const raw = Array.isArray(b.options) ? b.options : [];
    const seen = new Set();
    options = raw
      .map((o, i) => ({ id: str(o?.id, 40) || `o${i + 1}`, text: str(o?.text, 1000) }))
      .filter((o) => o.text)
      .map((o) => {
        let id = o.id;
        while (seen.has(id)) id = `${id}x`;
        seen.add(id);
        return { id, text: o.text };
      });
    if (options.length < 2) return { ok: false, error: 'Add at least two answer options' };
    if (options.length > 12) return { ok: false, error: 'At most 12 answer options' };
    const ids = new Set(options.map((o) => o.id));
    correct = [...new Set((Array.isArray(b.correct) ? b.correct : []).filter((id) => ids.has(id)))];
    if (!correct.length) return { ok: false, error: 'Mark the correct answer' };
    if (type === 'SINGLE' && correct.length !== 1) return { ok: false, error: 'Mark exactly one correct answer' };
  } else if (type === 'TRUE_FALSE') {
    options = TRUE_FALSE_OPTIONS;
    const answer = String(Array.isArray(b.correct) ? b.correct[0] : b.correct);
    if (answer !== 'true' && answer !== 'false') return { ok: false, error: 'Choose whether the statement is true or false' };
    correct = [answer];
  } else {
    correct = [...new Set((Array.isArray(b.correct) ? b.correct : []).map((a) => str(a, 300)).filter(Boolean))].slice(0, 20);
  }
  return { ok: true, data: { type, prompt, options, correct, points, explanation } };
}

/** Deterministic shuffle from a seed string (so a resumed attempt keeps its order). */
export function seededShuffle(items, seed) {
  let h = 2166136261;
  for (const ch of String(seed)) h = Math.imul(h ^ ch.charCodeAt(0), 16777619);
  const rand = () => {
    h += 0x6d2b79f5;
    let t = h;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  const out = [...items];
  for (let i = out.length - 1; i > 0; i -= 1) {
    const j = Math.floor(rand() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

/**
 * Order of questions and options for an attempt: [{ questionId, optionIds }].
 */
export function buildAttemptLayout(questions, assessment, seed) {
  const ordered = [...(questions || [])].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
  const qs = assessment?.shuffleQuestions ? seededShuffle(ordered, `${seed}:q`) : ordered;
  return qs.map((q) => {
    const ids = (q.options || []).map((o) => o.id);
    const shuffle = assessment?.shuffleOptions && (q.type === 'SINGLE' || q.type === 'MULTI');
    return { questionId: q.id, optionIds: shuffle ? seededShuffle(ids, `${seed}:${q.id}`) : ids };
  });
}

/**
 * A question as the participant sees it while answering: never the correct answers or
 * the explanation.
 */
export function publicQuestion(question, optionIds = null) {
  const byId = new Map((question.options || []).map((o) => [o.id, o]));
  const order = optionIds || (question.options || []).map((o) => o.id);
  return {
    id: question.id,
    type: question.type,
    prompt: question.prompt,
    points: question.points,
    options: question.type === 'SHORT_TEXT' ? [] : order.map((id) => byId.get(id)).filter(Boolean).map((o) => ({ id: o.id, text: o.text })),
  };
}

/** Keep only well-formed answers for known questions (autosave and submit). */
export function sanitizeAnswers(questions, answers) {
  const out = {};
  const byId = new Map((questions || []).map((q) => [q.id, q]));
  for (const [qid, value] of Object.entries(answers || {})) {
    const q = byId.get(qid);
    if (!q) continue;
    const optionIds = new Set((q.options || []).map((o) => o.id));
    if (q.type === 'MULTI') {
      const list = Array.isArray(value) ? [...new Set(value.filter((v) => optionIds.has(v)))] : [];
      if (list.length) out[qid] = list;
    } else if (q.type === 'SHORT_TEXT') {
      const text = typeof value === 'string' ? value.slice(0, 2000) : '';
      if (text.trim()) out[qid] = text;
    } else if (typeof value === 'string' && optionIds.has(value)) {
      out[qid] = value;
    }
  }
  return out;
}

/**
 * Grade one answer.
 * @returns {{ score: number, max: number, correct: boolean|null }} correct null = needs manual grading
 */
export function gradeQuestion(question, answer, manualScore = undefined) {
  const max = Number(question.points) || 1;
  const correct = question.correct || [];
  if (question.type === 'SHORT_TEXT') {
    if (manualScore !== undefined && manualScore !== null) {
      const s = Math.max(0, Math.min(max, Number(manualScore) || 0));
      return { score: s, max, correct: s >= max };
    }
    if (typeof answer !== 'string' || !answer.trim()) return { score: 0, max, correct: false };
    if (correct.some((a) => normText(a) === normText(answer))) return { score: max, max, correct: true };
    return { score: 0, max, correct: null };
  }
  if (question.type === 'MULTI') {
    const picked = new Set(Array.isArray(answer) ? answer : []);
    const right = picked.size === correct.length && correct.every((id) => picked.has(id));
    return { score: right ? max : 0, max, correct: right };
  }
  const right = typeof answer === 'string' && answer === correct[0];
  return { score: right ? max : 0, max, correct: right };
}

/**
 * Grade a whole attempt. Short-text answers without an accepted-answer match wait for
 * manual grading (needsGrading) unless a manual score is given.
 * @returns {{ score, maxScore, percent, needsGrading, perQuestion: {[id]: {score,max,correct}} }}
 */
export function gradeAttempt(questions, answers, manualScores = {}) {
  let score = 0;
  let maxScore = 0;
  let needsGrading = false;
  const perQuestion = {};
  for (const q of questions || []) {
    const r = gradeQuestion(q, answers?.[q.id], manualScores?.[q.id]);
    perQuestion[q.id] = r;
    score += r.score;
    maxScore += r.max;
    if (r.correct === null) needsGrading = true;
  }
  const percent = maxScore > 0 ? Math.round((score / maxScore) * 1000) / 10 : 0;
  return { score: Math.round(score * 100) / 100, maxScore, percent, needsGrading, perQuestion };
}

export function isPass(percent, passMark) {
  return Number(percent) >= Number(passMark ?? 0);
}

/** Is the attempt past its deadline (with the grace)? */
export function attemptExpired(attempt, now = new Date()) {
  return Boolean(attempt?.deadlineAt) && now.getTime() > new Date(attempt.deadlineAt).getTime() + DEADLINE_GRACE_MS;
}

/**
 * May the participant start (or resume) an attempt?
 * @param {object[]} attempts  their attempts at this assessment
 * @returns {{ ok: boolean, error?: string, resume?: object, attemptsLeft: number|null, nextNumber: number }}
 */
export function canStartAttempt(assessment, attempts, now = new Date()) {
  const list = attempts || [];
  const used = list.length;
  const attemptsLeft = assessment?.maxAttempts ? Math.max(0, assessment.maxAttempts - used) : null;
  const base = { attemptsLeft, nextNumber: used + 1 };
  if (!assessment?.isPublished) return { ...base, ok: false, error: 'This assessment is not open' };
  const open = list.find((a) => a.status === 'IN_PROGRESS' && !attemptExpired(a, now));
  if (open) return { ...base, ok: true, resume: open };
  if (assessment.availableFrom && now < new Date(assessment.availableFrom)) return { ...base, ok: false, error: 'This assessment has not opened yet' };
  if (assessment.availableUntil && now > new Date(assessment.availableUntil)) return { ...base, ok: false, error: 'This assessment has closed' };
  if (list.some((a) => a.passed === true) && assessment.type !== 'QUIZ') return { ...base, ok: false, error: 'You have already passed' };
  if (attemptsLeft === 0) return { ...base, ok: false, error: 'No attempts left' };
  return { ...base, ok: true };
}

/** Deadline of a new attempt: the time limit, never past the closing time. */
export function attemptDeadline(assessment, startedAt = new Date()) {
  const candidates = [];
  if (assessment?.timeLimitMinutes) candidates.push(startedAt.getTime() + assessment.timeLimitMinutes * 60 * 1000);
  if (assessment?.availableUntil) candidates.push(new Date(assessment.availableUntil).getTime());
  return candidates.length ? new Date(Math.min(...candidates)) : null;
}

/** Best result across attempts (graded ones), for summaries. */
export function bestAttempt(attempts) {
  const graded = (attempts || []).filter((a) => a.percent !== null && a.percent !== undefined && a.status === 'GRADED');
  if (!graded.length) return null;
  return graded.reduce((best, a) => (a.percent > best.percent ? a : best));
}

/**
 * What the participant sees after submitting: their answers and score; correct answers
 * and explanations only if the assessment shows them.
 */
export function resultView(assessment, attempt, questions) {
  const show = Boolean(assessment?.showCorrectAnswers) && attempt?.status === 'GRADED';
  const per = attempt?.feedback?.perQuestion || {};
  const order = (attempt?.layout || []).map((l) => l.questionId);
  const byId = new Map((questions || []).map((q) => [q.id, q]));
  const ids = order.length ? order.filter((id) => byId.has(id)) : (questions || []).map((q) => q.id);
  return {
    attemptId: attempt.id,
    attemptNumber: attempt.attemptNumber,
    status: attempt.status,
    score: attempt.score,
    maxScore: attempt.maxScore,
    percent: attempt.percent,
    passed: attempt.passed,
    submittedAt: attempt.submittedAt,
    questions: ids.map((id) => {
      const q = byId.get(id);
      const layout = (attempt.layout || []).find((l) => l.questionId === id);
      return {
        ...publicQuestion(q, layout?.optionIds),
        answer: attempt.answers?.[id] ?? null,
        score: per[id]?.score ?? null,
        result: per[id] ? (per[id].correct === null ? 'pending' : per[id].correct ? 'correct' : 'incorrect') : null,
        ...(show ? { correct: q.correct, explanation: q.explanation || null } : {}),
      };
    }),
  };
}

/**
 * Item analysis over finished attempts: how often each question was answered right,
 * and how often each option was chosen.
 */
export function itemAnalysis(questions, attempts) {
  const done = (attempts || []).filter((a) => a.status === 'GRADED' || a.status === 'NEEDS_GRADING');
  return (questions || []).map((q) => {
    let answered = 0;
    let right = 0;
    let points = 0;
    const picks = Object.fromEntries((q.options || []).map((o) => [o.id, 0]));
    for (const a of done) {
      const ans = a.answers?.[q.id];
      if (ans === undefined || ans === null || (Array.isArray(ans) && !ans.length)) continue;
      answered += 1;
      for (const id of Array.isArray(ans) ? ans : [ans]) if (id in picks) picks[id] += 1;
      const r = a.feedback?.perQuestion?.[q.id] || gradeQuestion(q, ans);
      if (r.correct) right += 1;
      points += r.score || 0;
    }
    return {
      questionId: q.id,
      prompt: q.prompt,
      type: q.type,
      attempts: done.length,
      answered,
      percentCorrect: answered ? Math.round((right / answered) * 100) : null,
      averageScore: answered ? Math.round((points / answered) * 100) / 100 : null,
      options: (q.options || []).map((o) => ({ id: o.id, text: o.text, picked: picks[o.id], isCorrect: (q.correct || []).includes(o.id) })),
    };
  });
}

/** Completion facts for one registration: required assessments and how many passed. */
export function assessmentCompletionFacts(assessments, passedAssessmentIds) {
  const required = (assessments || []).filter((a) => a.isPublished && a.isRequiredForCompletion);
  const passed = new Set(passedAssessmentIds || []);
  return { required: required.length, passed: required.filter((a) => passed.has(a.id)).length };
}

/** ON_ASSESSMENT_PASS modules done: every published assessment linked to the module passed. */
export function modulesCompletedByAssessment(modules, assessments, passedAssessmentIds) {
  const passed = new Set(passedAssessmentIds || []);
  const out = [];
  for (const m of modules || []) {
    if (m.completionMode !== 'ON_ASSESSMENT_PASS') continue;
    const linked = (assessments || []).filter((a) => a.moduleId === m.id && a.isPublished);
    if (linked.length && linked.every((a) => passed.has(a.id))) out.push(m.id);
  }
  return out;
}
