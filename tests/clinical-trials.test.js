import { test } from 'node:test';
import assert from 'node:assert/strict';
import { SAMPLE_TRIALS, approvalState, enrolment, portfolioSummary, trialFlags, validateTrialDraft } from '../src/lib/clinical-trials.js';

const NOW = new Date('2026-11-25T10:00:00Z');
const byId = (id) => SAMPLE_TRIALS.find((t) => t.id === id);

test('approval state uses expiry dates', () => {
  assert.equal(approvalState({ status: 'APPROVED', expiry: '2027-06-01' }, NOW), 'APPROVED');
  assert.equal(approvalState({ status: 'APPROVED', expiry: '2026-12-20' }, NOW), 'EXPIRING');
  assert.equal(approvalState({ status: 'APPROVED', expiry: '2026-10-30' }, NOW), 'EXPIRED');
  assert.equal(approvalState(null, NOW), 'NOT_STARTED');
});

test('flags: overdue SAE first, registry gap, closed trials quiet', () => {
  const f1 = trialFlags(byId('ct-001'), NOW);
  assert.equal(f1[0].key, 'sae_overdue');
  assert.ok(trialFlags(byId('ct-005'), NOW).some((f) => f.key === 'not_registered'));
  assert.ok(trialFlags(byId('ct-002'), NOW).some((f) => f.key === 'ethics_expiring'));
  assert.deepEqual(trialFlags(byId('ct-007'), NOW), []);
});

test('enrolment and portfolio summary', () => {
  assert.deepEqual(enrolment({ targetEnrollment: 200, enrolled: 96 }), { target: 200, enrolled: 96, pct: 48 });
  const s = portfolioSummary(SAMPLE_TRIALS, NOW);
  assert.equal(s.total, 8);
  assert.equal(s.closed, 2);
  assert.equal(s.recruiting, 3);
  assert.ok(s.urgent >= 2);
});

test('draft validation', () => {
  assert.equal(validateTrialDraft({ title: '', phase: '', studyType: '' }).ok, false);
  assert.equal(validateTrialDraft({ title: 'X', phase: 'Phase II', studyType: 'Interventional', targetEnrollment: '50', startDate: '2027-01-01', endDate: '2026-01-01' }).errors.endDate, 'End date must be after the start date');
  assert.equal(validateTrialDraft({ title: 'X', phase: 'Phase II', studyType: 'Interventional', targetEnrollment: '50' }).ok, true);
});
