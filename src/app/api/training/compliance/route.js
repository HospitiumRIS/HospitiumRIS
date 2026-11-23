import { NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/auth-server';
import { isTrainingAdmin, resolveTrainingScopeContext } from '@/lib/training-admin-server';
import { complianceReport, sendComplianceReminders } from '@/lib/training-assignment-server';

async function adminInstitution(request) {
  const user = await getAuthenticatedUser(request);
  if (!user) return { error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) };
  if (!isTrainingAdmin(user)) return { error: NextResponse.json({ error: 'Unauthorized - Admin access required' }, { status: 403 }) };
  const { institutionId } = await resolveTrainingScopeContext(user);
  if (!institutionId) return { error: NextResponse.json({ error: 'No institution linked to your account' }, { status: 400 }) };
  return { user, institutionId };
}

/** GET /api/training/compliance: assigned vs completed vs overdue for the admin's institution (#103). */
export async function GET(request) {
  try {
    const ctx = await adminInstitution(request);
    if (ctx.error) return ctx.error;
    const report = await complianceReport(ctx.institutionId);
    return NextResponse.json({ success: true, ...report });
  } catch (error) {
    console.error('Compliance report failed:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/** POST /api/training/compliance: send due / overdue / re-training reminders now (each only once). */
export async function POST(request) {
  try {
    const ctx = await adminInstitution(request);
    if (ctx.error) return ctx.error;
    const result = await sendComplianceReminders({ institutionId: ctx.institutionId });
    return NextResponse.json({ success: true, ...result });
  } catch (error) {
    console.error('Sending reminders failed:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
