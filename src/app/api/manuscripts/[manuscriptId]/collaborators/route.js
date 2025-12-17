import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { getUserId } from '../../../../../lib/auth-server.js';

const prisma = new PrismaClient();

/**
 * Get all collaborators and pending invitations for a manuscript
 * GET /api/manuscripts/[manuscriptId]/collaborators
 */
export async function GET(request, { params }) {
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
    const { manuscriptId } = resolvedParams;

    if (!manuscriptId) {
      return NextResponse.json(
        { error: 'Manuscript ID is required' },
        { status: 400 }
      );
    }

    // Verify user has permission to view collaborators and get manuscript with creator
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
      },
      include: {
        creator: {
          select: {
            id: true,
            givenName: true,
            familyName: true,
            email: true,
            orcidId: true,
            primaryInstitution: true
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

    // Get current collaborators from the collaborators table
    const collaboratorsFromTable = await prisma.manuscriptCollaborator.findMany({
      where: {
        manuscriptId
      },
      include: {
        user: {
          select: {
            id: true,
            givenName: true,
            familyName: true,
            email: true,
            orcidId: true,
            primaryInstitution: true
          }
        },
        inviter: {
          select: {
            id: true,
            givenName: true,
            familyName: true
          }
        }
      },
      orderBy: {
        joinedAt: 'asc'
      }
    });

    // Check if creator is already in the collaborators list
    const creatorInCollaborators = collaboratorsFromTable.some(
      c => c.userId === manuscript.createdBy
    );

    // Build the final collaborators list, adding creator as owner if not already present
    let collaborators = [...collaboratorsFromTable];
    
    if (!creatorInCollaborators && manuscript.creator) {
      // Add creator as the first member (owner)
      collaborators.unshift({
        id: `creator-${manuscript.createdBy}`,
        manuscriptId,
        userId: manuscript.createdBy,
        role: 'OWNER',
        canEdit: true,
        canInvite: true,
        canDelete: true,
        joinedAt: manuscript.createdAt,
        user: manuscript.creator,
        inviter: null,
        isCreator: true
      });
    }

    // Get pending invitations
    const pendingInvitations = await prisma.manuscriptInvitation.findMany({
      where: {
        manuscriptId,
        status: 'PENDING'
      },
      include: {
        inviter: {
          select: {
            id: true,
            givenName: true,
            familyName: true
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
      data: {
        collaborators,
        pendingInvitations
      }
    });

  } catch (error) {
    console.error('Error fetching collaborators:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
