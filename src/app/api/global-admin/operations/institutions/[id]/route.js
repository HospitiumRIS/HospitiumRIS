import { NextResponse } from 'next/server';
import { requireGlobalAdmin } from '@/lib/require-global-admin';
import { getInstitutionActivity, clampDays } from '@/lib/ops/metrics';

export const dynamic = 'force-dynamic';

export async function GET(request, { params }) {
  const { error } = await requireGlobalAdmin();
  if (error) return error;

  try {
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const data = await getInstitutionActivity(id, { days: clampDays(searchParams.get('days'), 30) });
    if (!data) {
      return NextResponse.json({ success: false, error: 'Institution not found' }, { status: 404 });
    }
    return NextResponse.json({ success: true, data });
  } catch (err) {
    console.error('Institution activity failed:', err);
    return NextResponse.json({ success: false, error: 'Failed to load institution activity' }, { status: 500 });
  }
}
