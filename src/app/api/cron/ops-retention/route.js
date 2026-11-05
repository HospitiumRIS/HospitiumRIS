import { NextResponse } from 'next/server';
import { isCronAuthorized, runOpsJob } from '@/lib/ops/jobs';

// Deletes usage events and audit entries past their retention period
// (OPS_USAGE_RETENTION_DAYS, OPS_AUTH_RETENTION_DAYS, OPS_ADMIN_RETENTION_DAYS).
// Call daily from a scheduler with:  Authorization: Bearer $CRON_SECRET
async function handle(request) {
  if (!isCronAuthorized(request)) {
    return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
  }
  const result = await runOpsJob('ops_retention', { request });
  return NextResponse.json({ success: result.ok, ...result }, { status: result.ok ? 200 : 500 });
}

export const GET = handle;
export const POST = handle;
