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

    const { manuscriptId } = params;

    if (!manuscriptId) {
      return NextResponse.json(
        { error: 'Manuscript ID is required' },
        { status: 400 }
      );
    }

    // Verify user has permission to view collaborators
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

    // Get current collaborators
    const collaborators = await prisma.manuscriptCollaborator.findMany({
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
