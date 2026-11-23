import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  assessmentCompletionFacts,
  attemptDeadline,
  attemptExpired,
  buildAttemptLayout,
  canStartAttempt,
  gradeAttempt,
  gradeQuestion,
  isPass,
  itemAnalysis,
  modulesCompletedByAssessment,
  publicQuestion,
  resultView,
  sanitizeAnswers,
  validateAssessment,
  validateQuestion,
} from '../src/lib/training-assessment.js';

const single = { id: 'q1', type: 'SINGLE', points: 2, options: [{ id: 'a', text: 'A' }, { id: 'b', text: 'B' }], correct: ['b'], explanation: 'Because B', order: 0 };
const multi = { id: 'q2', type: 'MULTI', points: 1, options: [{ id: 'a', text: 'A' }, { id: 'b', text: 'B' }, { id: 'c', text: 'C' }], correct: ['a', 'c'], order: 1 };
const tf = { id: 'q3', type: 'TRUE_FALSE', points: 1, options: [{ id: 'true', text: 'True' }, { id: 'false', text: 'False' }], correct: ['false'], order: 2 };
const text = { id: 'q4', type: 'SHORT_TEXT', points: 1, options: [], correct: ['Hand hygiene'], order: 3 };
const openText = { id: 'q5', type: 'SHORT_TEXT', points: 2, options: [], correct: [], order: 4 };
const questions = [single, multi, tf, text];

describe('validateQuestion', () => {
  it('single needs two options and exactly one correct', () => {
    assert.equal(validateQuestion({ type: 'SINGLE', prompt: 'Q', options: [{ text: 'A' }] }).ok, false);
    assert.equal(validateQuestion({ type: 'SINGLE', prompt: 'Q', options: [{ id: 'a', text: 'A' }, { id: 'b', text: 'B' }], correct: [] }).ok, false);
    assert.equal(validateQuestion({ type: 'SINGLE', prompt: 'Q', options: [{ id: 'a', text: 'A' }, { id: 'b', text: 'B' }], correct: ['a', 'b'] }).ok, false);
    const ok = validateQuestion({ type: 'SINGLE', prompt: ' Q ', options: [{ id: 'a', text: 'A' }, { id: 'b', text: 'B' }, { text: '' }], correct: ['a'] });
    assert.equal(ok.ok, true);
    assert.equal(ok.data.options.length, 2);
  });
  it('true/false and short text', () => {
    assert.equal(validateQuestion({ type: 'TRUE_FALSE', prompt: 'Q', correct: ['maybe'] }).ok, false);
    assert.deepEqual(validateQuestion({ type: 'TRUE_FALSE', prompt: 'Q', correct: 'true' }).data.correct, ['true']);
    assert.deepEqual(validateQuestion({ type: 'SHORT_TEXT', prompt: 'Q' }).data.correct, []);
  });
  it('points and unknown types', () => {
    assert.equal(validateQuestion({ type: 'ESSAY', prompt: 'Q' }).ok, false);
    assert.equal(validateQuestion({ type: 'SHORT_TEXT', prompt: 'Q', points: 0 }).ok, false);
  });
});

describe('validateAssessment', () => {
  it('defaults and limits', () => {
    const ok = validateAssessment({ title: 'Quiz' });
    assert.equal(ok.data.passMark, 70);
    assert.equal(ok.data.maxAttempts, null);
    assert.equal(validateAssessment({ title: 'Q', passMark: 120 }).ok, false);
    assert.equal(validateAssessment({ title: 'Q', moduleId: 'm9' }, { moduleIds: ['m1'] }).ok, false);
    assert.equal(validateAssessment({ title: 'Q', availableFrom: '2026-12-02', availableUntil: '2026-12-01' }).ok, false);
  });
  it('partial updates only touch what is sent', () => {
    assert.deepEqual(Object.keys(validateAssessment({ passMark: 50 }, { partial: true }).data), ['passMark']);
  });
});

describe('grading', () => {
  it('single, multi (all or nothing), true/false', () => {
    assert.deepEqual(gradeQuestion(single, 'b'), { score: 2, max: 2, correct: true });
    assert.equal(gradeQuestion(single, 'a').score, 0);
    assert.equal(gradeQuestion(multi, ['c', 'a']).correct, true);
    assert.equal(gradeQuestion(multi, ['a']).correct, false);
    assert.equal(gradeQuestion(multi, ['a', 'b', 'c']).correct, false);
    assert.equal(gradeQuestion(tf, 'false').correct, true);
    assert.equal(gradeQuestion(tf, undefined).correct, false);
  });
  it('short text: accepted answers match ignoring case and spaces; others wait for a grader', () => {
    assert.equal(gradeQuestion(text, '  hand   HYGIENE ').correct, true);
    assert.equal(gradeQuestion(text, 'gloves').correct, null);
    assert.equal(gradeQuestion(openText, 'anything').correct, null);
    assert.equal(gradeQuestion(openText, '').correct, false);
    assert.deepEqual(gradeQuestion(openText, 'x', 1.5), { score: 1.5, max: 2, correct: false });
    assert.equal(gradeQuestion(openText, 'x', 9).score, 2);
  });
  it('whole attempt', () => {
    const all = gradeAttempt(questions, { q1: 'b', q2: ['a', 'c'], q3: 'false', q4: 'hand hygiene' });
    assert.deepEqual([all.score, all.maxScore, all.percent, all.needsGrading], [5, 5, 100, false]);
    const some = gradeAttempt([...questions, openText], { q1: 'a', q2: ['a', 'c'], q5: 'essay' });
    assert.equal(some.needsGrading, true);
    assert.equal(some.score, 1);
    const graded = gradeAttempt([...questions, openText], { q1: 'a', q2: ['a', 'c'], q5: 'essay' }, { q5: 2 });
    assert.equal(graded.needsGrading, false);
    assert.equal(graded.percent, 42.9);
    assert.equal(isPass(70, 70), true);
    assert.equal(isPass(69.9, 70), false);
  });
});

describe('never leak answers before submission', () => {
  it('publicQuestion has no correct answers or explanation', () => {
    const p = publicQuestion(single);
    assert.equal('correct' in p, false);
    assert.equal('explanation' in p, false);
    assert.equal(JSON.stringify(p).includes('Because B'), false);
    assert.deepEqual(publicQuestion(text).options, []);
  });
  it('results show answers only when allowed and graded', () => {
    const attempt = { id: 'x', status: 'GRADED', answers: { q1: 'a' }, layout: [{ questionId: 'q1', optionIds: ['b', 'a'] }], feedback: { perQuestion: { q1: { score: 0, max: 2, correct: false } } } };
    const hidden = resultView({ showCorrectAnswers: false }, attempt, [single]);
    assert.equal('correct' in hidden.questions[0], false);
    assert.equal(hidden.questions[0].result, 'incorrect');
    assert.deepEqual(hidden.questions[0].options.map((o) => o.id), ['b', 'a']);
    const shown = resultView({ showCorrectAnswers: true }, attempt, [single]);
    assert.deepEqual(shown.questions[0].correct, ['b']);
    const pending = resultView({ showCorrectAnswers: true }, { ...attempt, status: 'NEEDS_GRADING' }, [single]);
    assert.equal('correct' in pending.questions[0], false);
  });
  it('answers are sanitised against the question', () => {
    assert.deepEqual(sanitizeAnswers(questions, { q1: 'zzz', q2: ['a', 'zzz', 'a'], q3: 'true', q4: 'x', nope: 'a' }), { q2: ['a'], q3: 'true', q4: 'x' });
  });
});

describe('layout', () => {
  it('keeps order without shuffle and is stable with a seed', () => {
    assert.deepEqual(buildAttemptLayout(questions, {}, 's').map((l) => l.questionId), ['q1', 'q2', 'q3', 'q4']);
    const a = buildAttemptLayout(questions, { shuffleQuestions: true, shuffleOptions: true }, 'seed-1');
    const b = buildAttemptLayout(questions, { shuffleQuestions: true, shuffleOptions: true }, 'seed-1');
    assert.deepEqual(a, b);
    assert.deepEqual(a.map((l) => l.questionId).sort(), ['q1', 'q2', 'q3', 'q4']);
    assert.deepEqual(a.find((l) => l.questionId === 'q3').optionIds, ['true', 'false']);
  });
});

describe('attempt rules', () => {
  const now = new Date('2026-12-01T10:00:00Z');
  const quiz = { isPublished: true, type: 'QUIZ', maxAttempts: 2 };
  it('attempts left, resume, window', () => {
    assert.equal(canStartAttempt({ ...quiz, isPublished: false }, [], now).ok, false);
    assert.equal(canStartAttempt(quiz, [], now).attemptsLeft, 2);
    assert.equal(canStartAttempt(quiz, [{ status: 'GRADED' }, { status: 'GRADED' }], now).ok, false);
    const open = { status: 'IN_PROGRESS', deadlineAt: null };
    assert.equal(canStartAttempt(quiz, [{ status: 'GRADED' }, open], now).resume, open);
    assert.equal(canStartAttempt({ ...quiz, availableFrom: '2026-12-02' }, [], now).ok, false);
    assert.equal(canStartAttempt({ ...quiz, availableUntil: '2026-11-30' }, [], now).ok, false);
    assert.equal(canStartAttempt({ isPublished: true, type: 'POST_TEST' }, [{ status: 'GRADED', passed: true }], now).ok, false);
  });
  it('deadlines', () => {
    const d = attemptDeadline({ timeLimitMinutes: 30, availableUntil: '2026-12-01T10:10:00Z' }, now);
    assert.equal(d.toISOString(), '2026-12-01T10:10:00.000Z');
    assert.equal(attemptDeadline({}, now), null);
    assert.equal(attemptExpired({ deadlineAt: '2026-12-01T09:59:50Z' }, now), false); // grace
    assert.equal(attemptExpired({ deadlineAt: '2026-12-01T09:59:00Z' }, now), true);
  });
});

describe('completion and modules', () => {
  const assessments = [
    { id: 'a1', isPublished: true, isRequiredForCompletion: true, moduleId: 'm1' },
    { id: 'a2', isPublished: true, isRequiredForCompletion: false, moduleId: 'm1' },
    { id: 'a3', isPublished: false, isRequiredForCompletion: true, moduleId: 'm2' },
  ];
  it('counts required published assessments', () => {
    assert.deepEqual(assessmentCompletionFacts(assessments, ['a1']), { required: 1, passed: 1 });
    assert.deepEqual(assessmentCompletionFacts(assessments, []), { required: 1, passed: 0 });
  });
  it('ON_ASSESSMENT_PASS modules need every linked published assessment', () => {
    const modules = [{ id: 'm1', completionMode: 'ON_ASSESSMENT_PASS' }, { id: 'm2', completionMode: 'ON_ASSESSMENT_PASS' }, { id: 'm3', completionMode: 'ADMIN' }];
    assert.deepEqual(modulesCompletedByAssessment(modules, assessments, ['a1']), []);
    assert.deepEqual(modulesCompletedByAssessment(modules, assessments, ['a1', 'a2']), ['m1']);
  });
});

describe('itemAnalysis', () => {
  it('percent correct and option picks', () => {
    const attempts = [
      { status: 'GRADED', answers: { q1: 'b' } },
      { status: 'GRADED', answers: { q1: 'a' } },
      { status: 'IN_PROGRESS', answers: { q1: 'a' } },
    ];
    const [q1] = itemAnalysis([single], attempts);
    assert.equal(q1.answered, 2);
    assert.equal(q1.percentCorrect, 50);
    assert.deepEqual(q1.options.map((o) => [o.id, o.picked, o.isCorrect]), [['a', 1, false], ['b', 1, true]]);
  });
});
