import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { getUserId } from '../../../../lib/auth-server.js';

const prisma = new PrismaClient();

/**
 * Get a specific manuscript by ID
 * GET /api/manuscripts/[manuscriptId]
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

    // Get manuscript with permission check
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
            orcidId: true
          }
        },
        collaborators: {
          include: {
            user: {
              select: {
                id: true,
                givenName: true,
                familyName: true,
                email: true,
                orcidId: true
              }
            }
          }
        },
        _count: {
          select: {
            citations: true,
            collaborators: true
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

    return NextResponse.json({
      success: true,
      data: {
        id: manuscript.id,
        title: manuscript.title,
        type: manuscript.type,
        field: manuscript.field,
        description: manuscript.description,
        status: manuscript.status,
        content: manuscript.content || '',
        wordCount: manuscript.wordCount || 0,
        createdAt: manuscript.createdAt,
        updatedAt: manuscript.updatedAt,
        lastSaved: manuscript.lastSaved,
        creator: manuscript.creator,
        collaborators: manuscript.collaborators,
        citationCount: manuscript._count.citations,
        collaboratorCount: manuscript._count.collaborators
      }
    });

  } catch (error) {
    console.error('Error fetching manuscript:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}


/**
 * Update a specific manuscript
 * PATCH /api/manuscripts/[manuscriptId]
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

    const { manuscriptId } = params;

    if (!manuscriptId) {
      return NextResponse.json(
        { error: 'Manuscript ID is required' },
        { status: 400 }
      );
    }

    const updateData = await request.json();

    // Verify user has permission to update
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

    // Calculate word count if content is being updated
    let wordCount = manuscript.wordCount;
    if (updateData.content !== undefined) {
      // Simple word count calculation (remove HTML tags and count words)
      const textContent = updateData.content
        .replace(/<[^>]*>/g, '') // Remove HTML tags
        .replace(/\s+/g, ' ') // Normalize whitespace
        .trim();
      wordCount = textContent ? textContent.split(' ').length : 0;
    }

    // Prepare update data
    const dataToUpdate = {
      ...updateData,
      wordCount: wordCount,
      lastSaved: new Date(),
      updatedAt: new Date()
    };

    // Update the manuscript
    const updatedManuscript = await prisma.manuscript.update({
      where: {
        id: manuscriptId
      },
      data: dataToUpdate,
      include: {
        creator: {
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
        id: updatedManuscript.id,
        title: updatedManuscript.title,
        type: updatedManuscript.type,
        field: updatedManuscript.field,
        description: updatedManuscript.description,
        status: updatedManuscript.status,
        content: updatedManuscript.content,
        wordCount: updatedManuscript.wordCount,
        createdAt: updatedManuscript.createdAt,
        updatedAt: updatedManuscript.updatedAt,
        lastSaved: updatedManuscript.lastSaved,
        creator: updatedManuscript.creator
      },
      message: 'Manuscript saved successfully'
    });

  } catch (error) {
    console.error('Error updating manuscript:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

/**
 * Delete a specific manuscript
 * DELETE /api/manuscripts/[manuscriptId]
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

    const { manuscriptId } = params;

    if (!manuscriptId) {
      return NextResponse.json(
        { error: 'Manuscript ID is required' },
        { status: 400 }
      );
    }

    // Verify user has permission to delete (only creator or collaborators with delete permission)
    const manuscript = await prisma.manuscript.findFirst({
      where: {
        id: manuscriptId,
        OR: [
          { createdBy: userId },
          {
            collaborators: {
              some: {
                userId: userId,
                canDelete: true
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

    // Delete the manuscript (cascading deletes will handle related records)
    await prisma.manuscript.delete({
      where: {
        id: manuscriptId
      }
    });

    return NextResponse.json({
      success: true,
      message: 'Manuscript deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting manuscript:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
