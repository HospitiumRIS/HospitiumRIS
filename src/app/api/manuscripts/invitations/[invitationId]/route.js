import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { getUserId } from '../../../../../lib/auth-server.js';

const prisma = new PrismaClient();

/**
 * Cancel a pending invitation
 * DELETE /api/manuscripts/invitations/[invitationId]
 */
export async function DELETE(request, { params }) {
  try {
    const userId = await getUserId();
    if (!userId) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const { invitationId } = params;

    if (!invitationId) {
      return NextResponse.json(
        { error: 'Invitation ID is required' },
        { status: 400 }
      );
    }

    // Get the invitation
    const invitation = await prisma.manuscriptInvitation.findUnique({
      where: {
        id: invitationId
      },
      include: {
        manuscript: true,
        inviter: true
      }
    });

    if (!invitation) {
      return NextResponse.json(
        { error: 'Invitation not found' },
        { status: 404 }
      );
    }

    // Verify user has permission to cancel this invitation
    const hasPermission = invitation.invitedBy === userId || 
      invitation.manuscript.createdBy === userId ||
      (await prisma.manuscriptCollaborator.findFirst({
        where: {
          manuscriptId: invitation.manuscriptId,
          userId: userId,
          OR: [
            { role: 'OWNER' },
            { role: 'ADMIN', canInvite: true }
          ]
        }
      }));

    if (!hasPermission) {
      return NextResponse.json(
        { error: 'Insufficient permissions to cancel this invitation' },
        { status: 403 }
      );
    }

    // Only allow canceling pending invitations
    if (invitation.status !== 'PENDING') {
      return NextResponse.json(
        { error: 'Can only cancel pending invitations' },
        { status: 400 }
      );
    }

    // Update invitation status to cancelled
    await prisma.manuscriptInvitation.update({
      where: {
        id: invitationId
      },
      data: {
        status: 'EXPIRED', // Using EXPIRED status to indicate cancelled
        respondedAt: new Date()
      }
    });

    // Create notification for the invitee if they exist in the system
    if (invitation.invitedUserId) {
      await prisma.notification.create({
        data: {
          userId: invitation.invitedUserId,
          manuscriptId: invitation.manuscriptId,
          type: 'COLLABORATION_INVITATION',
          title: 'Invitation Cancelled',
          message: `The invitation to collaborate on "${invitation.manuscript.title}" has been cancelled`,
          data: {
            manuscriptTitle: invitation.manuscript.title,
            cancelledBy: userId
          }
        }
      });
    }

    return NextResponse.json({
      success: true,
      message: 'Invitation cancelled successfully'
    });

  } catch (error) {
    console.error('Error cancelling invitation:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

/**
 * Resend a pending invitation
 * POST /api/manuscripts/invitations/[invitationId]/resend
 */
export async function POST(request, { params }) {
  try {
    const userId = await getUserId();
    if (!userId) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const { invitationId } = params;

    if (!invitationId) {
      return NextResponse.json(
        { error: 'Invitation ID is required' },
        { status: 400 }
      );
    }

    // Get the invitation
    const invitation = await prisma.manuscriptInvitation.findUnique({
      where: {
        id: invitationId
      },
      include: {
        manuscript: true,
        inviter: true
      }
    });

    if (!invitation) {
      return NextResponse.json(
        { error: 'Invitation not found' },
        { status: 404 }
      );
    }

    // Verify user has permission to resend this invitation
    const hasPermission = invitation.invitedBy === userId || 
      invitation.manuscript.createdBy === userId ||
      (await prisma.manuscriptCollaborator.findFirst({
        where: {
          manuscriptId: invitation.manuscriptId,
          userId: userId,
          OR: [
            { role: 'OWNER' },
            { role: 'ADMIN', canInvite: true }
          ]
        }
      }));

    if (!hasPermission) {
      return NextResponse.json(
        { error: 'Insufficient permissions to resend this invitation' },
        { status: 403 }
      );
    }

    // Only allow resending pending invitations
    if (invitation.status !== 'PENDING') {
      return NextResponse.json(
        { error: 'Can only resend pending invitations' },
        { status: 400 }
      );
    }

    // Update invitation with new expiry date
    const updatedInvitation = await prisma.manuscriptInvitation.update({
      where: {
        id: invitationId
      },
      data: {
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
        updatedAt: new Date()
      }
    });

    // Create notification for the invitee if they exist in the system
    if (invitation.invitedUserId) {
      await prisma.notification.create({
        data: {
          userId: invitation.invitedUserId,
          manuscriptId: invitation.manuscriptId,
          type: 'COLLABORATION_INVITATION',
          title: 'Invitation Reminder',
          message: `Reminder: You have been invited to collaborate on "${invitation.manuscript.title}"`,
          data: {
            invitationId: invitation.id,
            manuscriptTitle: invitation.manuscript.title,
            role: invitation.role,
            resentBy: userId
          }
        }
      });
    }

    // TODO: Send email notification
    // This would be implemented with your email service

    return NextResponse.json({
      success: true,
      data: updatedInvitation,
      message: 'Invitation resent successfully'
    });

  } catch (error) {
    console.error('Error resending invitation:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
