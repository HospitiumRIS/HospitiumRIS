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

test('trial ID lookup', async () => {
  const { lookupTrialRecord, trialIdSource } = await import('../src/lib/clinical-trials.js');
  assert.equal(trialIdSource('nct06654321'), 'ClinicalTrials.gov');
  assert.equal(trialIdSource('PACTR202611000123456'), 'PACTR');
  assert.equal(lookupTrialRecord(' ct-2025-28 ').record.phase, 'Phase II');
  assert.match(lookupTrialRecord('NCT00000001').error, /No record found/);
  assert.match(lookupTrialRecord('abc').error, /PACTR number/);
});

test('approvals, registry and team rows', async () => {
  const { approvalRows, registryRows, teamRows, gcpState } = await import('../src/lib/clinical-trials.js');
  const NOW2 = new Date('2026-11-25T10:00:00Z');
  const a = approvalRows(SAMPLE_TRIALS, NOW2);
  assert.equal(a[0].state, 'EXPIRED'); // ct-004 ethics expired
  assert.ok(!a.some((r) => r.kind === 'Regulatory' && r.trial.regulatory?.status === 'NOT_REQUIRED'));
  const r = registryRows(SAMPLE_TRIALS, NOW2);
  assert.ok(r.find((x) => x.id === 'ct-005').urgent);
  assert.equal(gcpState(null, NOW2), 'MISSING');
  assert.equal(gcpState('2026-12-15', NOW2), 'EXPIRING');
  const t = teamRows(SAMPLE_TRIALS, NOW2);
  assert.equal(t[0].gcp, 'MISSING');
});

test('safety deadlines, recruitment pace, compliance rows', async () => {
  const L = await import('../src/lib/clinical-trials.js');
  const NOW2 = new Date('2026-11-25T10:00:00Z');
  assert.equal(L.eventDeadline({ type: 'SAE', severity: 'Life-threatening', awareOn: '2026-11-21' }), '2026-11-28');
  assert.equal(L.eventDeadline({ type: 'SAE', severity: 'Serious', awareOn: '2026-11-09' }), '2026-11-24');
  assert.equal(L.eventDeadline({ type: 'DEVIATION', severity: 'Minor', awareOn: '2026-11-01' }), null);
  assert.equal(L.eventState({ type: 'SAE', severity: 'Serious', awareOn: '2026-11-09', status: 'OPEN' }, NOW2), 'OVERDUE');
  assert.equal(L.eventState({ type: 'SAE', severity: 'Life-threatening', awareOn: '2026-11-21', status: 'OPEN' }, NOW2), 'DUE_SOON');
  const ct1 = SAMPLE_TRIALS.find((t) => t.id === 'ct-001');
  assert.equal(L.safetyCounts(ct1, NOW2).overdue, 1);
  assert.equal(L.trialFlags(ct1, NOW2)[0].key, 'sae_overdue');
  const rec = L.recruitmentRows(SAMPLE_TRIALS, NOW2);
  assert.equal(rec.find((r) => r.trial.id === 'ct-004').pace, 'PAUSED');
  assert.ok(L.complianceRows(SAMPLE_TRIALS, NOW2).length >= 5);
});
