import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  appliesTo,
  buildMatrix,
  complianceTrend,
  monthEnds,
  percent,
  planAutoAssign,
  requirementAttention,
  requirementState,
  validUntil,
  validateRequirement,
} from '../src/lib/training-requirements.js';

const now = new Date('2026-12-01T09:00:00Z');
const BLS = { id: 'bls', title: 'BLS', departments: ['Nursing'], validityMonths: 24, dueWithinDays: 30, createdAt: '2025-01-01' };
const IPC = { id: 'ipc', title: 'IPC', departments: [], validityMonths: 12, dueWithinDays: 14, createdAt: '2025-01-01' };
const done = (id, completedAt, extra = {}) => ({ id, status: 'COMPLETED', completedAt, trainingId: `t-${id}`, training: { endDate: completedAt }, ...extra });

describe('validateRequirement', () => {
  it('defaults and limits', () => {
    assert.equal(validateRequirement({}).ok, false);
    const ok = validateRequirement({ title: ' BLS ', departments: ['Nursing', 'Nursing', ' '], validityMonths: '24' });
    assert.deepEqual([ok.data.title, ok.data.departments, ok.data.validityMonths, ok.data.dueWithinDays, ok.data.autoAssign], ['BLS', ['Nursing'], 24, 30, true]);
    assert.equal(validateRequirement({ title: 'x', validityMonths: 0 }).ok, false);
    assert.equal(validateRequirement({ title: 'x', validityMonths: '' }).data.validityMonths, null);
    assert.equal(validateRequirement({ title: 'x', dueWithinDays: 400 }).ok, false);
  });
});

describe('requirementState', () => {
  const s = (regs, opts = {}) => requirementState({ requirement: BLS, department: 'Nursing', registrations: regs, ...opts }, now).state;
  it('department scope and exemption', () => {
    assert.equal(appliesTo(BLS, ' nursing '), true);
    assert.equal(requirementState({ requirement: BLS, department: 'Pharmacy' }, now).state, 'NOT_REQUIRED');
    assert.equal(s([], { exempt: { reason: 'Locum' } }), 'EXEMPT');
  });
  it('compliant, expiring, expired by validity', () => {
    assert.equal(s([done('a', '2026-01-10')]), 'COMPLIANT');
    assert.equal(s([done('a', '2024-12-20')]), 'EXPIRING');   // valid to 20 Dec 2026
    assert.equal(s([done('a', '2024-11-01')]), 'EXPIRED');    // valid to 1 Nov 2026
  });
  it('certificate expiry wins over the validity rule; revoked certificates do not', () => {
    assert.equal(s([done('a', '2026-01-10', { certificate: { expiresAt: '2026-11-01', status: 'ISSUED' } })]), 'EXPIRED');
    assert.equal(s([done('a', '2026-01-10', { certificate: { expiresAt: '2026-11-01', status: 'REVOKED' } })]), 'COMPLIANT');
  });
  it('enrolled: due or overdue; latest completion counts', () => {
    const enrolled = { id: 'b', status: 'REGISTERED', dueDate: '2026-12-20', trainingId: 't-b', training: { startDate: '2026-12-10', endDate: '2026-12-11' } };
    assert.equal(s([enrolled]), 'DUE');
    assert.equal(s([{ ...enrolled, dueDate: '2026-11-20' }]), 'OVERDUE');
    assert.equal(s([done('a', '2024-11-01'), enrolled]), 'DUE');   // re-enrolled after expiry
    assert.equal(s([done('old', '2023-01-01'), done('new', '2026-06-01')]), 'COMPLIANT');
    assert.equal(s([{ id: 'c', status: 'CANCELLED' }]), 'MISSING');
  });
  it('validity adds calendar months safely', () => {
    assert.equal(validUntil(done('a', '2026-01-31T00:00:00Z'), { validityMonths: 1 }).toISOString().slice(0, 10), '2026-02-28');
    assert.equal(validUntil(done('a', '2026-01-31'), { validityMonths: null }), null);
  });
});

const people = [
  { id: 'n1', name: 'Nurse One', department: 'Nursing' },
  { id: 'n2', name: 'Nurse Two', department: 'Nursing' },
  { id: 'p1', name: 'Pharm One', department: 'Pharmacy' },
];
const regs = new Map([
  ['n1|bls', [done('r1', '2026-03-01')]],
  ['n1|ipc', [done('r2', '2026-02-01')]],
  ['n2|ipc', [done('r3', '2025-06-01')]],                    // expired 1 Jun 2026
  ['p1|ipc', [{ id: 'r4', status: 'REGISTERED', dueDate: '2026-11-15', trainingId: 'c-ipc', training: { startDate: '2026-11-01', endDate: '2026-11-02' } }]],
]);
const exemptions = new Map([['n2|bls', { reason: 'Locum', createdAt: '2026-10-01' }]]);
const matrix = buildMatrix({ requirements: [BLS, IPC], people, regsByUserReq: regs, exemptions }, now);

describe('buildMatrix (cross-checked by hand)', () => {
  it('cells', () => {
    const cell = (u, r) => matrix.rows.find((x) => x.id === u).cells[r].state;
    assert.deepEqual([cell('n1', 'bls'), cell('n1', 'ipc'), cell('n2', 'bls'), cell('n2', 'ipc'), cell('p1', 'bls'), cell('p1', 'ipc')],
      ['COMPLIANT', 'COMPLIANT', 'EXEMPT', 'EXPIRED', 'NOT_REQUIRED', 'OVERDUE']);
  });
  it('totals exclude exempt and not required', () => {
    // counted: n1 bls ✓, n1 ipc ✓, n2 ipc ✗, p1 ipc ✗ → 2 of 4
    assert.equal(matrix.totals.percent, 50);
    assert.equal(matrix.totals.required, 5);   // includes the exempt cell
    assert.equal(matrix.totals.EXEMPT, 1);
  });
  it('per requirement and per department', () => {
    const bls = matrix.byRequirement.find((r) => r.id === 'bls');
    assert.deepEqual([bls.required, bls.COMPLIANT, bls.EXEMPT, bls.percent], [2, 1, 1, 100]);
    const ipc = matrix.byRequirement.find((r) => r.id === 'ipc');
    assert.deepEqual([ipc.COMPLIANT, ipc.EXPIRED, ipc.OVERDUE, ipc.percent], [1, 1, 1, 33.3]);
    assert.deepEqual(matrix.byDepartment.map((d) => [d.key, d.percent]), [['Pharmacy', 0], ['Nursing', 66.7]]);
    assert.equal(matrix.rows.find((r) => r.id === 'p1').worst, 'OVERDUE');
  });
  it('percent helper', () => {
    assert.equal(percent(['NOT_REQUIRED', 'EXEMPT']), null);
  });
});

describe('complianceTrend', () => {
  it('month ends and historical compliance', () => {
    const ends = monthEnds(3, now);
    assert.deepEqual(ends.map((d) => d.toISOString().slice(0, 10)), ['2026-10-31', '2026-11-30', '2026-12-01']);
    const trend = complianceTrend({ requirements: [IPC], people, regsByUserReq: regs, exemptions }, 12, now);
    const at = (key) => trend.find((t) => t.key === key);
    // Jan 2026: n2 compliant (until Jun), n1 not yet (done Feb) → 1 of 3
    assert.deepEqual([at('2026-01').compliant, at('2026-01').required], [1, 3]);
    // Mar 2026: n1 ✓, n2 ✓ → 2 of 3
    assert.equal(at('2026-03').percent, 66.7);
    // Dec 2026 (now): n1 ✓ only → 1 of 3
    assert.equal(at('2026-12').percent, 33.3);
  });
});

describe('planAutoAssign', () => {
  const cohorts = [
    { id: 'later', status: 'PUBLISHED', startDate: '2027-01-20', endDate: '2027-01-21', maxParticipants: 10, taken: 0 },
    { id: 'soon', status: 'PUBLISHED', startDate: '2026-12-10', endDate: '2026-12-11', maxParticipants: 1, taken: 0 },
    { id: 'past', status: 'PUBLISHED', startDate: '2026-11-01', endDate: '2026-11-02', maxParticipants: 10, taken: 0 },
    { id: 'draft', status: 'DRAFT', startDate: '2026-12-05', endDate: '2026-12-06', maxParticipants: 10, taken: 0 },
  ];
  it('fills the earliest open cohort, then the next; skips enrolled and compliant people', () => {
    const rows = [
      { id: 'a', cells: { ipc: { state: 'MISSING' } } },
      { id: 'b', cells: { ipc: { state: 'EXPIRED' } } },
      { id: 'c', cells: { ipc: { state: 'DUE' } } },
      { id: 'd', cells: { ipc: { state: 'COMPLIANT' } } },
      { id: 'e', cells: { ipc: { state: 'EXEMPT' } } },
    ];
    const plan = planAutoAssign({ requirement: IPC, rows, cohorts }, now);
    assert.deepEqual(plan.assign.map((x) => [x.userId, x.trainingId]), [['a', 'soon'], ['b', 'later']]);
    // due: policy 14 days (15 Dec) but not before cohort end + 7 (18 Dec)
    assert.equal(plan.assign[0].dueDate.toISOString().slice(0, 10), '2026-12-18');
    assert.deepEqual(plan.noCohort, []);
  });
  it('re-running after assignment plans nothing (idempotent)', () => {
    const rows = [{ id: 'a', cells: { ipc: { state: 'DUE' } } }];
    assert.deepEqual(planAutoAssign({ requirement: IPC, rows, cohorts }, now).assign, []);
  });
  it('reports people with no cohort available', () => {
    const plan = planAutoAssign({ requirement: IPC, rows: [{ id: 'a', cells: { ipc: { state: 'MISSING' } } }], cohorts: [] }, now);
    assert.deepEqual(plan.noCohort, ['a']);
  });
  it('expiring people are due before their expiry', () => {
    const plan = planAutoAssign({ requirement: IPC, rows: [{ id: 'a', cells: { ipc: { state: 'EXPIRING', until: '2027-03-01' } } }], cohorts }, now);
    assert.equal(plan.assign[0].dueDate.toISOString().slice(0, 10), '2027-03-01');
  });
});

describe('requirementAttention', () => {
  it('overdue, no cohort, gaps and expiring', () => {
    const items = requirementAttention({
      byRequirement: [
        { id: 'ipc', title: 'IPC', OVERDUE: 1, MISSING: 0, EXPIRED: 1, EXPIRING: 0 },
        { id: 'bls', title: 'BLS', OVERDUE: 0, MISSING: 2, EXPIRED: 0, EXPIRING: 3 },
      ],
      cohortsByRequirement: new Map([['bls', [{ status: 'PUBLISHED', startDate: '2027-01-01' }]]]),
    }, now);
    assert.deepEqual(items.map((i) => `${i.kind}:${i.requirementId}`), ['OVERDUE:ipc', 'NO_COHORT:ipc', 'GAPS:bls', 'EXPIRING:bls']);
  });
});

describe('complianceSheets', () => {
  it('builds every sheet from the page data', async () => {
    const { complianceSheets } = await import('../src/lib/training-requirements.js');
    const sheets = complianceSheets({
      requirements: [{ ...BLS, isActive: true }, { ...IPC, isActive: true }],
      matrix,
      trend: [{ key: '2026-12', required: 4, compliant: 2, percent: 50 }],
      previousPercent: 40,
      assigned: { people: [], totals: { assigned: 0, overdue: 0 } },
    });
    assert.deepEqual(Object.keys(sheets), ['Summary', 'By requirement', 'By department', 'Matrix', 'People', 'Trend']);
    const n2 = sheets.Matrix.find((r) => r.Name === 'Nurse Two');
    assert.equal(n2.BLS, 'Exempt');
    assert.equal(n2.IPC, 'Expired (to 2026-06-01)');
    assert.equal(sheets.Matrix.find((r) => r.Name === 'Pharm One').BLS, '');
    assert.equal(sheets.Summary[1].Value, '40%');
  });
});
