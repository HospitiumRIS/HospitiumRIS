import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { getUserId } from '../../../../../lib/auth-server.js';

const prisma = new PrismaClient();

/**
 * Get all comments for a specific manuscript
 * GET /api/manuscripts/[manuscriptId]/comments
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

    const { manuscriptId } = await params;

    if (!manuscriptId) {
      return NextResponse.json(
        { error: 'Manuscript ID is required' },
        { status: 400 }
      );
    }

    // Verify user has access to the manuscript
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

    // Get all comments for this manuscript
    const comments = await prisma.manuscriptComment.findMany({
      where: {
        manuscriptId: manuscriptId
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
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    return NextResponse.json({
      success: true,
      data: comments
    });

  } catch (error) {
    console.error('Error fetching manuscript comments:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

/**
 * Create a new comment on a manuscript
 * POST /api/manuscripts/[manuscriptId]/comments
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

    const { manuscriptId } = await params;
    const { 
      content, 
      selectedText, 
      startOffset, 
      endOffset, 
      parentCommentId = null,
      type = 'COMMENT' // COMMENT, SUGGESTION, QUESTION
    } = await request.json();

    if (!manuscriptId || !content) {
      return NextResponse.json(
        { error: 'Manuscript ID and content are required' },
        { status: 400 }
      );
    }

    // Verify user has access to the manuscript
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

    // Create the comment
    const comment = await prisma.manuscriptComment.create({
      data: {
        manuscriptId: manuscriptId,
        authorId: userId,
        content: content.trim(),
        selectedText: selectedText || null,
        startOffset: startOffset || null,
        endOffset: endOffset || null,
        parentCommentId: parentCommentId,
        type: type,
        status: 'ACTIVE'
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
        }
      }
    });

    return NextResponse.json({
      success: true,
      data: comment,
      message: 'Comment created successfully'
    });

  } catch (error) {
    console.error('Error creating manuscript comment:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
