import { NextResponse } from 'next/server';
import { complianceAdmin } from '@/lib/training-compliance-route';
import { saveRequirement } from '@/lib/training-compliance-server';

/** POST /api/training/requirements: create a requirement rule (#140). */
export async function POST(request) {
  try {
    const ctx = await complianceAdmin(request);
    if (ctx.error) return ctx.error;
    const result = await saveRequirement(ctx.institutionId, ctx.user, null, await request.json().catch(() => ({})));
    if (!result.ok) return NextResponse.json({ error: result.error }, { status: result.status || 400 });
    return NextResponse.json({ success: true, requirement: result.requirement }, { status: 201 });
  } catch (error) {
    console.error('Creating requirement failed:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
