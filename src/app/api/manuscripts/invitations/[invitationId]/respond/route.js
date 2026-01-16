import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { getUserId } from '../../../../../../lib/auth-server.js';

const prisma = new PrismaClient();

/**
 * Accept or decline a manuscript invitation
 * POST /api/manuscripts/invitations/[invitationId]/respond
 * Body: { action: 'accept' | 'decline' }
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

    // In Next.js 15+, params is a Promise
    const resolvedParams = await params;
    const { invitationId } = resolvedParams;
    const { action } = await request.json();

    if (!invitationId) {
      return NextResponse.json(
        { error: 'Invitation ID is required' },
        { status: 400 }
      );
    }

    if (!action || !['accept', 'decline'].includes(action)) {
      return NextResponse.json(
        { error: 'Valid action (accept or decline) is required' },
        { status: 400 }
      );
    }

    // Get the invitation
    const invitation = await prisma.manuscriptInvitation.findUnique({
      where: {
        id: invitationId
      },
      include: {
        manuscript: {
          include: {
            creator: true
          }
        },
        inviter: true,
        invitedUser: true
      }
    });

    if (!invitation) {
      return NextResponse.json(
        { error: 'Invitation not found' },
        { status: 404 }
      );
    }

    // Verify the current user is the invited user
    // Check by invitedUserId, email, or orcidId
    const currentUser = await prisma.user.findUnique({
      where: { id: userId }
    });

    const isInvitedUser = 
      invitation.invitedUserId === userId ||
      (invitation.email && currentUser?.email === invitation.email) ||
      (invitation.orcidId && currentUser?.orcidId === invitation.orcidId);

    if (!isInvitedUser) {
      return NextResponse.json(
        { error: 'You are not authorized to respond to this invitation' },
        { status: 403 }
      );
    }

    // Check if invitation is still pending
    if (invitation.status !== 'PENDING') {
      return NextResponse.json(
        { error: `Invitation has already been ${invitation.status.toLowerCase()}` },
        { status: 400 }
      );
    }

    // Check if invitation has expired
    if (new Date() > new Date(invitation.expiresAt)) {
      await prisma.manuscriptInvitation.update({
        where: { id: invitationId },
        data: { status: 'EXPIRED' }
      });
      return NextResponse.json(
        { error: 'Invitation has expired' },
        { status: 400 }
      );
    }

    if (action === 'accept') {
      // Check if user is already a collaborator
      const existingCollaborator = await prisma.manuscriptCollaborator.findFirst({
        where: {
          manuscriptId: invitation.manuscriptId,
          userId: userId
        }
      });

      if (existingCollaborator) {
        // Update invitation status anyway
        await prisma.manuscriptInvitation.update({
          where: { id: invitationId },
          data: {
            status: 'ACCEPTED',
            respondedAt: new Date()
          }
        });
        return NextResponse.json({
          success: true,
          message: 'You are already a collaborator on this manuscript'
        });
      }

      // Create the collaborator record and update invitation in a transaction
      await prisma.$transaction([
        prisma.manuscriptCollaborator.create({
          data: {
            manuscriptId: invitation.manuscriptId,
            userId: userId,
            role: invitation.role,
            invitedBy: invitation.invitedBy,
            canEdit: ['ADMIN', 'EDITOR', 'CONTRIBUTOR'].includes(invitation.role),
            canInvite: ['ADMIN', 'OWNER'].includes(invitation.role),
            canDelete: invitation.role === 'OWNER'
          }
        }),
        prisma.manuscriptInvitation.update({
          where: { id: invitationId },
          data: {
            status: 'ACCEPTED',
            respondedAt: new Date(),
            invitedUserId: userId // Link the user if not already linked
          }
        }),
        // Create notification for the inviter
        prisma.notification.create({
          data: {
            userId: invitation.invitedBy,
            manuscriptId: invitation.manuscriptId,
            type: 'COLLABORATION_INVITATION',
            title: 'Invitation Accepted',
            message: `${currentUser.givenName} ${currentUser.familyName} has accepted your invitation to collaborate on "${invitation.manuscript.title}"`,
            data: {
              invitationId: invitation.id,
              manuscriptTitle: invitation.manuscript.title,
              acceptedBy: `${currentUser.givenName} ${currentUser.familyName}`,
              acceptedByUserId: userId,
              role: invitation.role
            }
          }
        })
      ]);

      console.log(`✅ Invitation accepted: User ${userId} joined manuscript ${invitation.manuscriptId} as ${invitation.role}`);

      return NextResponse.json({
        success: true,
        message: `You are now a ${invitation.role.toLowerCase()} on "${invitation.manuscript.title}"`,
        data: {
          manuscriptId: invitation.manuscriptId,
          manuscriptTitle: invitation.manuscript.title,
          role: invitation.role
        }
      });

    } else {
      // Decline the invitation
      await prisma.$transaction([
        prisma.manuscriptInvitation.update({
          where: { id: invitationId },
          data: {
            status: 'DECLINED',
            respondedAt: new Date()
          }
        }),
        // Create notification for the inviter
        prisma.notification.create({
          data: {
            userId: invitation.invitedBy,
            manuscriptId: invitation.manuscriptId,
            type: 'COLLABORATION_INVITATION',
            title: 'Invitation Declined',
            message: `${currentUser.givenName} ${currentUser.familyName} has declined your invitation to collaborate on "${invitation.manuscript.title}"`,
            data: {
              invitationId: invitation.id,
              manuscriptTitle: invitation.manuscript.title,
              declinedBy: `${currentUser.givenName} ${currentUser.familyName}`,
              declinedByUserId: userId
            }
          }
        })
      ]);

      console.log(`❌ Invitation declined: User ${userId} declined invitation to manuscript ${invitation.manuscriptId}`);

      return NextResponse.json({
        success: true,
        message: 'Invitation declined'
      });
    }

  } catch (error) {
    console.error('Error responding to invitation:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

