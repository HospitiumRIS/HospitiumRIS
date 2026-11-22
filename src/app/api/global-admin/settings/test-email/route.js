import { NextResponse } from 'next/server';
import { requireGlobalAdmin } from '@/lib/require-global-admin';
import { sendTestEmail } from '@/lib/email';

export const dynamic = 'force-dynamic';

// Sends a test email to the signed-in global admin only (no free-form
// recipient, so this can't be used to send mail to arbitrary addresses).
export async function POST() {
  const { user, error } = await requireGlobalAdmin();
  if (error) return error;

  const result = await sendTestEmail(user.email);
  if (!result.success) {
    return NextResponse.json({ success: false, error: result.error }, { status: 502 });
  }
  return NextResponse.json({ success: true, message: `Test email sent to ${user.email}` });
}
