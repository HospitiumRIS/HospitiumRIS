import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { getUserId } from '../../../../../lib/auth-server.js';

const prisma = new PrismaClient();

/**
 * Get pending invitations for the current user
 * GET /api/manuscripts/invitations/pending
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

    // Get current user details
    const currentUser = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        email: true,
        orcidId: true
      }
    });

    if (!currentUser) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Find all pending invitations for this user
    // Match by invitedUserId, email, or orcidId
    const invitations = await prisma.manuscriptInvitation.findMany({
      where: {
        status: 'PENDING',
        OR: [
          { invitedUserId: userId },
          ...(currentUser.email ? [{ email: currentUser.email }] : []),
          ...(currentUser.orcidId ? [{ orcidId: currentUser.orcidId }] : [])
        ],
        expiresAt: {
          gt: new Date() // Only non-expired invitations
        }
      },
      include: {
        manuscript: {
          select: {
            id: true,
            title: true,
            type: true,
            field: true,
            status: true,
            createdAt: true,
            updatedAt: true,
            creator: {
              select: {
                id: true,
                givenName: true,
                familyName: true,
                email: true
              }
            }
          }
        },
        inviter: {
          select: {
            id: true,
            givenName: true,
            familyName: true,
            email: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    // Transform the data
    const transformedInvitations = invitations.map(invitation => {
      const inviterName = invitation.inviter 
        ? `${invitation.inviter.givenName || ''} ${invitation.inviter.familyName || ''}`.trim() || invitation.inviter.email
        : 'Unknown';

      const creatorName = invitation.manuscript?.creator
        ? `${invitation.manuscript.creator.givenName || ''} ${invitation.manuscript.creator.familyName || ''}`.trim() || invitation.manuscript.creator.email
        : 'Unknown';

      return {
        id: invitation.id,
        manuscriptId: invitation.manuscriptId,
        manuscriptTitle: invitation.manuscript?.title || 'Untitled',
        manuscriptType: invitation.manuscript?.type || 'Unknown',
        manuscriptField: invitation.manuscript?.field,
        manuscriptStatus: invitation.manuscript?.status || 'DRAFT',
        role: invitation.role,
        inviterName,
        creatorName,
        invitedAt: invitation.createdAt,
        expiresAt: invitation.expiresAt,
        message: invitation.message,
        manuscript: {
          id: invitation.manuscript?.id,
          title: invitation.manuscript?.title,
          type: invitation.manuscript?.type,
          field: invitation.manuscript?.field,
          status: invitation.manuscript?.status,
          createdAt: invitation.manuscript?.createdAt,
          updatedAt: invitation.manuscript?.updatedAt
        }
      };
    });

    return NextResponse.json({
      success: true,
      data: {
        invitations: transformedInvitations,
        count: transformedInvitations.length
      }
    });

  } catch (error) {
    console.error('Error fetching pending invitations:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
