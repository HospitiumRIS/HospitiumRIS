import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { getUserId } from '../../../../../lib/auth-server.js';

const prisma = new PrismaClient();

/**
 * Get all versions for a specific manuscript
 * GET /api/manuscripts/[manuscriptId]/versions
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

    // Get all versions for the manuscript
    const versions = await prisma.manuscriptVersion.findMany({
      where: {
        manuscriptId: manuscriptId
      },
      include: {
        creator: {
          select: {
            id: true,
            givenName: true,
            familyName: true,
            email: true
          }
        }
      },
      orderBy: {
        versionNumber: 'desc' // Latest versions first
      }
    });

    return NextResponse.json({
      success: true,
      data: versions.map(version => ({
        id: version.id,
        versionNumber: version.versionNumber,
        title: version.title,
        versionType: version.versionType,
        description: version.description,
        wordCount: version.wordCount,
        createdAt: version.createdAt,
        creator: version.creator
      }))
    });

  } catch (error) {
    console.error('Error fetching manuscript versions:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

/**
 * Create a new version for a manuscript
 * POST /api/manuscripts/[manuscriptId]/versions
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

    // Get the next version number
    const latestVersion = await prisma.manuscriptVersion.findFirst({
      where: {
        manuscriptId: manuscriptId
      },
      orderBy: {
        versionNumber: 'desc'
      }
    });

    const nextVersionNumber = latestVersion ? latestVersion.versionNumber + 1 : 1;

    // Calculate word count if content is provided
    let wordCount = 0;
    if (body.content) {
      const textContent = body.content
        .replace(/<[^>]*>/g, '') // Remove HTML tags
        .replace(/\s+/g, ' ') // Normalize whitespace
        .trim();
      wordCount = textContent ? textContent.split(' ').length : 0;
    }

    // Create the new version
    const newVersion = await prisma.manuscriptVersion.create({
      data: {
        manuscriptId: manuscriptId,
        versionNumber: nextVersionNumber,
        title: body.title || manuscript.title,
        content: body.content || manuscript.content || '',
        changes: body.changes ? JSON.stringify(body.changes) : null,
        createdBy: userId,
        versionType: body.versionType || 'MANUAL',
        description: body.description || null,
        wordCount: wordCount
      },
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
        id: newVersion.id,
        versionNumber: newVersion.versionNumber,
        title: newVersion.title,
        versionType: newVersion.versionType,
        description: newVersion.description,
        wordCount: newVersion.wordCount,
        createdAt: newVersion.createdAt,
        creator: newVersion.creator
      },
      message: 'Version created successfully'
    });

  } catch (error) {
    console.error('Error creating manuscript version:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
