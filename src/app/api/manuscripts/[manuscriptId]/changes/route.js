import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { getUserId } from '../../../../../lib/auth-server.js';

const prisma = new PrismaClient();

/**
 * Get all tracked changes for a specific manuscript
 * GET /api/manuscripts/[manuscriptId]/changes
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

    // Get all changes for the manuscript
    const changes = await prisma.trackedChange.findMany({
      where: {
        manuscriptId: manuscriptId
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
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    return NextResponse.json({
      success: true,
      data: changes.map(change => ({
        id: change.id,
        changeId: change.changeId,
        type: change.type,
        operation: change.operation,
        content: change.content,
        oldContent: change.oldContent,
        startOffset: change.startOffset,
        endOffset: change.endOffset,
        nodeType: change.nodeType,
        status: change.status,
        createdAt: change.createdAt,
        acceptedAt: change.acceptedAt,
        rejectedAt: change.rejectedAt,
        author: change.author,
        acceptedBy: change.acceptedByUser
      }))
    });

  } catch (error) {
    console.error('Error fetching tracked changes:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

/**
 * Create a new tracked change
 * POST /api/manuscripts/[manuscriptId]/changes
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
    const body = await request.json();

    if (!manuscriptId) {
      return NextResponse.json(
        { error: 'Manuscript ID is required' },
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

    // Validate required fields
    const { changeId, type, operation, startOffset, endOffset } = body;
    
    if (!changeId || !type || !operation || startOffset === undefined || endOffset === undefined) {
      return NextResponse.json(
        { error: 'Missing required fields: changeId, type, operation, startOffset, endOffset' },
        { status: 400 }
      );
    }

    // Create the tracked change
    const newChange = await prisma.trackedChange.create({
      data: {
        manuscriptId: manuscriptId,
        changeId: changeId,
        type: type,
        operation: operation,
        content: body.content || null,
        oldContent: body.oldContent || null,
        startOffset: startOffset,
        endOffset: endOffset,
        nodeType: body.nodeType || null,
        authorId: userId,
        status: 'PENDING'
      },
      include: {
        author: {
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
        id: newChange.id,
        changeId: newChange.changeId,
        type: newChange.type,
        operation: newChange.operation,
        content: newChange.content,
        oldContent: newChange.oldContent,
        startOffset: newChange.startOffset,
        endOffset: newChange.endOffset,
        nodeType: newChange.nodeType,
        status: newChange.status,
        createdAt: newChange.createdAt,
        author: newChange.author
      },
      message: 'Tracked change created successfully'
    });

  } catch (error) {
    console.error('Error creating tracked change:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
