/**
 * Project budgets and expenses (#179). Pure: no database, no Next.js.
 *
 * A project is an APPROVED proposal. Its budget is a set of lines (category, amount);
 * when no lines exist the proposal's total budget is the budget. Expenses are recorded
 * by the research office (approved on entry) or claimed by a researcher on the project
 * (submitted, then approved or rejected by the research office).
 */

const DAY = 24 * 60 * 60 * 1000;

export const BUDGET_CATEGORIES = [
  'Personnel',
  'Equipment',
  'Consumables and supplies',
  'Travel',
  'Participant costs',
  'Services and subcontracts',
  'Publication and dissemination',
  'Indirect costs',
  'Other',
];

export const EXPENSE_STATUS_LABELS = {
  SUBMITTED: 'Awaiting approval',
  APPROVED: 'Approved',
  REJECTED: 'Rejected',
  VOID: 'Voided',
};

/** Burn: how spending compares with time elapsed. */
export const BURN_LABELS = {
  NO_DATA: 'No spending recorded',
  ON_TRACK: 'On track',
  UNDER: 'Spending slowly',
  OVER: 'Spending fast',
  OVERSPENT: 'Over budget',
  NOT_STARTED: 'Not started',
};

const money = (v) => Math.round(Number(v || 0) * 100) / 100;
const num = (v) => (v === null || v === undefined || v === '' ? NaN : Number(v));

// ---- validation ------------------------------------------------------------------------

export function validateBudgetLine(body) {
  const b = body || {};
  const category = typeof b.category === 'string' ? b.category.trim().slice(0, 80) : '';
  if (!category) return { ok: false, error: 'Choose a category' };
  const amount = num(b.amount);
  if (!Number.isFinite(amount) || amount <= 0 || amount > 1e12) return { ok: false, error: 'Amount must be more than 0' };
  return {
    ok: true,
    data: {
      category,
      description: typeof b.description === 'string' && b.description.trim() ? b.description.trim().slice(0, 500) : null,
      amount: money(amount),
    },
  };
}

/**
 * @param {object} body
 * @param {{ currency: string, lineIds: string[], now?: Date }} ctx
 */
export function validateExpense(body, { currency, lineIds = [], now = new Date() } = {}) {
  const b = body || {};
  const description = typeof b.description === 'string' ? b.description.trim().slice(0, 500) : '';
  if (!description) return { ok: false, error: 'Describe what the money was spent on' };
  const amount = num(b.amount);
  if (!Number.isFinite(amount) || amount <= 0 || amount > 1e12) return { ok: false, error: 'Amount must be more than 0' };
  const spentOn = b.spentOn ? new Date(b.spentOn) : null;
  if (!spentOn || Number.isNaN(spentOn.getTime())) return { ok: false, error: 'Enter the date of the expense' };
  if (spentOn.getTime() > now.getTime() + DAY) return { ok: false, error: 'The expense date cannot be in the future' };
  const cur = String(b.currency || currency || '').trim().toUpperCase();
  if (currency && cur !== String(currency).toUpperCase()) return { ok: false, error: `Expenses must be in the project currency (${currency})` };
  const budgetLineId = b.budgetLineId ? String(b.budgetLineId) : null;
  if (budgetLineId && !lineIds.includes(budgetLineId)) return { ok: false, error: 'Choose a budget line of this project' };
  return {
    ok: true,
    data: {
      description,
      amount: money(amount),
      currency: cur || 'USD',
      spentOn,
      budgetLineId,
      payee: typeof b.payee === 'string' && b.payee.trim() ? b.payee.trim().slice(0, 200) : null,
      reference: typeof b.reference === 'string' && b.reference.trim() ? b.reference.trim().slice(0, 100) : null,
    },
  };
}

// ---- permissions -----------------------------------------------------------------------

const OFFICE = ['RESEARCH_ADMIN', 'INSTITUTION_ADMIN', 'GLOBAL_ADMIN'];

/**
 * What a user may do on one project's budget.
 * @param {{ inScope: boolean, involved: boolean }} facts  same meaning as proposal access:
 *   inScope = the proposal is visible to the user; involved = creator, PI or co-investigator
 */
export function budgetPermissions(user, { inScope = false, involved = false } = {}) {
  const office = Boolean(user && OFFICE.includes(user.accountType) && inScope);
  return {
    view: office || (inScope && involved),
    editLines: office,
    recordExpense: office,
    claim: inScope && involved,
    decide: office,
  };
}

/** Can this user approve or reject this claim? Never their own. */
export function canDecideExpense(user, expense, perms) {
  return Boolean(perms?.decide && expense?.status === 'SUBMITTED' && expense.submittedById !== user?.id);
}

/** Next status for an action, or an error. */
export function expenseTransition(expense, action, { user, perms } = {}) {
  switch (action) {
    case 'approve':
    case 'reject':
      if (expense.status !== 'SUBMITTED') return { error: 'Only claims awaiting approval can be decided' };
      if (!canDecideExpense(user, expense, perms)) return { error: 'You cannot decide this claim' };
      return { status: action === 'approve' ? 'APPROVED' : 'REJECTED' };
    case 'void':
      if (expense.status !== 'APPROVED') return { error: 'Only approved expenses can be voided' };
      if (!perms?.decide) return { error: 'Only the research office can void an expense' };
      return { status: 'VOID' };
    case 'withdraw':
      if (expense.status !== 'SUBMITTED') return { error: 'Only pending claims can be withdrawn' };
      if (expense.submittedById !== user?.id) return { error: 'Only the person who submitted the claim can withdraw it' };
      return { status: 'DELETE' };
    default:
      return { error: 'Unknown action' };
  }
}

// ---- figures ---------------------------------------------------------------------------

/**
 * Budget figures for one project.
 * @param {{ totalBudget, lines: [{id, category, amount}], expenses: [{amount, status, budgetLineId}], startDate, endDate }} p
 */
export function budgetFigures({ totalBudget = null, lines = [], expenses = [], startDate = null, endDate = null }, now = new Date()) {
  const linesTotal = money(lines.reduce((a, l) => a + Number(l.amount || 0), 0));
  const budget = lines.length ? linesTotal : money(totalBudget);
  const approved = expenses.filter((e) => e.status === 'APPROVED');
  const spent = money(approved.reduce((a, e) => a + Number(e.amount || 0), 0));
  const pending = money(expenses.filter((e) => e.status === 'SUBMITTED').reduce((a, e) => a + Number(e.amount || 0), 0));
  const remaining = money(budget - spent);

  const start = startDate ? new Date(startDate) : null;
  const end = endDate ? new Date(endDate) : null;
  let pctTime = null;
  if (start && end && end > start) pctTime = Math.max(0, Math.min(100, Math.round(((now - start) / (end - start)) * 100)));
  const pctSpent = budget > 0 ? Math.round((spent / budget) * 1000) / 10 : null;

  let burn;
  if (budget > 0 && spent > budget) burn = 'OVERSPENT';
  else if (start && now < start) burn = 'NOT_STARTED';
  else if (!approved.length) burn = 'NO_DATA';
  else if (pctTime === null || pctSpent === null) burn = 'ON_TRACK';
  else if (pctSpent - pctTime > 15) burn = 'OVER';
  else if (pctTime - pctSpent > 30 && pctTime >= 25) burn = 'UNDER';
  else burn = 'ON_TRACK';

  const byLine = lines.map((l) => {
    const lineSpent = money(approved.filter((e) => e.budgetLineId === l.id).reduce((a, e) => a + Number(e.amount || 0), 0));
    return { id: l.id, category: l.category, description: l.description || null, amount: money(l.amount), spent: lineSpent, remaining: money(Number(l.amount) - lineSpent), pctSpent: Number(l.amount) > 0 ? Math.round((lineSpent / Number(l.amount)) * 1000) / 10 : null, over: lineSpent > Number(l.amount) };
  });
  const unallocated = money(approved.filter((e) => !e.budgetLineId || !lines.some((l) => l.id === e.budgetLineId)).reduce((a, e) => a + Number(e.amount || 0), 0));

  return {
    budget,
    budgetSource: lines.length ? 'LINES' : totalBudget ? 'PROPOSAL' : 'NONE',
    linesTotal,
    differsFromProposal: Boolean(lines.length && totalBudget && Math.abs(linesTotal - Number(totalBudget)) >= 0.01),
    spent,
    pending,
    remaining,
    pctSpent,
    pctTime,
    burn,
    burnLabel: BURN_LABELS[burn],
    byLine,
    unallocated,
    claimsPending: expenses.filter((e) => e.status === 'SUBMITTED').length,
  };
}

/** Totals across projects (one currency per group). */
export function portfolioFigures(projects) {
  const byCurrency = new Map();
  for (const p of projects) {
    const c = p.currency || 'USD';
    const t = byCurrency.get(c) || { currency: c, projects: 0, budget: 0, spent: 0, pending: 0, remaining: 0 };
    t.projects += 1;
    t.budget = money(t.budget + p.figures.budget);
    t.spent = money(t.spent + p.figures.spent);
    t.pending = money(t.pending + p.figures.pending);
    t.remaining = money(t.remaining + p.figures.remaining);
    byCurrency.set(c, t);
  }
  const totals = [...byCurrency.values()].sort((a, b) => b.budget - a.budget);
  return {
    totals,
    main: totals[0] || { currency: 'USD', projects: 0, budget: 0, spent: 0, pending: 0, remaining: 0 },
    claimsPending: projects.reduce((a, p) => a + p.figures.claimsPending, 0),
    overspent: projects.filter((p) => p.figures.burn === 'OVERSPENT').length,
    spendingFast: projects.filter((p) => p.figures.burn === 'OVER').length,
    noBudget: projects.filter((p) => p.figures.budgetSource === 'NONE').length,
  };
}

const d10 = (v) => (v ? new Date(v).toISOString().slice(0, 10) : '');

export function expenseExportRows(expenses) {
  return expenses.map((e) => ({
    Date: d10(e.spentOn),
    Project: e.projectTitle || '',
    'Budget line': e.lineCategory || 'Unallocated',
    Description: e.description,
    Payee: e.payee || '',
    Reference: e.reference || '',
    Amount: Number(e.amount),
    Currency: e.currency,
    Status: EXPENSE_STATUS_LABELS[e.status] || e.status,
    Source: e.source === 'CLAIM' ? 'Claim' : 'Research office',
    'Submitted by': e.submittedByName || '',
    'Decided by': e.decidedByName || '',
    Note: e.decisionNote || '',
    Receipt: e.receiptFileId ? 'Yes' : 'No',
  }));
}

export function projectExportRows(projects) {
  return projects.map((p) => ({
    Project: p.title,
    PI: p.pi || '',
    Department: p.department || '',
    Funder: p.funder || '',
    Currency: p.currency,
    Budget: p.figures.budget,
    Spent: p.figures.spent,
    'Awaiting approval': p.figures.pending,
    Remaining: p.figures.remaining,
    '% spent': p.figures.pctSpent ?? '',
    '% time elapsed': p.figures.pctTime ?? '',
    Burn: p.figures.burnLabel,
    Starts: d10(p.startDate),
    Ends: d10(p.endDate),
  }));
}
