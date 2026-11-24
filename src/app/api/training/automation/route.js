import { NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/auth-server';
import { isTrainingAdmin } from '@/lib/training-admin-server';
import { runOpsJob } from '@/lib/ops/jobs';

/**
 * POST /api/training/automation: run the training automation now (training admins, #110).
 * Same job as the hourly cron; nothing is sent twice. Useful until a scheduler is set up.
 */
export async function POST(request) {
  try {
    const user = await getAuthenticatedUser(request);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    if (!isTrainingAdmin(user)) return NextResponse.json({ error: 'Unauthorized - Admin access required' }, { status: 403 });
    const result = await runOpsJob('training_automation', { request, actor: user });
    return NextResponse.json({ success: result.ok, message: result.summary, ...(result.metadata || {}) }, { status: result.ok ? 200 : 500 });
  } catch (error) {
    console.error('Running training automation failed:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
