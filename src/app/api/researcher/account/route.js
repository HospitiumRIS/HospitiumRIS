import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getAuthenticatedUser } from '@/lib/auth-server';
import { verifyPassword } from '@/lib/auth';
import { clearSessionCookie } from '@/lib/session-cookie';
import { findInstitutionByEmailDomain } from '@/lib/institution-domain';
import { softDeleteUser, ANONYMIZE_AFTER_DAYS } from '@/lib/user-lifecycle';
import { logInfo } from '@/utils/activityLogger';

const SELF_DELETABLE_TYPES = ['RESEARCHER', 'RESEARCH_ADMIN'];

// DELETE /api/researcher/account   body: { password, confirm: "DELETE" }
// Self-service account deletion (soft delete; institution admin can restore within the grace period).
export async function DELETE(request) {
  try {
    const sessionUser = await getAuthenticatedUser();
    if (!sessionUser) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    if (!SELF_DELETABLE_TYPES.includes(sessionUser.accountType)) {
      return NextResponse.json(
        { success: false, message: 'This account type cannot be deleted from the profile page' },
        { status: 403 }
      );
    }

    const body = await request.json().catch(() => ({}));
    if (body?.confirm !== 'DELETE') {
      return NextResponse.json({ success: false, message: 'Type DELETE to confirm' }, { status: 400 });
    }
    if (typeof body.password !== 'string' || !body.password) {
      return NextResponse.json({ success: false, message: 'Password is required' }, { status: 400 });
    }

    const target = await prisma.user.findUnique({ where: { id: sessionUser.id } });
    const valid = await verifyPassword(body.password, target.passwordHash);
    if (!valid) {
      return NextResponse.json({ success: false, message: 'Incorrect password' }, { status: 403 });
    }

    // Pin to the user's institution so its admin can still find and restore the account.
    let institution = null;
    if (!target.secondaryInstitutionId) {
      institution = await findInstitutionByEmailDomain(prisma, target.email).catch(() => null);
    }

    await softDeleteUser({ target, actor: target, institution });

    await logInfo('User deleted their own account', {
      action: 'USER_SELF_DELETE',
      targetUserId: target.id,
      actorUserId: target.id,
      institutionId: target.secondaryInstitutionId || institution?.id || null,
    });

    const response = NextResponse.json({
      success: true,
      message: `Your account has been deleted. Contact your institution administrator within ${ANONYMIZE_AFTER_DAYS} days if you want it restored.`,
    });
    clearSessionCookie(response);
    response.cookies.delete('orcid_remember_me');
    return response;
  } catch (err) {
    console.error('Error deleting own account:', err);
    return NextResponse.json({ success: false, message: 'Failed to delete account' }, { status: 500 });
  }
}
