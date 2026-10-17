import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import {
  requireInstitutionAdmin,
  getOwnedInstitution,
  resolveInstitutionMemberScope,
} from '@/lib/institution-admin';
import { restoreUser, UserLifecycleError } from '@/lib/user-lifecycle';
import { logInfo } from '@/utils/activityLogger';

// POST /api/institution-admin/users/:id/restore — undo a soft delete (before anonymisation)
export async function POST(request, { params }) {
  try {
    const { user, error } = await requireInstitutionAdmin();
    if (error) return error;

    const institution = await getOwnedInstitution(user);
    if (!institution) {
      return NextResponse.json({ success: false, message: 'No institution found' }, { status: 404 });
    }

    const { id } = await params;
    const { memberWhere } = await resolveInstitutionMemberScope(institution);
    const target = await prisma.user.findFirst({ where: { AND: [{ id }, memberWhere] } });
    if (!target) {
      return NextResponse.json({ success: false, message: 'User not found' }, { status: 404 });
    }

    const restored = await restoreUser({ target });

    await logInfo('User restored by institution admin', {
      action: 'USER_RESTORE',
      targetUserId: target.id,
      actorUserId: user.id,
      institutionId: institution.id,
      restoredStatus: restored.status,
    });

    return NextResponse.json({ success: true, message: 'User restored', status: restored.status });
  } catch (err) {
    if (err instanceof UserLifecycleError) {
      return NextResponse.json({ success: false, message: err.message }, { status: err.status });
    }
    console.error('Error restoring user:', err);
    return NextResponse.json({ success: false, message: 'Failed to restore user' }, { status: 500 });
  }
}
