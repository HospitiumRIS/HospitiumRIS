import { NextResponse } from 'next/server';
import { requireGlobalAdmin } from '@/lib/require-global-admin';
import { getOperationsOverview, clampDays } from '@/lib/ops/metrics';

export const dynamic = 'force-dynamic';

export async function GET(request) {
  const { error } = await requireGlobalAdmin();
  if (error) return error;

  try {
    const { searchParams } = new URL(request.url);
    const data = await getOperationsOverview({ days: clampDays(searchParams.get('days'), 30) });
    return NextResponse.json({ success: true, data });
  } catch (err) {
    console.error('Operations overview failed:', err);
    return NextResponse.json({ success: false, error: 'Failed to load operations overview' }, { status: 500 });
  }
}
