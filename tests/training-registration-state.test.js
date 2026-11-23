import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  allowedAdminStatuses,
  checkRegistrationTransition,
  checkRegistrationWindow,
  hasCapacity,
  isValidModuleProgressStatus,
  transitionFreesSeat,
  transitionTakesSeat,
} from '../src/lib/training-registration-state.js';

describe('checkRegistrationTransition (admin)', () => {
  it('allows the normal lifecycle', () => {
    assert.equal(checkRegistrationTransition('REGISTERED', 'COMPLETED').ok, true);
    assert.equal(checkRegistrationTransition('REGISTERED', 'CANCELLED').ok, true);
    assert.equal(checkRegistrationTransition('COMPLETED', 'REGISTERED').ok, true);
    assert.equal(checkRegistrationTransition('CANCELLED', 'REGISTERED').ok, true);
  });

  it('rejects jumps and unknown statuses instead of erroring in Prisma', () => {
    assert.equal(checkRegistrationTransition('CANCELLED', 'COMPLETED').ok, false);
    assert.equal(checkRegistrationTransition('COMPLETED', 'CANCELLED').ok, false);
    assert.equal(checkRegistrationTransition('NOT_COMPLETED', 'CANCELLED').ok, false);
    const bad = checkRegistrationTransition('REGISTERED', 'DONE');
    assert.equal(bad.ok, false);
    assert.match(bad.error, /Invalid status/);
    assert.equal(checkRegistrationTransition('REGISTERED', undefined).ok, false);
  });

  it('treats same status as a no-op', () => {
    assert.deepEqual(checkRegistrationTransition('COMPLETED', 'COMPLETED'), { ok: true, noop: true });
  });
});

describe('checkRegistrationTransition (self)', () => {
  it('participants can only cancel or re-register', () => {
    assert.equal(checkRegistrationTransition('REGISTERED', 'CANCELLED', { actor: 'self' }).ok, true);
    assert.equal(checkRegistrationTransition('CANCELLED', 'REGISTERED', { actor: 'self' }).ok, true);
    assert.equal(checkRegistrationTransition('REGISTERED', 'COMPLETED', { actor: 'self' }).ok, false);
    assert.equal(checkRegistrationTransition('COMPLETED', 'CANCELLED', { actor: 'self' }).ok, false);
  });
});

describe('transitionTakesSeat / allowedAdminStatuses', () => {
  it('only reinstating a cancelled registration takes a seat', () => {
    assert.equal(transitionTakesSeat('CANCELLED', 'REGISTERED'), true);
    assert.equal(transitionTakesSeat('REGISTERED', 'COMPLETED'), false);
    assert.equal(transitionTakesSeat('COMPLETED', 'REGISTERED'), false);
    assert.equal(transitionTakesSeat('WAITLISTED', 'REGISTERED'), true);
    assert.equal(transitionTakesSeat('PENDING_APPROVAL', 'REGISTERED'), false);
    assert.equal(transitionFreesSeat('PENDING_APPROVAL', 'REJECTED'), true);
    assert.equal(transitionFreesSeat('WAITLISTED', 'CANCELLED'), false);
  });

  it('lists the current status plus allowed next ones', () => {
    assert.deepEqual(allowedAdminStatuses('CANCELLED'), ['CANCELLED', 'REGISTERED']);
    assert.deepEqual(allowedAdminStatuses('PENDING_APPROVAL'), ['PENDING_APPROVAL', 'REGISTERED', 'REJECTED', 'CANCELLED']);
    assert.deepEqual(allowedAdminStatuses('REGISTERED'), ['REGISTERED', 'COMPLETED', 'NOT_COMPLETED', 'CANCELLED']);
    assert.deepEqual(allowedAdminStatuses('NOT_COMPLETED'), ['NOT_COMPLETED', 'COMPLETED', 'REGISTERED']);
  });
});

describe('checkRegistrationWindow', () => {
  const now = new Date('2026-12-01T09:00:00Z');

  it('closes when the training starts', () => {
    assert.equal(checkRegistrationWindow({ startDate: '2026-12-02T09:00:00Z' }, now).ok, true);
    assert.equal(checkRegistrationWindow({ startDate: '2026-12-01T09:00:00Z' }, now).ok, false);
    assert.equal(checkRegistrationWindow({ startDate: '2026-11-30T09:00:00Z' }, now).ok, false);
  });

  it('honours explicit open and close times when present', () => {
    const training = {
      startDate: '2026-12-10T09:00:00Z',
      registrationOpensAt: '2026-12-02T00:00:00Z',
      registrationClosesAt: '2026-12-08T00:00:00Z',
    };
    assert.match(checkRegistrationWindow(training, now).error, /not opened/);
    assert.equal(checkRegistrationWindow(training, new Date('2026-12-05T00:00:00Z')).ok, true);
    assert.match(checkRegistrationWindow(training, new Date('2026-12-09T00:00:00Z')).error, /closed/);
  });
});

describe('hasCapacity / module statuses', () => {
  it('checks seats', () => {
    assert.equal(hasCapacity({ maxParticipants: 2 }, 1), true);
    assert.equal(hasCapacity({ maxParticipants: 2 }, 2), false);
    assert.equal(hasCapacity({ maxParticipants: 0 }, 0), false);
  });

  it('validates module progress statuses', () => {
    assert.equal(isValidModuleProgressStatus('COMPLETED'), true);
    assert.equal(isValidModuleProgressStatus('DONE'), false);
  });
});

it('registration closes at the earlier of the close date and the start (#102)', () => {
  const now = new Date('2026-12-05T10:00:00Z');
  const training = { startDate: '2026-12-10T08:00:00Z', registrationClosesAt: '2026-12-20T00:00:00Z' };
  assert.equal(checkRegistrationWindow(training, now).ok, true);
  assert.equal(checkRegistrationWindow({ ...training, registrationClosesAt: '2026-12-01T00:00:00Z' }, now).ok, false);
  assert.equal(checkRegistrationWindow({ ...training, startDate: '2026-12-01T00:00:00Z' }, now).ok, false);
});
