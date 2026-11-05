import { NextResponse } from 'next/server';
import { ANONYMIZE_AFTER_DAYS } from '@/lib/user-lifecycle';
import { logInfo } from '@/utils/activityLogger';
import { isCronAuthorized, runOpsJob } from '@/lib/ops/jobs';

// Anonymises soft-deleted users older than ANONYMIZE_AFTER_DAYS.
// Call daily from a scheduler with:  Authorization: Bearer $CRON_SECRET
// Each run is recorded in the audit trail and shown on Operations > Jobs.
async function handle(request) {
  if (!isCronAuthorized(request)) {
    return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
  }

  const result = await runOpsJob('anonymize_deleted_users', { request });
  const anonymized = result.metadata?.anonymized ?? 0;
  if (anonymized) {
    await logInfo('Anonymised expired deleted users', {
      action: 'USER_ANONYMIZE_BATCH',
      count: anonymized,
    });
  }
  return NextResponse.json(
    { success: result.ok, days: ANONYMIZE_AFTER_DAYS, anonymized, message: result.summary },
    { status: result.ok ? 200 : 500 }
  );
}

export const GET = handle;
export const POST = handle;
