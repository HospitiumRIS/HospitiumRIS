import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getAuthenticatedUser } from '@/lib/auth-server';
import { hashPassword, verifyPassword, validatePassword } from '@/lib/auth';
import { sendPasswordChangedEmail } from '@/lib/email';
import { logInfo, logWarning } from '@/utils/activityLogger';

// POST /api/researcher/account/password   body: { currentPassword, newPassword, confirmPassword }
export async function POST(request) {
  try {
    const sessionUser = await getAuthenticatedUser();
    if (!sessionUser) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const { currentPassword, newPassword, confirmPassword } = body || {};

    if (!currentPassword || !newPassword) {
      return NextResponse.json({ success: false, message: 'Current and new password are required' }, { status: 400 });
    }
    if (newPassword !== confirmPassword) {
      return NextResponse.json({ success: false, message: 'New passwords do not match' }, { status: 400 });
    }
    if (newPassword.length > 128) {
      return NextResponse.json({ success: false, message: 'Password is too long (max 128 characters)' }, { status: 400 });
    }

    const { isValid } = validatePassword(newPassword);
    if (!isValid) {
      return NextResponse.json(
        {
          success: false,
          message: 'New password must be at least 8 characters and include upper and lower case letters, a number and a symbol',
        },
        { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({ where: { id: sessionUser.id } });
    const currentOk = await verifyPassword(currentPassword, user.passwordHash);
    if (!currentOk) {
      await logWarning('Password change failed: wrong current password', { action: 'PASSWORD_CHANGE_FAILED', userId: user.id });
      return NextResponse.json({ success: false, message: 'Current password is incorrect' }, { status: 403 });
    }

    if (await verifyPassword(newPassword, user.passwordHash)) {
      return NextResponse.json(
        { success: false, message: 'New password must be different from your current password' },
        { status: 400 }
      );
    }

    await prisma.user.update({
      where: { id: user.id },
      data: { passwordHash: await hashPassword(newPassword) },
    });

    await logInfo('User changed their password', { action: 'PASSWORD_CHANGE', userId: user.id });

    // Security notice — don't fail the request if email delivery fails.
    const forwarded = request.headers.get('x-forwarded-for');
    sendPasswordChangedEmail(user, {
      ip: forwarded ? forwarded.split(',')[0].trim() : request.headers.get('x-real-ip'),
      userAgent: request.headers.get('user-agent'),
    }).catch((err) => console.error('Password changed email failed:', err));

    return NextResponse.json({ success: true, message: 'Password updated' });
  } catch (err) {
    console.error('Error changing password:', err);
    return NextResponse.json({ success: false, message: 'Failed to change password' }, { status: 500 });
  }
}
