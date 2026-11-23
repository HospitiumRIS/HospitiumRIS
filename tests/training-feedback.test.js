import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  DEFAULT_FEEDBACK_QUESTIONS,
  effectiveForm,
  feedbackCsv,
  feedbackUnlocked,
  npsScore,
  responsesForViewer,
  summarizeFeedback,
  validateFeedbackForm,
  validateResponse,
} from '../src/lib/training-feedback.js';

const form = {
  questions: [
    { id: 'overall', type: 'RATING', label: 'Overall', required: true },
    { id: 'agree', type: 'LIKERT', label: 'Met objectives', required: false },
    { id: 'nps', type: 'NPS', label: 'Recommend', required: true },
    { id: 'venue', type: 'CHOICE', label: 'Venue', required: false, options: ['Good', 'Poor'] },
    { id: 'notes', type: 'TEXT', label: 'Notes', required: false },
  ],
};

describe('validateFeedbackForm', () => {
  it('accepts the default questions', () => {
    assert.equal(validateFeedbackForm({ questions: DEFAULT_FEEDBACK_QUESTIONS }).ok, true);
  });
  it('rejects empty, unknown types and thin choices; anonymous by default', () => {
    assert.equal(validateFeedbackForm({ questions: [] }).ok, false);
    assert.equal(validateFeedbackForm({ questions: [{ type: 'ESSAY', label: 'x' }] }).ok, false);
    assert.equal(validateFeedbackForm({ questions: [{ type: 'CHOICE', label: 'x', options: ['a'] }] }).ok, false);
    const ok = validateFeedbackForm({ questions: [{ id: 'a', type: 'TEXT', label: 'x' }, { id: 'a', type: 'TEXT', label: 'y' }] });
    assert.deepEqual(ok.data.questions.map((q) => q.id), ['a', 'a_']);
    assert.equal(ok.data.anonymousToFacilitators, true);
  });
});

describe('feedbackUnlocked', () => {
  const now = new Date('2026-12-01T10:00:00Z');
  it('after the end, or once attendance is met', () => {
    assert.equal(feedbackUnlocked({ endDate: '2026-11-30' }, { status: 'REGISTERED' }, now).unlocked, true);
    assert.equal(feedbackUnlocked({ endDate: '2026-12-05' }, { status: 'REGISTERED' }, now).unlocked, false);
    assert.equal(feedbackUnlocked({ endDate: '2026-12-05', minAttendancePercent: 75 }, { status: 'REGISTERED', attendancePercent: 80 }, now).unlocked, true);
    assert.equal(feedbackUnlocked({ endDate: '2026-12-05', minAttendancePercent: 75 }, { status: 'REGISTERED', attendancePercent: 50 }, now).unlocked, false);
  });
  it('only participants', () => {
    assert.equal(feedbackUnlocked({ endDate: '2026-11-30' }, { status: 'CANCELLED' }, now).unlocked, false);
    assert.equal(feedbackUnlocked({ endDate: '2026-11-30' }, null, now).unlocked, false);
  });
});

describe('validateResponse', () => {
  it('ranges, choices and required answers', () => {
    assert.equal(validateResponse(form, { overall: 6, nps: 3 }).ok, false);
    assert.equal(validateResponse(form, { overall: 4 }).ok, false);
    assert.deepEqual(validateResponse(form, { overall: 4 }).missing, ['Recommend']);
    const ok = validateResponse(form, { overall: '4', nps: 0, venue: 'Nope', notes: ' fine ', extra: 'x' });
    assert.deepEqual(ok.answers, { overall: 4, nps: 0, notes: 'fine' });
  });
});

describe('summaries', () => {
  const responses = [
    { answers: { overall: 5, agree: 4, nps: 10, venue: 'Good', notes: 'Great' } },
    { answers: { overall: 3, agree: 2, nps: 6 } },
    { answers: { overall: 4, nps: 9, venue: 'Poor' } },
  ];
  it('averages, distributions, NPS and texts', () => {
    const s = summarizeFeedback(form, responses);
    assert.equal(s.responses, 3);
    const overall = s.questions.find((q) => q.id === 'overall');
    assert.equal(overall.average, 4);
    assert.deepEqual(overall.distribution.map((d) => d.count), [0, 0, 1, 1, 1]);
    assert.equal(s.questions.find((q) => q.id === 'nps').nps, 33);
    assert.deepEqual(s.questions.find((q) => q.id === 'venue').distribution, [{ label: 'Good', count: 1 }, { label: 'Poor', count: 1 }]);
    assert.deepEqual(s.questions.find((q) => q.id === 'notes').texts, ['Great']);
    assert.equal(s.questions.find((q) => q.id === 'agree').distribution[1].label, 'Disagree');
  });
  it('NPS edge cases', () => {
    assert.equal(npsScore([]), null);
    assert.equal(npsScore([10, 10]), 100);
    assert.equal(npsScore([0, 7, 8]), -33);
  });
});

describe('anonymity (#106 acceptance)', () => {
  const rows = [
    { id: 'r1', submittedAt: '2026-12-01', answers: { notes: 'b' }, respondent: { name: 'Anna', email: 'anna@x.org' } },
    { id: 'r2', submittedAt: '2026-12-02', answers: { notes: 'a' }, respondent: { name: 'Ben', email: 'ben@x.org' } },
  ];
  it('facilitators of an anonymous form see no identities, ids or times', () => {
    const seen = responsesForViewer(rows, { role: 'facilitator', anonymous: true });
    assert.equal(seen.every((r) => r.respondent === null && r.id === null && r.submittedAt === null), true);
    assert.equal(JSON.stringify(seen).includes('Anna'), false);
    assert.equal(JSON.stringify(seen).includes('anna@'), false);
  });
  it('admins, and facilitators of a named form, see who answered', () => {
    assert.equal(responsesForViewer(rows, { role: 'admin', anonymous: true })[0].respondent.name, 'Anna');
    assert.equal(responsesForViewer(rows, { role: 'facilitator', anonymous: false })[1].respondent.name, 'Ben');
  });
  it('CSV without identity has no names', () => {
    const csv = feedbackCsv(form, responsesForViewer(rows, { role: 'facilitator', anonymous: true }), { includeIdentity: false });
    assert.equal(csv.includes('Anna'), false);
    assert.equal(csv.split('\n')[0].includes('Name'), false);
    assert.equal(feedbackCsv(form, rows, { includeIdentity: true }).includes('anna@x.org'), true);
  });
});

describe('effectiveForm', () => {
  it('training form first, then the institution default', () => {
    assert.equal(effectiveForm({ id: 't' }, { id: 'i' }).source, 'TRAINING');
    assert.equal(effectiveForm(null, { id: 'i' }).source, 'INSTITUTION');
    assert.equal(effectiveForm({ id: 't', isActive: false }, { id: 'i' }).source, 'INSTITUTION');
    assert.equal(effectiveForm(null, null).form, null);
  });
});
