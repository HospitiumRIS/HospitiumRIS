import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  checkEligibility,
  checkSelfCancel,
  decideRegistration,
  pickPromotions,
  promotionTarget,
  validateEnrolmentSettings,
  waitlistPositions,
} from '../src/lib/training-enrolment.js';

describe('checkEligibility', () => {
  const t = { eligibilityMode: 'DEPARTMENT_ONLY', department: 'Nursing, Pharmacy', prerequisiteTrainingIds: ['p1', 'p2'] };

  it('limits to the training departments (case-insensitive) when asked', () => {
    assert.equal(checkEligibility({ ...t, prerequisiteTrainingIds: [] }, { department: ' nursing ' }).ok, true);
    const r = checkEligibility({ ...t, prerequisiteTrainingIds: [] }, { department: 'Radiology' });
    assert.equal(r.ok, false);
    assert.match(r.reasons[0], /Nursing, Pharmacy only/);
    assert.match(checkEligibility({ ...t, prerequisiteTrainingIds: [] }, {}).reasons[0], /add your department/);
    assert.equal(checkEligibility({ ...t, eligibilityMode: 'OPEN', prerequisiteTrainingIds: [] }, { department: 'Radiology' }).ok, true);
  });

  it('requires prerequisites and names the missing ones', () => {
    const r = checkEligibility({ ...t, eligibilityMode: 'OPEN' }, {}, { completedTrainingIds: ['p1'], prerequisiteTitles: { p2: 'Basic GCP' } });
    assert.equal(r.ok, false);
    assert.deepEqual(r.reasons, ['Complete first: Basic GCP']);
    assert.equal(checkEligibility({ ...t, eligibilityMode: 'OPEN' }, {}, { completedTrainingIds: ['p1', 'p2'] }).ok, true);
  });
});

describe('decideRegistration', () => {
  it('registers, asks for approval, waitlists or refuses', () => {
    assert.deepEqual(decideRegistration({ maxParticipants: 2 }, 1), { status: 'REGISTERED' });
    assert.deepEqual(decideRegistration({ maxParticipants: 2, requiresApproval: true }, 1), { status: 'PENDING_APPROVAL' });
    assert.deepEqual(decideRegistration({ maxParticipants: 2, waitlistEnabled: true, requiresApproval: true }, 2), { status: 'WAITLISTED' });
    assert.deepEqual(decideRegistration({ maxParticipants: 2 }, 2), { error: 'Training is full' });
    assert.equal(promotionTarget({ requiresApproval: true }), 'PENDING_APPROVAL');
    assert.equal(promotionTarget({}), 'REGISTERED');
  });
});

describe('waitlist', () => {
  const regs = [
    { id: 'a', status: 'REGISTERED', registeredAt: '2026-11-01' },
    { id: 'w2', status: 'WAITLISTED', registeredAt: '2026-11-03' },
    { id: 'p', status: 'PENDING_APPROVAL', registeredAt: '2026-11-02' },
    { id: 'w1', status: 'WAITLISTED', registeredAt: '2026-11-02T10:00:00Z' },
    { id: 'c', status: 'CANCELLED', registeredAt: '2026-11-01' },
    { id: 'w3', status: 'WAITLISTED', registeredAt: '2026-11-04' },
  ];

  it('orders the waiting list by registration time', () => {
    assert.deepEqual([...waitlistPositions(regs).entries()], [['w1', 1], ['w2', 2], ['w3', 3]]);
  });

  it('promotes as many as there are free places (pending requests hold places)', () => {
    assert.deepEqual(pickPromotions(regs, 2), []);
    assert.deepEqual(pickPromotions(regs, 3), ['w1']);
    assert.deepEqual(pickPromotions(regs, 10), ['w1', 'w2', 'w3']);
  });
});

describe('checkSelfCancel', () => {
  const now = new Date('2026-11-25T00:00:00Z');
  const t = { startDate: '2026-12-01T06:00:00Z', cancellationDeadline: '2026-11-24T00:00:00Z' };

  it('applies the cancellation deadline to confirmed places only', () => {
    assert.match(checkSelfCancel(t, { status: 'REGISTERED' }, now).error, /deadline/);
    assert.equal(checkSelfCancel(t, { status: 'WAITLISTED' }, now).ok, true);
    assert.equal(checkSelfCancel(t, { status: 'PENDING_APPROVAL' }, now).ok, true);
    assert.equal(checkSelfCancel({ ...t, cancellationDeadline: null }, { status: 'REGISTERED' }, now).ok, true);
  });

  it('never after the start, and not for finished or cancelled registrations', () => {
    assert.match(checkSelfCancel(t, { status: 'WAITLISTED' }, new Date('2026-12-01T07:00:00Z')).error, /started/);
    assert.equal(checkSelfCancel(t, { status: 'COMPLETED' }, now).ok, false);
    assert.equal(checkSelfCancel(t, { status: 'CANCELLED' }, now).ok, false);
  });
});

describe('validateEnrolmentSettings', () => {
  it('validates dates, modes and prerequisites', () => {
    const ok = validateEnrolmentSettings({ registrationOpensAt: '2026-11-01', registrationClosesAt: '2026-11-20', requiresApproval: true, eligibilityMode: 'DEPARTMENT_ONLY', prerequisiteTrainingIds: ['x', 'x', 'y'] });
    assert.equal(ok.ok, true);
    assert.deepEqual(ok.data.prerequisiteTrainingIds, ['x', 'y']);
    assert.equal(validateEnrolmentSettings({ registrationOpensAt: '2026-11-20', registrationClosesAt: '2026-11-01' }).ok, false);
    assert.equal(validateEnrolmentSettings({ registrationClosesAt: 'soon' }).ok, false);
    assert.equal(validateEnrolmentSettings({ eligibilityMode: 'TARGET_GROUP_ONLY' }).ok, false);
    assert.equal(validateEnrolmentSettings({ prerequisiteTrainingIds: ['t1'] }, { id: 't1' }).ok, false);
    assert.equal(validateEnrolmentSettings({ registrationOpensAt: null }).data.registrationOpensAt, null);
  });
});

describe('checkSelfCancel for assigned trainings (#103)', () => {
  it('people cannot drop a training assigned to them', () => {
    const training = { startDate: '2099-01-01T00:00:00Z' };
    assert.equal(checkSelfCancel(training, { status: 'REGISTERED', source: 'ASSIGNED' }).ok, false);
    assert.equal(checkSelfCancel(training, { status: 'REGISTERED', source: 'SELF' }).ok, true);
  });
});
