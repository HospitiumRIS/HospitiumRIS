import { NextResponse } from 'next/server';
import { complianceAdmin } from '@/lib/training-compliance-route';
import { applyRequirements } from '@/lib/training-compliance-server';

/**
 * POST /api/training/requirements/apply { requirementId? } (#140): enrol people who need a
 * requirement into its next cohort now. Without requirementId: every auto-assign rule.
 */
export async function POST(request) {
  try {
    const ctx = await complianceAdmin(request);
    if (ctx.error) return ctx.error;
    const body = await request.json().catch(() => ({}));
    const result = await applyRequirements({ institutionId: ctx.institutionId, requirementId: typeof body?.requirementId === 'string' ? body.requirementId : null, actor: ctx.user });
    return NextResponse.json({ success: true, ...result });
  } catch (error) {
    console.error('Applying requirements failed:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
