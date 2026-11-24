import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getAuthenticatedUser } from '@/lib/auth-server';
import { PROPOSAL_ACCESS_SELECT, canAccessProposal, findCoInvestigatorProposalIds, getInstitutionMembers, institutionProposalScopeWhere } from '@/lib/proposals/visibility';
import { isPersonallyInvolved, personalProposalWhere, userInstitutionId } from '@/lib/proposals/scope';
import { uploadServerSide } from '@/lib/storage/files-service';
import { budgetFigures, budgetPermissions, expenseTransition, portfolioFigures, validateBudgetLine, validateExpense } from '@/lib/project-budget';

const json = (body, status = 200) => NextResponse.json(body, { status });
const fullName = (u) => (u ? `${u.givenName || ''} ${u.familyName || ''}`.trim() || u.email : null);

const PROJECT_SELECT = {
  ...PROPOSAL_ACCESS_SELECT,
  title: true,
  status: true,
  departments: true,
  fundingSource: true,
  fundingInstitution: true,
  grantNumber: true,
  totalBudgetAmount: true,
  budgetCurrency: true,
  startDate: true,
  endDate: true,
  grantStartDate: true,
  grantEndDate: true,
};

/**
 * Session user + project + what they may do with its budget (#179). Only APPROVED
 * proposals have a budget; anything the user can't see is a 404.
 */
export async function projectBudgetContext(request, proposalId) {
  const user = await getAuthenticatedUser(request);
  if (!user) return { error: json({ error: 'Unauthorized' }, 401) };
  const proposal = proposalId ? await prisma.proposal.findUnique({ where: { id: proposalId }, select: PROJECT_SELECT }) : null;
  if (!proposal) return { error: json({ error: 'Project not found' }, 404) };
  const perms = budgetPermissions(user, { inScope: await canAccessProposal(user, proposal), involved: isPersonallyInvolved(user, proposal) });
  if (!perms.view) return { error: json({ error: 'Project not found' }, 404) };
  if (proposal.status !== 'APPROVED') return { error: json({ error: 'Only approved projects have a budget' }, 409) };
  return { user, proposal, perms };
}

const projectDates = (p) => ({ startDate: p.grantStartDate || p.startDate, endDate: p.grantEndDate || p.endDate });
const currencyOf = (p) => (p.budgetCurrency || 'USD').toUpperCase();

async function names(ids) {
  const list = [...new Set(ids.filter(Boolean))];
  if (!list.length) return new Map();
  const users = await prisma.user.findMany({ where: { id: { in: list } }, select: { id: true, givenName: true, familyName: true, email: true } });
  return new Map(users.map((u) => [u.id, fullName(u)]));
}

function expenseOut(e, nameMap, lineMap, projectTitle = null) {
  return {
    id: e.id,
    proposalId: e.proposalId,
    projectTitle,
    budgetLineId: e.budgetLineId,
    lineCategory: e.budgetLineId ? lineMap.get(e.budgetLineId) || null : null,
    spentOn: e.spentOn,
    description: e.description,
    amount: Number(e.amount),
    currency: e.currency,
    payee: e.payee,
    reference: e.reference,
    receiptFileId: e.receiptFileId,
    status: e.status,
    source: e.source,
    submittedById: e.submittedById,
    submittedByName: nameMap.get(e.submittedById) || null,
    decidedByName: e.decidedById ? nameMap.get(e.decidedById) || null : null,
    decidedAt: e.decidedAt,
    decisionNote: e.decisionNote,
    createdAt: e.createdAt,
  };
}

/** One project's budget: lines, expenses, figures. */
export async function loadProjectBudget(ctx, now = new Date()) {
  const { proposal } = ctx;
  const [lines, expenses] = await Promise.all([
    prisma.projectBudgetLine.findMany({ where: { proposalId: proposal.id }, orderBy: { createdAt: 'asc' } }),
    prisma.projectExpense.findMany({ where: { proposalId: proposal.id }, orderBy: [{ spentOn: 'desc' }, { createdAt: 'desc' }] }),
  ]);
  // Researchers see their own claims and every approved expense; the office sees all.
  const visible = ctx.perms.decide ? expenses : expenses.filter((e) => e.status === 'APPROVED' || e.submittedById === ctx.user.id);
  const nameMap = await names(visible.flatMap((e) => [e.submittedById, e.decidedById]));
  const lineMap = new Map(lines.map((l) => [l.id, l.category]));
  const figures = budgetFigures({ totalBudget: proposal.totalBudgetAmount ? Number(proposal.totalBudgetAmount) : null, lines, expenses, ...projectDates(proposal) }, now);
  return {
    project: {
      id: proposal.id,
      title: proposal.title,
      currency: currencyOf(proposal),
      proposalBudget: proposal.totalBudgetAmount ? Number(proposal.totalBudgetAmount) : null,
      funder: proposal.fundingInstitution || proposal.fundingSource || null,
      grantNumber: proposal.grantNumber || null,
      ...projectDates(proposal),
    },
    lines: lines.map((l) => ({ id: l.id, category: l.category, description: l.description, amount: Number(l.amount) })),
    expenses: visible.map((e) => ({ ...expenseOut(e, nameMap, lineMap), mine: e.submittedById === ctx.user.id })),
    figures,
    permissions: ctx.perms,
  };
}

export async function createLine(ctx, body) {
  if (!ctx.perms.editLines) return { status: 403, error: 'Only the research office can edit the budget' };
  const v = validateBudgetLine(body);
  if (!v.ok) return { status: 400, error: v.error };
  const line = await prisma.projectBudgetLine.create({ data: { ...v.data, proposalId: ctx.proposal.id, createdById: ctx.user.id } });
  return { line };
}

export async function updateLine(ctx, lineId, body) {
  if (!ctx.perms.editLines) return { status: 403, error: 'Only the research office can edit the budget' };
  const found = await prisma.projectBudgetLine.findFirst({ where: { id: lineId, proposalId: ctx.proposal.id }, select: { id: true } });
  if (!found) return { status: 404, error: 'Budget line not found' };
  const v = validateBudgetLine(body);
  if (!v.ok) return { status: 400, error: v.error };
  return { line: await prisma.projectBudgetLine.update({ where: { id: lineId }, data: v.data }) };
}

export async function deleteLine(ctx, lineId) {
  if (!ctx.perms.editLines) return { status: 403, error: 'Only the research office can edit the budget' };
  const found = await prisma.projectBudgetLine.findFirst({ where: { id: lineId, proposalId: ctx.proposal.id }, select: { id: true } });
  if (!found) return { status: 404, error: 'Budget line not found' };
  // Expenses on the line stay, as unallocated.
  await prisma.projectBudgetLine.delete({ where: { id: lineId } });
  return { ok: true };
}

/**
 * Record an expense (office, approved on entry) or submit a claim (researcher on the
 * project). `form` is a FormData (receipt optional for the office, required for claims).
 */
export async function addExpense(ctx, form) {
  const asOffice = ctx.perms.recordExpense && form.get('asClaim') !== '1';
  if (!asOffice && !ctx.perms.claim) return { status: 403, error: 'You cannot add expenses to this project' };
  const lines = await prisma.projectBudgetLine.findMany({ where: { proposalId: ctx.proposal.id }, select: { id: true } });
  const body = Object.fromEntries(['description', 'amount', 'spentOn', 'currency', 'budgetLineId', 'payee', 'reference'].map((k) => [k, form.get(k) || undefined]));
  const v = validateExpense(body, { currency: currencyOf(ctx.proposal), lineIds: lines.map((l) => l.id) });
  if (!v.ok) return { status: 400, error: v.error };
  const receipt = form.get('receipt');
  const hasReceipt = receipt && typeof receipt === 'object' && receipt.size > 0;
  if (!asOffice && !hasReceipt) return { status: 400, error: 'Attach a receipt to your claim' };

  let receiptFileId = null;
  if (hasReceipt) {
    const tenantId = userInstitutionId(ctx.user) || null;
    const stored = await uploadServerSide({ user: ctx.user, module: 'PROJECT_EXPENSE_RECEIPT', entityType: 'Proposal', entityId: ctx.proposal.id, file: receipt, entityTenantId: tenantId });
    receiptFileId = stored?.id || stored?.fileId || null;
  }
  const now = new Date();
  const expense = await prisma.projectExpense.create({
    data: {
      ...v.data,
      proposalId: ctx.proposal.id,
      receiptFileId,
      source: asOffice ? 'OFFICE' : 'CLAIM',
      status: asOffice ? 'APPROVED' : 'SUBMITTED',
      submittedById: ctx.user.id,
      ...(asOffice ? { decidedById: ctx.user.id, decidedAt: now } : {}),
    },
  });
  return { expense };
}

/** approve | reject | void | withdraw */
export async function actOnExpense(ctx, expenseId, { action, note }) {
  const expense = await prisma.projectExpense.findFirst({ where: { id: expenseId, proposalId: ctx.proposal.id } });
  if (!expense) return { status: 404, error: 'Expense not found' };
  const next = expenseTransition(expense, action, { user: ctx.user, perms: ctx.perms });
  if (next.error) return { status: 403, error: next.error };
  const text = typeof note === 'string' ? note.trim().slice(0, 500) : '';
  if ((action === 'reject' || action === 'void') && !text) return { status: 400, error: 'Give a reason' };
  if (next.status === 'DELETE') {
    await prisma.projectExpense.delete({ where: { id: expense.id } });
    return { ok: true };
  }
  const updated = await prisma.projectExpense.update({
    where: { id: expense.id },
    data: { status: next.status, decidedById: ctx.user.id, decidedAt: new Date(), decisionNote: text || null },
  });
  return { expense: updated };
}

/**
 * Institution portfolio (#179): every approved project of the institution with its
 * figures, all expenses, and claims waiting for approval.
 */
export async function loadInstitutionBudget(institutionId, now = new Date()) {
  if (!institutionId) return { projects: [], expenses: [], portfolio: portfolioFigures([]) };
  const members = await getInstitutionMembers(institutionId);
  const where = { AND: [await institutionProposalScopeWhere(institutionId, members), { status: 'APPROVED' }] };
  const proposals = await prisma.proposal.findMany({
    where,
    select: { ...PROJECT_SELECT, principalInvestigator: true },
    orderBy: { endDate: 'asc' },
  });
  const ids = proposals.map((p) => p.id);
  const [lines, expenses] = ids.length
    ? await Promise.all([
        prisma.projectBudgetLine.findMany({ where: { proposalId: { in: ids } } }),
        prisma.projectExpense.findMany({ where: { proposalId: { in: ids } }, orderBy: [{ spentOn: 'desc' }, { createdAt: 'desc' }] }),
      ])
    : [[], []];
  const linesBy = new Map();
  for (const l of lines) linesBy.set(l.proposalId, [...(linesBy.get(l.proposalId) || []), l]);
  const expBy = new Map();
  for (const e of expenses) expBy.set(e.proposalId, [...(expBy.get(e.proposalId) || []), e]);

  const projects = proposals.map((p) => ({
    id: p.id,
    title: p.title,
    pi: p.principalInvestigator || null,
    department: Array.isArray(p.departments) && p.departments.length ? p.departments.join(', ') : null,
    funder: p.fundingInstitution || p.fundingSource || null,
    currency: currencyOf(p),
    ...projectDates(p),
    lineCount: (linesBy.get(p.id) || []).length,
    figures: budgetFigures({ totalBudget: p.totalBudgetAmount ? Number(p.totalBudgetAmount) : null, lines: linesBy.get(p.id) || [], expenses: expBy.get(p.id) || [], ...projectDates(p) }, now),
  }));
  const titles = new Map(proposals.map((p) => [p.id, p.title]));
  const nameMap = await names(expenses.flatMap((e) => [e.submittedById, e.decidedById]));
  const lineMap = new Map(lines.map((l) => [l.id, l.category]));
  return {
    projects,
    expenses: expenses.map((e) => expenseOut(e, nameMap, lineMap, titles.get(e.proposalId))),
    portfolio: portfolioFigures(projects),
  };
}

/** A researcher's own approved projects with budget figures. */
export async function loadMyBudgets(user, now = new Date()) {
  const coIds = await findCoInvestigatorProposalIds(user);
  const mine = await prisma.proposal.findMany({
    where: { AND: [personalProposalWhere(user, coIds), { status: 'APPROVED' }] },
    select: PROJECT_SELECT,
    orderBy: { endDate: 'asc' },
  });
  const ids = mine.map((p) => p.id);
  const [lines, expenses] = ids.length
    ? await Promise.all([
        prisma.projectBudgetLine.findMany({ where: { proposalId: { in: ids } } }),
        prisma.projectExpense.findMany({ where: { proposalId: { in: ids } } }),
      ])
    : [[], []];
  return mine.map((p) => {
    const own = expenses.filter((e) => e.proposalId === p.id);
    return {
      id: p.id,
      title: p.title,
      currency: currencyOf(p),
      funder: p.fundingInstitution || p.fundingSource || null,
      ...projectDates(p),
      myPendingClaims: own.filter((e) => e.status === 'SUBMITTED' && e.submittedById === user.id).length,
      figures: budgetFigures({ totalBudget: p.totalBudgetAmount ? Number(p.totalBudgetAmount) : null, lines: lines.filter((l) => l.proposalId === p.id), expenses: own, ...projectDates(p) }, now),
    };
  });
}
