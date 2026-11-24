import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  budgetFigures,
  budgetPermissions,
  canDecideExpense,
  expenseExportRows,
  expenseTransition,
  portfolioFigures,
  projectExportRows,
  validateBudgetLine,
  validateExpense,
} from '../src/lib/project-budget.js';

const now = new Date('2026-11-25T09:00:00Z');
const office = { id: 'o', accountType: 'RESEARCH_ADMIN' };
const pi = { id: 'p', accountType: 'RESEARCHER' };

describe('validation', () => {
  it('budget lines', () => {
    assert.equal(validateBudgetLine({ amount: 10 }).ok, false);
    assert.equal(validateBudgetLine({ category: 'Travel', amount: 0 }).ok, false);
    assert.deepEqual(validateBudgetLine({ category: ' Travel ', amount: '1500.456', description: ' ' }).data, { category: 'Travel', description: null, amount: 1500.46 });
  });
  it('expenses: currency, line, date', () => {
    const ctx = { currency: 'USD', lineIds: ['l1'], now };
    assert.equal(validateExpense({ amount: 5, spentOn: '2026-11-20' }, ctx).ok, false); // no description
    assert.equal(validateExpense({ description: 'x', amount: 5, spentOn: '2026-12-20' }, ctx).error, 'The expense date cannot be in the future');
    assert.equal(validateExpense({ description: 'x', amount: 5, spentOn: '2026-11-20', currency: 'KES' }, ctx).error, 'Expenses must be in the project currency (USD)');
    assert.equal(validateExpense({ description: 'x', amount: 5, spentOn: '2026-11-20', budgetLineId: 'other' }, ctx).ok, false);
    const ok = validateExpense({ description: ' Flights ', amount: '420', spentOn: '2026-11-20', budgetLineId: 'l1', currency: 'usd' }, ctx);
    assert.deepEqual([ok.ok, ok.data.description, ok.data.amount, ok.data.currency, ok.data.budgetLineId], [true, 'Flights', 420, 'USD', 'l1']);
  });
});

describe('permissions and transitions', () => {
  it('office manages, people on the project claim, others nothing', () => {
    assert.deepEqual(budgetPermissions(office, { inScope: true }), { view: true, editLines: true, recordExpense: true, claim: false, decide: true });
    assert.deepEqual(budgetPermissions(office, { inScope: false }), { view: false, editLines: false, recordExpense: false, claim: false, decide: false });
    assert.deepEqual(budgetPermissions(pi, { inScope: true, involved: true }), { view: true, editLines: false, recordExpense: false, claim: true, decide: false });
    assert.equal(budgetPermissions(pi, { inScope: false, involved: true }).view, false);
  });
  it('nobody decides their own claim', () => {
    const perms = budgetPermissions(office, { inScope: true, involved: true });
    assert.equal(canDecideExpense(office, { status: 'SUBMITTED', submittedById: 'o' }, perms), false);
    assert.equal(canDecideExpense(office, { status: 'SUBMITTED', submittedById: 'p' }, perms), true);
  });
  it('transitions', () => {
    const perms = budgetPermissions(office, { inScope: true });
    const claim = { status: 'SUBMITTED', submittedById: 'p' };
    assert.equal(expenseTransition(claim, 'approve', { user: office, perms }).status, 'APPROVED');
    assert.equal(expenseTransition(claim, 'reject', { user: office, perms }).status, 'REJECTED');
    assert.ok(expenseTransition({ status: 'APPROVED' }, 'approve', { user: office, perms }).error);
    assert.equal(expenseTransition({ status: 'APPROVED' }, 'void', { user: office, perms }).status, 'VOID');
    assert.ok(expenseTransition({ status: 'APPROVED' }, 'void', { user: pi, perms: budgetPermissions(pi, { inScope: true, involved: true }) }).error);
    assert.equal(expenseTransition(claim, 'withdraw', { user: pi }).status, 'DELETE');
    assert.ok(expenseTransition(claim, 'withdraw', { user: office }).error);
  });
});

describe('budgetFigures (hand-counted)', () => {
  const lines = [{ id: 'l1', category: 'Personnel', amount: 60000 }, { id: 'l2', category: 'Travel', amount: 10000 }];
  const expenses = [
    { amount: 20000, status: 'APPROVED', budgetLineId: 'l1' },
    { amount: 12000, status: 'APPROVED', budgetLineId: 'l2' },
    { amount: 500, status: 'APPROVED', budgetLineId: null },
    { amount: 3000, status: 'SUBMITTED', budgetLineId: 'l2' },
    { amount: 999, status: 'REJECTED', budgetLineId: 'l1' },
    { amount: 777, status: 'VOID', budgetLineId: 'l1' },
  ];
  it('lines are the budget; only approved spending counts', () => {
    const f = budgetFigures({ totalBudget: 75000, lines, expenses, startDate: '2026-01-01', endDate: '2027-12-31' }, now);
    // spent 32,500 of 70,000 = 46.4 %; time 330 of 729 days = 45 %
    assert.deepEqual([f.budget, f.budgetSource, f.spent, f.pending, f.remaining, f.pctSpent, f.pctTime, f.burn], [70000, 'LINES', 32500, 3000, 37500, 46.4, 45, 'ON_TRACK']);
    assert.equal(f.differsFromProposal, true);
    assert.deepEqual(f.byLine.map((l) => [l.category, l.spent, l.remaining, l.over]), [['Personnel', 20000, 40000, false], ['Travel', 12000, -2000, true]]);
    assert.deepEqual([f.unallocated, f.claimsPending], [500, 1]);
  });
  it('falls back to the proposal total; burn states', () => {
    const base = { totalBudget: 10000, startDate: '2026-01-01', endDate: '2026-12-31' };
    assert.equal(budgetFigures({ ...base }, now).burn, 'NO_DATA');
    assert.equal(budgetFigures({ ...base, expenses: [{ amount: 12000, status: 'APPROVED' }] }, now).burn, 'OVERSPENT');
    assert.equal(budgetFigures({ ...base, expenses: [{ amount: 9900, status: 'APPROVED' }] }, now).burn, 'ON_TRACK'); // 99 % vs 90 %
    assert.equal(budgetFigures({ ...base, startDate: '2026-06-01', endDate: '2027-06-01', expenses: [{ amount: 9000, status: 'APPROVED' }] }, now).burn, 'OVER'); // 90 % spent vs 48 % time
    assert.equal(budgetFigures({ ...base, expenses: [{ amount: 1000, status: 'APPROVED' }] }, now).burn, 'UNDER'); // 10 % vs 90 %
    assert.equal(budgetFigures({ ...base, startDate: '2027-01-01', endDate: '2027-12-31' }, now).burn, 'NOT_STARTED');
    assert.equal(budgetFigures({}, now).budgetSource, 'NONE');
  });
});

describe('portfolio and exports', () => {
  const projects = [
    { title: 'A', currency: 'USD', figures: budgetFigures({ totalBudget: 1000, expenses: [{ amount: 1200, status: 'APPROVED' }, { amount: 50, status: 'SUBMITTED' }] }, now) },
    { title: 'B', currency: 'USD', figures: budgetFigures({ totalBudget: 3000 }, now) },
    { title: 'C', currency: 'KES', figures: budgetFigures({ totalBudget: 500000 }, now) },
    { title: 'D', currency: 'USD', figures: budgetFigures({}, now) },
  ];
  it('totals per currency', () => {
    const p = portfolioFigures(projects);
    assert.deepEqual(p.totals.map((t) => [t.currency, t.projects, t.budget, t.spent]), [['KES', 1, 500000, 0], ['USD', 3, 4000, 1200]]);
    assert.deepEqual([p.claimsPending, p.overspent, p.noBudget], [1, 1, 1]);
  });
  it('export rows', () => {
    assert.deepEqual(Object.keys(projectExportRows(projects)[0]).slice(0, 6), ['Project', 'PI', 'Department', 'Funder', 'Currency', 'Budget']);
    const e = expenseExportRows([{ spentOn: '2026-11-20', description: 'x', amount: '12.5', currency: 'USD', status: 'SUBMITTED', source: 'CLAIM' }])[0];
    assert.deepEqual([e.Date, e['Budget line'], e.Amount, e.Status, e.Source, e.Receipt], ['2026-11-20', 'Unallocated', 12.5, 'Awaiting approval', 'Claim', 'No']);
  });
});
