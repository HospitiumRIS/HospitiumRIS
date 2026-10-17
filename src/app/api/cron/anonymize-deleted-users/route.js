import { NextResponse } from 'next/server';
import { anonymizeExpiredDeletedUsers, ANONYMIZE_AFTER_DAYS } from '@/lib/user-lifecycle';
import { logInfo } from '@/utils/activityLogger';

// Anonymises soft-deleted users older than ANONYMIZE_AFTER_DAYS.
// Call daily from a scheduler with:  Authorization: Bearer $CRON_SECRET
async function handle(request) {
  const secret = process.env.CRON_SECRET;
  const auth = request.headers.get('authorization') || '';
  if (!secret || auth !== `Bearer ${secret}`) {
    return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
  }

  const anonymized = await anonymizeExpiredDeletedUsers();
  if (anonymized.length) {
    await logInfo('Anonymised expired deleted users', {
      action: 'USER_ANONYMIZE_BATCH',
      count: anonymized.length,
      userIds: anonymized,
    });
  }
  return NextResponse.json({ success: true, days: ANONYMIZE_AFTER_DAYS, anonymized: anonymized.length });
}

export const GET = handle;
export const POST = handle;
