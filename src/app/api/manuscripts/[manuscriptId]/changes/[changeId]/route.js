import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { getUserId } from '../../../../../../lib/auth-server.js';

const prisma = new PrismaClient();

/**
 * Update a specific tracked change (accept/reject)
 * PUT /api/manuscripts/[manuscriptId]/changes/[changeId]
 */
export async function PUT(request, { params }) {
  try {
    const userId = await getUserId();
    if (!userId) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const { manuscriptId, changeId } = await params;
    const body = await request.json();

    if (!manuscriptId || !changeId) {
      return NextResponse.json(
        { error: 'Manuscript ID and Change ID are required' },
        { status: 400 }
      );
    }

    // Verify user has edit permission for the manuscript
    const manuscript = await prisma.manuscript.findFirst({
      where: {
        id: manuscriptId,
        OR: [
          { createdBy: userId },
          {
            collaborators: {
              some: {
                userId: userId,
                canEdit: true
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

    // Find the tracked change
    const change = await prisma.trackedChange.findFirst({
      where: {
        changeId: changeId,
        manuscriptId: manuscriptId
      }
    });

    if (!change) {
      return NextResponse.json(
        { error: 'Tracked change not found' },
        { status: 404 }
      );
    }

    // Validate the status update
    const { status } = body;
    if (!status || !['ACCEPTED', 'REJECTED'].includes(status)) {
      return NextResponse.json(
        { error: 'Status must be either ACCEPTED or REJECTED' },
        { status: 400 }
      );
    }

    // Update the change status
    const updatedChange = await prisma.trackedChange.update({
      where: {
        id: change.id
      },
      data: {
        status: status,
        acceptedBy: userId,
        ...(status === 'ACCEPTED' ? { acceptedAt: new Date() } : { rejectedAt: new Date() })
      },
      include: {
        author: {
          select: {
            id: true,
            givenName: true,
            familyName: true,
            email: true
          }
        },
        acceptedByUser: {
          select: {
            id: true,
            givenName: true,
            familyName: true,
            email: true
          }
        }
      }
    });

    return NextResponse.json({
      success: true,
      data: {
        id: updatedChange.id,
        changeId: updatedChange.changeId,
        type: updatedChange.type,
        operation: updatedChange.operation,
        content: updatedChange.content,
        oldContent: updatedChange.oldContent,
        startOffset: updatedChange.startOffset,
        endOffset: updatedChange.endOffset,
        nodeType: updatedChange.nodeType,
        status: updatedChange.status,
        createdAt: updatedChange.createdAt,
        acceptedAt: updatedChange.acceptedAt,
        rejectedAt: updatedChange.rejectedAt,
        author: updatedChange.author,
        acceptedBy: updatedChange.acceptedByUser
      },
      message: `Change ${status.toLowerCase()} successfully`
    });

  } catch (error) {
    console.error('Error updating tracked change:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

/**
 * Delete a specific tracked change
 * DELETE /api/manuscripts/[manuscriptId]/changes/[changeId]
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

    const { manuscriptId, changeId } = await params;

    if (!manuscriptId || !changeId) {
      return NextResponse.json(
        { error: 'Manuscript ID and Change ID are required' },
        { status: 400 }
      );
    }

    // Verify user has edit permission for the manuscript
    const manuscript = await prisma.manuscript.findFirst({
      where: {
        id: manuscriptId,
        OR: [
          { createdBy: userId },
          {
            collaborators: {
              some: {
                userId: userId,
                canEdit: true
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

    // Find and delete the tracked change
    const change = await prisma.trackedChange.findFirst({
      where: {
        changeId: changeId,
        manuscriptId: manuscriptId
      }
    });

    if (!change) {
      return NextResponse.json(
        { error: 'Tracked change not found' },
        { status: 404 }
      );
    }

    // Only allow deletion by the author or manuscript owner
    if (change.authorId !== userId && manuscript.createdBy !== userId) {
      return NextResponse.json(
        { error: 'Insufficient permissions to delete this change' },
        { status: 403 }
      );
    }

    await prisma.trackedChange.delete({
      where: {
        id: change.id
      }
    });

    return NextResponse.json({
      success: true,
      message: 'Tracked change deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting tracked change:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
