import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { getUserId } from '../../../../../../lib/auth-server.js';

const prisma = new PrismaClient();

/**
 * Get a specific version of a manuscript
 * GET /api/manuscripts/[manuscriptId]/versions/[versionId]
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

    const { manuscriptId, versionId } = await params;

    if (!manuscriptId || !versionId) {
      return NextResponse.json(
        { error: 'Manuscript ID and Version ID are required' },
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

    // Get the specific version
    const version = await prisma.manuscriptVersion.findFirst({
      where: {
        id: versionId,
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
      }
    });

    if (!version) {
      return NextResponse.json(
        { error: 'Version not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        id: version.id,
        versionNumber: version.versionNumber,
        title: version.title,
        content: version.content,
        changes: version.changes ? JSON.parse(version.changes) : null,
        versionType: version.versionType,
        description: version.description,
        wordCount: version.wordCount,
        createdAt: version.createdAt,
        creator: version.creator
      }
    });

  } catch (error) {
    console.error('Error fetching manuscript version:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

