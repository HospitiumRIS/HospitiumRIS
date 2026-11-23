import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  actionTakesSeat,
  assignmentAction,
  complianceState,
  matchAssignees,
  reminderFor,
  summarizeCompliance,
  validateAssignment,
} from '../src/lib/training-assignment.js';

const now = new Date('2026-12-01T09:00:00Z');
const day = 24 * 60 * 60 * 1000;
const at = (days) => new Date(now.getTime() + days * day).toISOString();

describe('validateAssignment', () => {
  it('needs someone to assign', () => {
    assert.equal(validateAssignment({}, now).ok, false);
    assert.equal(validateAssignment({ userIds: ['a'] }, now).ok, true);
    assert.equal(validateAssignment({ departments: ['Nursing'] }, now).ok, true);
    assert.equal(validateAssignment({ allMembers: true }, now).ok, true);
  });
  it('checks the due date', () => {
    assert.equal(validateAssignment({ userIds: ['a'], dueDate: 'nope' }, now).ok, false);
    assert.equal(validateAssignment({ userIds: ['a'], dueDate: at(-5) }, now).ok, false);
    const ok = validateAssignment({ userIds: ['a', 'a'], dueDate: at(10) }, now);
    assert.deepEqual(ok.data.userIds, ['a']);
    assert.equal(ok.data.dueDate.toISOString(), at(10));
  });
});

describe('matchAssignees (scoping)', () => {
  const members = [
    { id: 'u1', department: 'Nursing' },
    { id: 'u2', department: ' nursing ' },
    { id: 'u3', department: 'Pharmacy' },
    { id: 'u4', department: null },
  ];
  it('matches departments case-insensitively', () => {
    const { assignees } = matchAssignees(members, { departments: ['NURSING'] });
    assert.deepEqual(assignees.map((m) => m.id).sort(), ['u1', 'u2']);
  });
  it('never assigns people outside the institution', () => {
    const { assignees, outOfScope } = matchAssignees(members, { userIds: ['u3', 'outsider'] });
    assert.deepEqual(assignees.map((m) => m.id), ['u3']);
    assert.deepEqual(outOfScope, ['outsider']);
  });
  it('everyone, without duplicates', () => {
    const { assignees } = matchAssignees(members, { allMembers: true, userIds: ['u1'], departments: ['Nursing'] });
    assert.equal(assignees.length, 4);
  });
});

describe('assignmentAction', () => {
  it('maps each status', () => {
    assert.equal(assignmentAction(null), 'create');
    assert.equal(assignmentAction({ status: 'CANCELLED' }), 'reinstate');
    assert.equal(assignmentAction({ status: 'REJECTED' }), 'reinstate');
    assert.equal(assignmentAction({ status: 'WAITLISTED' }), 'confirm');
    assert.equal(assignmentAction({ status: 'PENDING_APPROVAL' }), 'confirm');
    assert.equal(assignmentAction({ status: 'REGISTERED' }), 'update');
    assert.equal(assignmentAction({ status: 'NOT_COMPLETED' }), 'update');
    assert.equal(assignmentAction({ status: 'COMPLETED' }), 'skip-completed');
    assert.equal(actionTakesSeat('create'), true);
    assert.equal(actionTakesSeat('update'), false);
  });
});

describe('complianceState (overdue calculation)', () => {
  it('due dates', () => {
    assert.equal(complianceState({ status: 'REGISTERED', dueDate: at(-0.1) }, now).state, 'OVERDUE');
    assert.equal(complianceState({ status: 'NOT_COMPLETED', dueDate: at(-3) }, now).state, 'OVERDUE');
    assert.equal(complianceState({ status: 'REGISTERED', dueDate: at(7) }, now).state, 'DUE_SOON');
    assert.equal(complianceState({ status: 'REGISTERED', dueDate: at(8) }, now).state, 'ON_TRACK');
    assert.equal(complianceState({ status: 'REGISTERED' }, now).state, 'IN_PROGRESS');
    assert.equal(complianceState({ status: 'CANCELLED', dueDate: at(-3) }, now).state, 'WITHDRAWN');
  });
  it('certificate expiry flags re-training', () => {
    assert.equal(complianceState({ status: 'COMPLETED', dueDate: at(-30) }, now).state, 'COMPLETED');
    assert.equal(complianceState({ status: 'COMPLETED', certificate: { expiresAt: at(-1) } }, now).state, 'RETRAINING_DUE');
    assert.equal(complianceState({ status: 'COMPLETED', certificate: { expiresAt: at(20) } }, now).state, 'EXPIRING');
    assert.equal(complianceState({ status: 'COMPLETED', certificate: { expiresAt: at(90) } }, now).state, 'COMPLETED');
    assert.equal(complianceState({ status: 'COMPLETED', certificate: { status: 'REVOKED', expiresAt: at(-1) } }, now).state, 'COMPLETED');
  });
});

describe('reminderFor', () => {
  it('only assigned people get due reminders, weekly when overdue', () => {
    assert.equal(reminderFor({ id: 'r', source: 'SELF', status: 'REGISTERED', dueDate: at(3) }, now), null);
    assert.equal(reminderFor({ id: 'r', source: 'ASSIGNED', status: 'REGISTERED', dueDate: at(3) }, now).kind, 'TRAINING_DUE');
    const a = reminderFor({ id: 'r', source: 'ASSIGNED', status: 'REGISTERED', dueDate: at(-2) }, now);
    const b = reminderFor({ id: 'r', source: 'ASSIGNED', status: 'REGISTERED', dueDate: at(-6) }, now);
    const c = reminderFor({ id: 'r', source: 'ASSIGNED', status: 'REGISTERED', dueDate: at(-9) }, now);
    assert.equal(a.kind, 'TRAINING_OVERDUE');
    assert.notEqual(a.dedupeKey, b.dedupeKey); // different due date
    assert.match(c.dedupeKey, /:w1$/);
    assert.equal(reminderFor({ id: 'r', source: 'ASSIGNED', status: 'COMPLETED', dueDate: at(-9) }, now), null);
  });
  it('certificate reminders for anyone', () => {
    assert.equal(reminderFor({ id: 'r', status: 'COMPLETED', certificate: { id: 'c', expiresAt: at(10) } }, now).kind, 'CERTIFICATE_EXPIRING');
    assert.equal(reminderFor({ id: 'r', status: 'COMPLETED', certificate: { id: 'c', expiresAt: at(-1) } }, now).dedupeKey, 'retraining:c');
  });
});

describe('summarizeCompliance', () => {
  it('counts and percentage', () => {
    const s = summarizeCompliance([
      { status: 'COMPLETED' },
      { status: 'COMPLETED', certificate: { expiresAt: at(10) } },
      { status: 'REGISTERED', dueDate: at(-1) },
      { status: 'REGISTERED', dueDate: at(2) },
      { status: 'CANCELLED' },
    ], now);
    assert.equal(s.assigned, 4);
    assert.equal(s.completed, 2);
    assert.equal(s.overdue, 1);
    assert.equal(s.dueSoon, 1);
    assert.equal(s.percentCompliant, 50);
  });
});
