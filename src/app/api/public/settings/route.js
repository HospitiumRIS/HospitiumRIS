import { NextResponse } from 'next/server';
import { getPublicSettings } from '@/lib/system-settings';

export const dynamic = 'force-dynamic';

// Non-sensitive settings the UI needs before (or without) signing in:
// maintenance mode, whether registration is open, and the password rules.
export async function GET() {
  try {
    const data = await getPublicSettings();
    return NextResponse.json({ success: true, data }, { headers: { 'Cache-Control': 'no-store' } });
  } catch (err) {
    console.error('Public settings failed:', err);
    return NextResponse.json({ success: false, error: 'Unavailable' }, { status: 500 });
  }
}
