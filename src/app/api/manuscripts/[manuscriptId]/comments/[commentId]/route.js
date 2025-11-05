import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { getUserId } from '../../../../../../lib/auth-server.js';

const prisma = new PrismaClient();

/**
 * Update a specific comment
 * PUT /api/manuscripts/[manuscriptId]/comments/[commentId]
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

    const { manuscriptId, commentId } = params;
    const { content, status } = await request.json();

    if (!manuscriptId || !commentId) {
      return NextResponse.json(
        { error: 'Manuscript ID and Comment ID are required' },
        { status: 400 }
      );
    }

    // Verify the comment exists and user has permission
    const comment = await prisma.manuscriptComment.findFirst({
      where: {
        id: commentId,
        manuscriptId: manuscriptId,
        OR: [
          { authorId: userId }, // Comment author can edit
          {
            manuscript: {
              createdBy: userId // Manuscript owner can moderate
            }
          }
        ]
      }
    });

    if (!comment) {
      return NextResponse.json(
        { error: 'Comment not found or insufficient permissions' },
        { status: 404 }
      );
    }

    // Update the comment
    const updatedComment = await prisma.manuscriptComment.update({
      where: {
        id: commentId
      },
      data: {
        ...(content && { content: content.trim() }),
        ...(status && { status: status }),
        updatedAt: new Date()
      },
      include: {
        author: {
          select: {
            id: true,
            givenName: true,
            familyName: true,
            email: true,
            orcidId: true
          }
        },
        replies: {
          include: {
            author: {
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
            createdAt: 'asc'
          }
        }
      }
    });

    return NextResponse.json({
      success: true,
      data: updatedComment,
      message: 'Comment updated successfully'
    });

  } catch (error) {
    console.error('Error updating manuscript comment:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

/**
 * Delete a specific comment
 * DELETE /api/manuscripts/[manuscriptId]/comments/[commentId]
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

    const { manuscriptId, commentId } = params;

    if (!manuscriptId || !commentId) {
      return NextResponse.json(
        { error: 'Manuscript ID and Comment ID are required' },
        { status: 400 }
      );
    }

    // Verify the comment exists and user has permission
    const comment = await prisma.manuscriptComment.findFirst({
      where: {
        id: commentId,
        manuscriptId: manuscriptId,
        OR: [
          { authorId: userId }, // Comment author can delete
          {
            manuscript: {
              createdBy: userId // Manuscript owner can moderate
            }
          }
        ]
      }
    });

    if (!comment) {
      return NextResponse.json(
        { error: 'Comment not found or insufficient permissions' },
        { status: 404 }
      );
    }

    // Delete the comment and all its replies
    await prisma.manuscriptComment.deleteMany({
      where: {
        OR: [
          { id: commentId },
          { parentCommentId: commentId }
        ]
      }
    });

    return NextResponse.json({
      success: true,
      message: 'Comment deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting manuscript comment:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

