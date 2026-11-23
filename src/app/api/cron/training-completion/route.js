import { NextResponse } from 'next/server';
import { isCronAuthorized, runOpsJob } from '@/lib/ops/jobs';

// Finalises completion for ended trainings that have completion rules (#96).
// Call hourly from a scheduler with:  Authorization: Bearer $CRON_SECRET
// Each run is recorded in the audit trail and shown on Operations > Jobs.
async function handle(request) {
  if (!isCronAuthorized(request)) {
    return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
  }
  const result = await runOpsJob('training_completion', { request });
  return NextResponse.json(
    { success: result.ok, ...(result.metadata || {}), message: result.summary },
    { status: result.ok ? 200 : 500 }
  );
}

export const GET = handle;
export const POST = handle;
