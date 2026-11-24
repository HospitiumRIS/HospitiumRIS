import { NextResponse } from 'next/server';
import { createLine, loadProjectBudget, projectBudgetContext } from '@/lib/project-budget-server';

/** GET /api/projects/[id]/budget: lines, expenses and figures (#179). */
export async function GET(request, { params }) {
  try {
    const { id } = await params;
    const ctx = await projectBudgetContext(request, id);
    if (ctx.error) return ctx.error;
    return NextResponse.json({ success: true, ...(await loadProjectBudget(ctx)) });
  } catch (error) {
    console.error('Loading project budget failed:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/** POST /api/projects/[id]/budget { category, description?, amount }: add a budget line (research office). */
export async function POST(request, { params }) {
  try {
    const { id } = await params;
    const ctx = await projectBudgetContext(request, id);
    if (ctx.error) return ctx.error;
    const result = await createLine(ctx, await request.json().catch(() => ({})));
    if (result.error) return NextResponse.json({ error: result.error }, { status: result.status });
    return NextResponse.json({ success: true, line: result.line }, { status: 201 });
  } catch (error) {
    console.error('Adding budget line failed:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
