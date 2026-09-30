import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import {
  requireInstitutionAdmin,
  getOwnedInstitution,
  getInstitutionMemberIds,
} from '@/lib/institution-admin';

const ALLOWED_OPERATIONS = new Set(['cleanup']);

export async function POST(request) {
  try {
    const { user, error } = await requireInstitutionAdmin();
    if (error) return error;

    const institution = await getOwnedInstitution(user);
    if (!institution) {
      return NextResponse.json({ success: false, message: 'No institution found' }, { status: 404 });
    }

    const { operation, options = {} } = await request.json();

    if (!ALLOWED_OPERATIONS.has(operation)) {
      return NextResponse.json(
        {
          success: false,
          message: 'This maintenance operation is restricted to platform administrators',
        },
        { status: 403 }
      );
    }

    const result = await performInstitutionCleanup(institution, options);

    return NextResponse.json({
      success: true,
      message: 'Institution cleanup completed successfully',
      result,
    });
  } catch (err) {
    console.error('Database maintenance operation failed:', err);
    return NextResponse.json(
      {
        success: false,
        message: `Database maintenance operation failed: ${err.message}`,
        error: err.message,
      },
      { status: 500 }
    );
  }
}

async function performInstitutionCleanup(institution) {
  const userIds = await getInstitutionMemberIds(institution);
  const cleanupResults = [];

  if (userIds.length) {
    const expiredInvitations = await prisma.manuscriptInvitation.deleteMany({
      where: {
        expiresAt: { lt: new Date() },
        status: 'PENDING',
        OR: [
          { invitedBy: { in: userIds } },
          { invitedUserId: { in: userIds } },
        ],
      },
    });

    cleanupResults.push({
      operation: 'Clean expired manuscript invitations',
      count: expiredInvitations.count,
    });
  }

  return {
    operation: 'cleanup',
    institutionId: institution.id,
    results: cleanupResults,
    executedAt: new Date().toISOString(),
  };
}
