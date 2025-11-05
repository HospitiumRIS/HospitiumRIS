import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { getUserId } from '../../../../lib/auth-server.js';
import { searchResearchers, getResearcherEmails } from '../../../../utils/orcidService.js';

const prisma = new PrismaClient();

/**
 * Send manuscript collaboration invitation
 * POST /api/manuscripts/invitations
 */
export async function POST(request) {
  try {
    const userId = await getUserId();
    if (!userId) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const {
      manuscriptId,
      orcidId,
      email,
      givenName,
      familyName,
      affiliation,
      role = 'CONTRIBUTOR',
      message
    } = await request.json();

    // Validate required fields
    if (!manuscriptId) {
      return NextResponse.json(
        { error: 'Manuscript ID is required' },
        { status: 400 }
      );
    }

    if (!orcidId && !email) {
      return NextResponse.json(
        { error: 'Either ORCID ID or email is required' },
        { status: 400 }
      );
    }

    // Verify user has permission to invite to this manuscript
    const manuscript = await prisma.manuscript.findFirst({
      where: {
        id: manuscriptId,
        OR: [
          { createdBy: userId },
          {
            collaborators: {
              some: {
                userId: userId,
                canInvite: true
              }
            }
          }
        ]
      },
      include: {
        creator: true,
        collaborators: {
          include: {
            user: true
          }
        }
      }
    });

    if (!manuscript) {
      return NextResponse.json(
        { error: 'Manuscript not found or insufficient permissions' },
        { status: 404 }
      );
    }

    let invitedUserId = null;
    let inviteeEmail = email;
    let inviteeGivenName = givenName;
    let inviteeFamilyName = familyName;
    let inviteeAffiliation = affiliation;

    // If ORCID ID provided, check if user already exists in our system
    if (orcidId) {
      const existingUser = await prisma.user.findFirst({
        where: { orcidId: orcidId }
      });

      if (existingUser) {
        invitedUserId = existingUser.id;
        inviteeEmail = existingUser.email;
        inviteeGivenName = existingUser.givenName || existingUser.orcidGivenNames;
        inviteeFamilyName = existingUser.familyName || existingUser.orcidFamilyName;
        inviteeAffiliation = existingUser.primaryInstitution || affiliation;
      } else {
        // If no email provided, try to get from ORCID
        if (!inviteeEmail) {
          const emails = await getResearcherEmails(orcidId);
          inviteeEmail = emails[0] || null;
        }
      }
    }

    // Check if invitation already exists
    const existingInvitation = await prisma.manuscriptInvitation.findFirst({
      where: {
        manuscriptId,
        OR: [
          { orcidId: orcidId },
          { email: inviteeEmail },
          { invitedUserId: invitedUserId }
        ].filter(Boolean),
        status: 'PENDING'
      }
    });

    if (existingInvitation) {
      return NextResponse.json(
        { error: 'Invitation already sent to this researcher' },
        { status: 409 }
      );
    }

    // TEMPORARILY DISABLED FOR TESTING - Check if researcher is already a collaborator
    /*
    const existingCollaborator = await prisma.manuscriptCollaborator.findFirst({
      where: {
        manuscriptId,
        OR: [
          { userId: invitedUserId },
          {
            user: {
              OR: [
                { orcidId: orcidId },
                { email: inviteeEmail }
              ].filter(Boolean)
            }
          }
        ].filter(Boolean)
      }
    });

    if (existingCollaborator) {
      return NextResponse.json(
        { error: 'Researcher is already a collaborator on this manuscript' },
        { status: 409 }
      );
    }
    */

    // Create invitation
    const invitation = await prisma.manuscriptInvitation.create({
      data: {
        manuscriptId,
        invitedBy: userId,
        invitedUserId,
        orcidId,
        email: inviteeEmail,
        givenName: inviteeGivenName,
        familyName: inviteeFamilyName,
        affiliation: inviteeAffiliation,
        role,
        message,
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days
      }
    });

    // FOR TESTING: Create notification for both invitee (if exists) and inviter (for demo)
    if (invitedUserId) {
      // Create notification for the actual invitee
      await prisma.notification.create({
        data: {
          userId: invitedUserId,
          manuscriptId,
          type: 'COLLABORATION_INVITATION',
          title: 'Manuscript Collaboration Invitation',
          message: `${manuscript.creator.givenName} ${manuscript.creator.familyName} has invited you to collaborate on "${manuscript.title}"`,
          data: {
            invitationId: invitation.id,
            inviterName: `${manuscript.creator.givenName} ${manuscript.creator.familyName}`,
            manuscriptTitle: manuscript.title,
            role: role
          }
        }
      });
    }

    // FOR TESTING: Also create a notification for the inviter (you) to test the notification system
    const testNotification = await prisma.notification.create({
      data: {
        userId: userId, // This is you - the person sending the invitation
        manuscriptId,
        type: 'COLLABORATION_INVITATION',
        title: 'Invitation Sent Successfully',
        message: `You invited ${inviteeGivenName} ${inviteeFamilyName} to collaborate on "${manuscript.title}" as ${role}`,
        data: {
          invitationId: invitation.id,
          invitedName: `${inviteeGivenName} ${inviteeFamilyName}`,
          manuscriptTitle: manuscript.title,
          role: role,
          action: 'sent'
        }
      }
    });

    console.log(`🔔 Created test notification for user ${userId}:`, {
      id: testNotification.id,
      title: testNotification.title,
      message: testNotification.message
    });

    console.log(`📧 INVITATION SENT SUCCESSFULLY:`, {
      invitationId: invitation.id,
      manuscriptId: manuscriptId,
      inviterUserId: userId,
      inviteeDetails: {
        orcidId: orcidId,
        email: inviteeEmail,
        name: `${inviteeGivenName} ${inviteeFamilyName}`
      },
      notificationCreated: true
    });

    // TODO: Send email notification
    // This would be implemented with your email service

    return NextResponse.json({
      success: true,
      data: {
        invitation: {
          id: invitation.id,
          orcidId: invitation.orcidId,
          email: invitation.email,
          givenName: invitation.givenName,
          familyName: invitation.familyName,
          affiliation: invitation.affiliation,
          role: invitation.role,
          status: invitation.status,
          expiresAt: invitation.expiresAt,
          isExistingUser: !!invitedUserId
        }
      }
    });

  } catch (error) {
    console.error('Error creating manuscript invitation:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * Get manuscript invitations
 * GET /api/manuscripts/invitations?manuscriptId=xxx
 */
export async function GET(request) {
  try {
    const userId = await getUserId();
    if (!userId) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const manuscriptId = searchParams.get('manuscriptId');

    if (!manuscriptId) {
      return NextResponse.json(
        { error: 'Manuscript ID is required' },
        { status: 400 }
      );
    }

    // Verify user has permission to view invitations
    const manuscript = await prisma.manuscript.findFirst({
      where: {
        id: manuscriptId,
        OR: [
          { createdBy: userId },
          {
            collaborators: {
              some: {
                userId: userId
              }
            }
          }
        ]
      }
    });

    if (!manuscript) {
      return NextResponse.json(
        { error: 'Manuscript not found or insufficient permissions' },
        { status: 404 }
      );
    }

    // Get invitations
    const invitations = await prisma.manuscriptInvitation.findMany({
      where: {
        manuscriptId
      },
      include: {
        inviter: {
          select: {
            id: true,
            givenName: true,
            familyName: true,
            email: true
          }
        },
        invitedUser: {
          select: {
            id: true,
            givenName: true,
            familyName: true,
            email: true,
            orcidId: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    return NextResponse.json({
      success: true,
      data: invitations
    });

  } catch (error) {
    console.error('Error fetching manuscript invitations:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
