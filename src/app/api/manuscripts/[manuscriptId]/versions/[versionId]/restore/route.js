import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { getUserId } from '../../../../../../../lib/auth-server.js';

const prisma = new PrismaClient();

/**
 * Restore manuscript to a specific version
 * POST /api/manuscripts/[manuscriptId]/versions/[versionId]/restore
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

    const { manuscriptId, versionId } = await params;

    if (!manuscriptId || !versionId) {
      return NextResponse.json(
        { error: 'Manuscript ID and Version ID are required' },
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

    // Get the version to restore to
    const versionToRestore = await prisma.manuscriptVersion.findFirst({
      where: {
        id: versionId,
        manuscriptId: manuscriptId
      }
    });

    if (!versionToRestore) {
      return NextResponse.json(
        { error: 'Version not found' },
        { status: 404 }
      );
    }

    // Create a new version with current content before restoring (backup)
    const latestVersion = await prisma.manuscriptVersion.findFirst({
      where: {
        manuscriptId: manuscriptId
      },
      orderBy: {
        versionNumber: 'desc'
      }
    });

    const nextVersionNumber = latestVersion ? latestVersion.versionNumber + 1 : 1;

    // Create backup version
    const currentWordCount = manuscript.content
      ? manuscript.content.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim().split(' ').length
      : 0;

    await prisma.manuscriptVersion.create({
      data: {
        manuscriptId: manuscriptId,
        versionNumber: nextVersionNumber,
        title: manuscript.title,
        content: manuscript.content || '',
        createdBy: userId,
        versionType: 'AUTO',
        description: `Backup before restoring to version ${versionToRestore.versionNumber}`,
        wordCount: currentWordCount
      }
    });

    // Restore manuscript to the selected version
    const updatedManuscript = await prisma.manuscript.update({
      where: {
        id: manuscriptId
      },
      data: {
        title: versionToRestore.title,
        content: versionToRestore.content,
        wordCount: versionToRestore.wordCount,
        updatedAt: new Date(),
        lastSaved: new Date()
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
        id: updatedManuscript.id,
        title: updatedManuscript.title,
        content: updatedManuscript.content,
        wordCount: updatedManuscript.wordCount,
        updatedAt: updatedManuscript.updatedAt,
        lastSaved: updatedManuscript.lastSaved,
        restoredFromVersion: versionToRestore.versionNumber
      },
      message: `Manuscript restored to version ${versionToRestore.versionNumber}`
    });

  } catch (error) {
    console.error('Error restoring manuscript version:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
