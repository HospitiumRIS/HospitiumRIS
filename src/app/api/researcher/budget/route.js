import { NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/auth-server';
import { loadMyBudgets } from '@/lib/project-budget-server';

/** GET /api/researcher/budget: the signed-in researcher's approved projects with budget figures (#179). */
export async function GET(request) {
  try {
    const user = await getAuthenticatedUser(request);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    return NextResponse.json({ success: true, projects: await loadMyBudgets(user) });
  } catch (error) {
    console.error('Loading my budgets failed:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
