import { NextResponse } from 'next/server';
import { actOnExpense, projectBudgetContext } from '@/lib/project-budget-server';

/**
 * POST /api/projects/[id]/budget/expenses/[expenseId] { action, note? } (#179)
 * approve | reject (note required) | void (note required) | withdraw (own pending claim)
 */
export async function POST(request, { params }) {
  try {
    const { id, expenseId } = await params;
    const ctx = await projectBudgetContext(request, id);
    if (ctx.error) return ctx.error;
    const result = await actOnExpense(ctx, expenseId, await request.json().catch(() => ({})));
    if (result.error) return NextResponse.json({ error: result.error }, { status: result.status });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Expense action failed:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
