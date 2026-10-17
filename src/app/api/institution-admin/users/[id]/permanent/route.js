import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import {
  requireInstitutionAdmin,
  getOwnedInstitution,
  resolveInstitutionMemberScope,
} from '@/lib/institution-admin';
import { hardDeleteUser, UserLifecycleError } from '@/lib/user-lifecycle';
import { logInfo } from '@/utils/activityLogger';

// DELETE /api/institution-admin/users/:id/permanent  body: { confirm: "DELETE" }
// Permanent erasure. Only allowed for users that are already soft-deleted.
export async function DELETE(request, { params }) {
  try {
    const { user, error } = await requireInstitutionAdmin();
    if (error) return error;

    const institution = await getOwnedInstitution(user);
    if (!institution) {
      return NextResponse.json({ success: false, message: 'No institution found' }, { status: 404 });
    }

    const body = await request.json().catch(() => ({}));
    if (body?.confirm !== 'DELETE') {
      return NextResponse.json(
        { success: false, message: 'Type DELETE to confirm permanent deletion' },
        { status: 400 }
      );
    }

    const { id } = await params;
    const { memberWhere } = await resolveInstitutionMemberScope(institution);
    const target = await prisma.user.findFirst({ where: { AND: [{ id }, memberWhere] } });
    if (!target) {
      return NextResponse.json({ success: false, message: 'User not found' }, { status: 404 });
    }

    if (target.id === user.id || target.accountType === 'INSTITUTION_ADMIN') {
      return NextResponse.json(
        { success: false, message: 'Cannot delete institution admin accounts' },
        { status: 403 }
      );
    }

    const summary = await hardDeleteUser({ target });

    await logInfo('User permanently deleted by institution admin', {
      action: 'USER_HARD_DELETE',
      targetUserId: target.id,
      actorUserId: user.id,
      institutionId: institution.id,
      ...summary,
    });

    return NextResponse.json({ success: true, message: 'User permanently deleted', summary });
  } catch (err) {
    if (err instanceof UserLifecycleError) {
      return NextResponse.json({ success: false, message: err.message }, { status: err.status });
    }
    console.error('Error permanently deleting user:', err);
    return NextResponse.json(
      { success: false, message: 'Failed to permanently delete user' },
      { status: 500 }
    );
  }
}
