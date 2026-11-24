import { NextResponse } from 'next/server';
import { complianceAdmin } from '@/lib/training-compliance-route';
import { complianceAction } from '@/lib/training-compliance-server';

/**
 * POST /api/training/compliance/actions (#140)
 * { action: remind|extend|exempt|unexempt|assign, registrationIds?, cells?: [{userId, requirementId}],
 *   exemptionIds?, userIds?, trainingId?, dueDate?, reason?, allowOverCapacity? }
 */
export async function POST(request) {
  try {
    const ctx = await complianceAdmin(request);
    if (ctx.error) return ctx.error;
    const body = await request.json().catch(() => ({}));
    const result = await complianceAction(ctx.institutionId, ctx.user, body || {});
    if (!result.ok) return NextResponse.json({ error: result.error }, { status: 400 });
    return NextResponse.json({ success: true, message: result.message });
  } catch (error) {
    console.error('Compliance action failed:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
