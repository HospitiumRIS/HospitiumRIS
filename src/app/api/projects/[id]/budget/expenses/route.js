import { NextResponse } from 'next/server';
import { addExpense, projectBudgetContext } from '@/lib/project-budget-server';

/**
 * POST /api/projects/[id]/budget/expenses (multipart): the research office records an
 * expense (approved on entry), or a researcher on the project submits a claim with a
 * receipt (#179). Fields: description, amount, spentOn, budgetLineId?, payee?,
 * reference?, receipt (file), asClaim=1 (office submitting their own claim).
 */
export async function POST(request, { params }) {
  try {
    const { id } = await params;
    const ctx = await projectBudgetContext(request, id);
    if (ctx.error) return ctx.error;
    const form = await request.formData().catch(() => null);
    if (!form) return NextResponse.json({ error: 'Send the expense as a form' }, { status: 400 });
    const result = await addExpense(ctx, form);
    if (result.error) return NextResponse.json({ error: result.error }, { status: result.status });
    return NextResponse.json({ success: true, expense: { id: result.expense.id, status: result.expense.status } }, { status: 201 });
  } catch (error) {
    console.error('Adding expense failed:', error);
    const status = error?.status && error.status < 500 ? error.status : 500;
    return NextResponse.json({ error: status < 500 ? error.message : 'Internal server error' }, { status });
  }
}
