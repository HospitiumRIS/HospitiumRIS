import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { getUserId } from '../../../../../../lib/auth-server.js';

const prisma = new PrismaClient();

/**
 * Update collaborator role and permissions
 * PATCH /api/manuscripts/[manuscriptId]/collaborators/[collaboratorId]
 */
export async function PATCH(request, { params }) {
  try {
    const userId = await getUserId();
    if (!userId) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const { manuscriptId, collaboratorId } = params;
    const updateData = await request.json();

    if (!manuscriptId || !collaboratorId) {
      return NextResponse.json(
        { error: 'Manuscript ID and Collaborator ID are required' },
        { status: 400 }
      );
    }

    // Verify user has permission to manage collaborators (owner or admin with invite permission)
    const manuscript = await prisma.manuscript.findFirst({
      where: {
        id: manuscriptId,
        OR: [
          { createdBy: userId },
          {
            collaborators: {
              some: {
                userId: userId,
                OR: [
                  { role: 'OWNER' },
                  { role: 'ADMIN', canInvite: true }
                ]
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

    // Get the collaborator to update
    const collaborator = await prisma.manuscriptCollaborator.findFirst({
      where: {
        id: collaboratorId,
        manuscriptId
      },
      include: {
        user: true
      }
    });

    if (!collaborator) {
      return NextResponse.json(
        { error: 'Collaborator not found' },
        { status: 404 }
      );
    }

    // Prevent changing the owner's role
    if (collaborator.role === 'OWNER' && updateData.role !== 'OWNER') {
      return NextResponse.json(
        { error: 'Cannot change the role of the manuscript owner' },
        { status: 403 }
      );
    }

    // Prevent removing yourself if you're the owner
    if (collaborator.userId === userId && collaborator.role === 'OWNER') {
      return NextResponse.json(
        { error: 'Owner cannot modify their own role' },
        { status: 403 }
      );
    }

    // Update the collaborator
    const updatedCollaborator = await prisma.manuscriptCollaborator.update({
      where: {
        id: collaboratorId
      },
      data: {
        role: updateData.role || collaborator.role,
        canEdit: updateData.canEdit !== undefined ? updateData.canEdit : collaborator.canEdit,
        canInvite: updateData.canInvite !== undefined ? updateData.canInvite : collaborator.canInvite,
        canDelete: updateData.canDelete !== undefined ? updateData.canDelete : collaborator.canDelete,
        updatedAt: new Date()
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
        }
      }
    });

    // Create notification for the updated user (if not updating yourself)
    if (collaborator.userId !== userId) {
      await prisma.notification.create({
        data: {
          userId: collaborator.userId,
          manuscriptId,
          type: 'MANUSCRIPT_UPDATE',
          title: 'Role Updated',
          message: `Your role in "${manuscript.title}" has been updated to ${updateData.role || collaborator.role}`,
          data: {
            manuscriptTitle: manuscript.title,
            newRole: updateData.role || collaborator.role,
            updatedBy: userId
          }
        }
      });
    }

    return NextResponse.json({
      success: true,
      data: updatedCollaborator,
      message: 'Collaborator updated successfully'
    });

  } catch (error) {
    console.error('Error updating collaborator:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

/**
 * Remove collaborator from manuscript
 * DELETE /api/manuscripts/[manuscriptId]/collaborators/[collaboratorId]
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

    const { manuscriptId, collaboratorId } = params;

    if (!manuscriptId || !collaboratorId) {
      return NextResponse.json(
        { error: 'Manuscript ID and Collaborator ID are required' },
        { status: 400 }
      );
    }

    // Verify user has permission to remove collaborators
    const manuscript = await prisma.manuscript.findFirst({
      where: {
        id: manuscriptId,
        OR: [
          { createdBy: userId },
          {
            collaborators: {
              some: {
                userId: userId,
                OR: [
                  { role: 'OWNER' },
                  { role: 'ADMIN', canInvite: true }
                ]
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

    // Get the collaborator to remove
    const collaborator = await prisma.manuscriptCollaborator.findFirst({
      where: {
        id: collaboratorId,
        manuscriptId
      },
      include: {
        user: true
      }
    });

    if (!collaborator) {
      return NextResponse.json(
        { error: 'Collaborator not found' },
        { status: 404 }
      );
    }

    // Prevent removing the owner
    if (collaborator.role === 'OWNER') {
      return NextResponse.json(
        { error: 'Cannot remove the manuscript owner' },
        { status: 403 }
      );
    }

    // Prevent removing yourself if you're the owner
    if (collaborator.userId === userId && collaborator.role === 'OWNER') {
      return NextResponse.json(
        { error: 'Owner cannot remove themselves' },
        { status: 403 }
      );
    }

    // Remove the collaborator
    await prisma.manuscriptCollaborator.delete({
      where: {
        id: collaboratorId
      }
    });

    // Create notification for the removed user (if not removing yourself)
    if (collaborator.userId !== userId) {
      await prisma.notification.create({
        data: {
          userId: collaborator.userId,
          manuscriptId,
          type: 'MANUSCRIPT_UPDATE',
          title: 'Removed from Manuscript',
          message: `You have been removed from the manuscript "${manuscript.title}"`,
          data: {
            manuscriptTitle: manuscript.title,
            removedBy: userId
          }
        }
      });
    }

    return NextResponse.json({
      success: true,
      message: 'Collaborator removed successfully'
    });

  } catch (error) {
    console.error('Error removing collaborator:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
