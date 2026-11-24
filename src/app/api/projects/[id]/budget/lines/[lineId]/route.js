import { NextResponse } from 'next/server';
import { deleteLine, projectBudgetContext, updateLine } from '@/lib/project-budget-server';

/** PUT /api/projects/[id]/budget/lines/[lineId]: edit a budget line (research office, #179). */
export async function PUT(request, { params }) {
  try {
    const { id, lineId } = await params;
    const ctx = await projectBudgetContext(request, id);
    if (ctx.error) return ctx.error;
    const result = await updateLine(ctx, lineId, await request.json().catch(() => ({})));
    if (result.error) return NextResponse.json({ error: result.error }, { status: result.status });
    return NextResponse.json({ success: true, line: result.line });
  } catch (error) {
    console.error('Updating budget line failed:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/** DELETE: remove a line; its expenses stay as unallocated. */
export async function DELETE(request, { params }) {
  try {
    const { id, lineId } = await params;
    const ctx = await projectBudgetContext(request, id);
    if (ctx.error) return ctx.error;
    const result = await deleteLine(ctx, lineId);
    if (result.error) return NextResponse.json({ error: result.error }, { status: result.status });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Deleting budget line failed:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
