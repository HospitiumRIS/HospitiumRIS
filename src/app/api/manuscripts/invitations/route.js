import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { getUserId } from '../../../../lib/auth-server.js';
import { searchResearchers, getResearcherEmails } from '../../../../utils/orcidService.js';
import { sendCollaborationInviteEmail } from '../../../../lib/email.js';

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
    let isExistingUser = false;

    // Check if user exists by ORCID ID
    if (orcidId) {
      const existingUser = await prisma.user.findFirst({
        where: { orcidId: orcidId }
      });

      if (existingUser) {
        invitedUserId = existingUser.id;
        inviteeEmail = existingUser.email;
        inviteeGivenName = existingUser.givenName || existingUser.orcidGivenNames || givenName;
        inviteeFamilyName = existingUser.familyName || existingUser.orcidFamilyName || familyName;
        inviteeAffiliation = existingUser.primaryInstitution || affiliation;
        isExistingUser = true;
        console.log(`✅ Found existing user by ORCID: ${existingUser.id} (${existingUser.email})`);
      } else {
        // If no email provided, try to get from ORCID
        if (!inviteeEmail) {
          const emails = await getResearcherEmails(orcidId);
          inviteeEmail = emails[0] || null;
        }
      }
    }

    // If not found by ORCID, check by email
    if (!invitedUserId && inviteeEmail) {
      const existingUser = await prisma.user.findFirst({
        where: { email: inviteeEmail }
      });

      if (existingUser) {
        invitedUserId = existingUser.id;
        inviteeGivenName = existingUser.givenName || existingUser.orcidGivenNames || givenName;
        inviteeFamilyName = existingUser.familyName || existingUser.orcidFamilyName || familyName;
        inviteeAffiliation = existingUser.primaryInstitution || affiliation;
        isExistingUser = true;
        console.log(`✅ Found existing user by email: ${existingUser.id} (${existingUser.email})`);
      }
    }

    // Check if invitation already exists
    const existingInvitation = await prisma.manuscriptInvitation.findFirst({
      where: {
        manuscriptId,
        OR: [
          orcidId ? { orcidId: orcidId } : null,
          inviteeEmail ? { email: inviteeEmail } : null,
          invitedUserId ? { invitedUserId: invitedUserId } : null
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

    // Check if researcher is already a collaborator
    if (invitedUserId) {
      const existingCollaborator = await prisma.manuscriptCollaborator.findFirst({
        where: {
          manuscriptId,
          userId: invitedUserId
        }
      });

      if (existingCollaborator) {
        return NextResponse.json(
          { error: 'This researcher is already a collaborator on this manuscript' },
          { status: 409 }
        );
      }
    }

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

    // Get inviter details
    const inviter = await prisma.user.findUnique({
      where: { id: userId }
    });
    const inviterName = `${inviter.givenName} ${inviter.familyName}`;
    const inviteeName = `${inviteeGivenName} ${inviteeFamilyName}`;

    // Create notification for the invitee if they exist in the system
    if (invitedUserId) {
      // Determine if this is a proposal or manuscript based on type
      const isProposal = manuscript.type?.toLowerCase().includes('proposal');
      const documentType = isProposal ? 'research proposal' : 'manuscript';
      
      await prisma.notification.create({
        data: {
          userId: invitedUserId,
          manuscriptId,
          type: 'COLLABORATION_INVITATION',
          title: isProposal ? 'Research Proposal Invitation' : 'Manuscript Collaboration Invitation',
          message: `${inviterName} has invited you to collaborate on the ${documentType} "${manuscript.title}" as ${role}`,
          data: {
            invitationId: invitation.id,
            inviterName: inviterName,
            manuscriptTitle: manuscript.title,
            role: role,
            action: 'pending', // Can be used to show accept/decline buttons
            documentType: documentType
          }
        }
      });
      console.log(`🔔 Created notification for existing user ${invitedUserId}`);
    }

    // Send email invitation if we have an email address
    if (inviteeEmail) {
      try {
        // Determine if this is a proposal or manuscript based on type
        const isProposal = manuscript.type?.toLowerCase().includes('proposal');
        
        const emailResult = await sendCollaborationInviteEmail({
          inviteeEmail,
          inviteeName,
          inviterName,
          manuscriptTitle: manuscript.title,
          role,
          message,
          invitationToken: invitation.token,
          type: isProposal ? 'proposal' : 'manuscript'
        });

        if (emailResult.success) {
          console.log(`📧 Invitation email sent to ${inviteeEmail}`);
        } else {
          console.error(`⚠️ Failed to send invitation email: ${emailResult.error}`);
        }
      } catch (emailError) {
        // Don't fail the invitation if email fails - log and continue
        console.error(`⚠️ Email sending failed:`, emailError);
      }
    }

    console.log(`📧 INVITATION SENT SUCCESSFULLY:`, {
      invitationId: invitation.id,
      manuscriptId: manuscriptId,
      inviterUserId: userId,
      inviteeDetails: {
        orcidId: orcidId,
        email: inviteeEmail,
        name: inviteeName,
        isExistingUser
      },
      notificationCreated: !!invitedUserId
    });

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
          isExistingUser
        }
      },
      message: isExistingUser 
        ? `Invitation sent! ${inviteeName} will receive a notification when they log in.`
        : inviteeEmail 
          ? `Invitation sent to ${inviteeEmail}. They will need to create an account to accept.`
          : 'Invitation created. The researcher will need to claim it when they join.'
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
