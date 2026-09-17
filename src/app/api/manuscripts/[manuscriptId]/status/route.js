import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { getUserId } from '../../../../../lib/auth-server.js';
import notificationService from '../../../../../services/notificationService.js';
import {
  WORKFLOW_ACTIONS,
  evaluateSubmissionChecklist,
  checklistBlocksTransition,
  getAvailableActions,
  getStageLabel
} from '../../../../../lib/manuscript-workflow.js';

const prisma = new PrismaClient();

/**
 * Workflow readiness for a manuscript: current stage, available transitions,
 * and the evaluated pre-submission checklist.
 * GET /api/manuscripts/[manuscriptId]/status
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

    const manuscript = await prisma.manuscript.findFirst({
      where: {
        id: manuscriptId,
        OR: [
          { createdBy: userId },
          { collaborators: { some: { userId: userId } } }
        ]
      },
      include: {
        _count: { select: { citations: true, collaborators: true } }
      }
    });

    if (!manuscript) {
      return NextResponse.json(
        { error: 'Manuscript not found or insufficient permissions' },
        { status: 404 }
      );
    }

    const [pendingChangeCount, openCommentCount, submissions] = await Promise.all([
      prisma.trackedChange.count({ where: { manuscriptId, status: 'PENDING' } }),
      prisma.manuscriptComment.count({ where: { manuscriptId, status: 'ACTIVE' } }),
      prisma.manuscriptSubmission.findMany({
        where: { manuscriptId },
        orderBy: { submittedAt: 'desc' }
      })
    ]);

    const checklist = evaluateSubmissionChecklist({
      ...manuscript,
      citationCount: manuscript._count.citations,
      collaboratorCount: manuscript._count.collaborators,
      pendingChangeCount,
      openCommentCount
    });

    return NextResponse.json({
      success: true,
      data: {
        status: manuscript.status,
        publishedAt: manuscript.publishedAt,
        archivedAt: manuscript.archivedAt,
        publicationId: manuscript.publicationId,
        workflowMeta: manuscript.workflowMeta || null,
        checklist,
        blocked: checklistBlocksTransition(checklist),
        availableActions: getAvailableActions(manuscript.status),
        submissions
      }
    });

  } catch (error) {
    console.error('Error loading manuscript workflow state:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

/**
 * Advance a manuscript through its publication lifecycle
 * POST /api/manuscripts/[manuscriptId]/status
 *
 * Body: { action, notes?, publicationMeta?, addToLibrary? }
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
    const { action, notes, publicationMeta, addToLibrary } = await request.json();

    const definition = WORKFLOW_ACTIONS[action];
    if (!definition) {
      return NextResponse.json(
        { error: `Unknown workflow action: ${action}` },
        { status: 400 }
      );
    }

    // Only the creator or a collaborator who can manage the team may move stages
    const manuscript = await prisma.manuscript.findFirst({
      where: {
        id: manuscriptId,
        OR: [
          { createdBy: userId },
          {
            collaborators: {
              some: {
                userId: userId,
                canInvite: true
              }
            }
          }
        ]
      },
      include: {
        _count: {
          select: { citations: true, collaborators: true }
        }
      }
    });

    if (!manuscript) {
      return NextResponse.json(
        { error: 'Manuscript not found or insufficient permissions' },
        { status: 404 }
      );
    }

    if (!definition.from.includes(manuscript.status)) {
      return NextResponse.json(
        {
          error: `Cannot ${definition.label.toLowerCase()} from ${getStageLabel(manuscript.status)}`
        },
        { status: 409 }
      );
    }

    // Readiness gates apply when the manuscript first leaves the drafting phase
    if (action === 'submit_for_review' || action === 'resubmit') {
      const [pendingChangeCount, openCommentCount] = await Promise.all([
        prisma.trackedChange.count({ where: { manuscriptId, status: 'PENDING' } }),
        prisma.manuscriptComment.count({ where: { manuscriptId, status: 'ACTIVE' } })
      ]);

      const checklist = evaluateSubmissionChecklist({
        ...manuscript,
        citationCount: manuscript._count.citations,
        collaboratorCount: manuscript._count.collaborators,
        pendingChangeCount,
        openCommentCount
      });

      if (checklistBlocksTransition(checklist)) {
        return NextResponse.json(
          {
            error: 'Manuscript is not ready for submission',
            checklist: checklist.filter((item) => item.severity === 'error' && !item.passed)
          },
          { status: 422 }
        );
      }
    }

    const previousStatus = manuscript.status;
    const newStatus = definition.to;
    const now = new Date();

    const workflowMeta = { ...(manuscript.workflowMeta || {}) };
    if (notes && notes.trim()) {
      workflowMeta.history = [
        ...(workflowMeta.history || []),
        { action, notes: notes.trim(), at: now.toISOString(), by: userId }
      ];
    }

    const updateData = {
      status: newStatus,
      lastUpdatedBy: userId,
      updatedAt: now
    };

    if (newStatus === 'PUBLISHED') {
      updateData.publishedAt = now;
      if (publicationMeta) {
        workflowMeta.publication = publicationMeta;
      }
    }

    if (newStatus === 'ARCHIVED') {
      updateData.archivedAt = now;
    }

    // Optionally mirror the published manuscript into the user's publication library
    let linkedPublication = null;
    if (newStatus === 'PUBLISHED' && addToLibrary) {
      linkedPublication = await createLinkedPublication({
        manuscript,
        userId,
        metadata: publicationMeta || {}
      });
      updateData.publicationId = linkedPublication.id;
    }

    updateData.workflowMeta = workflowMeta;

    const updated = await prisma.manuscript.update({
      where: { id: manuscriptId },
      data: updateData
    });

    if (definition.milestone) {
      await createMilestoneVersion({ manuscript, userId, newStatus });
    }

    await notifyCollaborators({
      manuscript,
      userId,
      previousStatus,
      newStatus
    });

    return NextResponse.json({
      success: true,
      data: {
        id: updated.id,
        status: updated.status,
        publishedAt: updated.publishedAt,
        archivedAt: updated.archivedAt,
        publicationId: updated.publicationId,
        publication: linkedPublication
      },
      message: `Manuscript moved to ${getStageLabel(newStatus)}`
    });

  } catch (error) {
    console.error('Error updating manuscript status:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

/**
 * Create a Publication record for a published manuscript and add it to the
 * author's library so it appears alongside imported works.
 */
async function createLinkedPublication({ manuscript, userId, metadata }) {
  if (metadata.doi) {
    const existing = await prisma.publication.findFirst({ where: { doi: metadata.doi } });
    if (existing) {
      await prisma.publicationAuthor.upsert({
        where: { userId_publicationId: { userId, publicationId: existing.id } },
        create: { userId, publicationId: existing.id, authorOrder: 1, isCorresponding: true },
        update: {}
      });
      return existing;
    }
  }

  const collaborators = await prisma.manuscriptCollaborator.findMany({
    where: { manuscriptId: manuscript.id },
    include: {
      user: { select: { givenName: true, familyName: true } }
    }
  });

  const authors = collaborators
    .map((collaborator) => `${collaborator.user?.givenName || ''} ${collaborator.user?.familyName || ''}`.trim())
    .filter(Boolean);

  const publicationDate = metadata.publicationDate ? new Date(metadata.publicationDate) : new Date();

  const publication = await prisma.publication.create({
    data: {
      title: manuscript.title,
      type: manuscript.type || 'Article',
      field: manuscript.field || null,
      journal: metadata.journal || null,
      abstract: manuscript.description || '',
      authors,
      doi: metadata.doi || null,
      url: metadata.url || null,
      volume: metadata.volume || null,
      pages: metadata.pages || null,
      keywords: [],
      publicationDate,
      year: publicationDate.getFullYear(),
      status: 'PUBLISHED',
      source: 'HospitiumRIS',
      authorId: metadata.authorId || null
    }
  });

  await prisma.publicationAuthor.create({
    data: {
      userId,
      publicationId: publication.id,
      authorOrder: 1,
      isCorresponding: true
    }
  });

  // Keep the manuscript-to-publication link visible in the citation graph
  await prisma.manuscriptCitation.upsert({
    where: {
      manuscriptId_publicationId: {
        manuscriptId: manuscript.id,
        publicationId: publication.id
      }
    },
    create: { manuscriptId: manuscript.id, publicationId: publication.id },
    update: {}
  });

  return publication;
}

async function createMilestoneVersion({ manuscript, userId, newStatus }) {
  try {
    const latestVersion = await prisma.manuscriptVersion.findFirst({
      where: { manuscriptId: manuscript.id },
      orderBy: { versionNumber: 'desc' }
    });

    await prisma.manuscriptVersion.create({
      data: {
        manuscriptId: manuscript.id,
        versionNumber: latestVersion ? latestVersion.versionNumber + 1 : 1,
        title: manuscript.title,
        content: manuscript.content || '',
        createdBy: userId,
        versionType: 'MILESTONE',
        description: `Stage change: ${getStageLabel(newStatus)}`,
        wordCount: manuscript.wordCount || 0
      }
    });
  } catch (error) {
    // A missing snapshot should not block the stage change
    console.error('Failed to create milestone version:', error);
  }
}

async function notifyCollaborators({ manuscript, userId, previousStatus, newStatus }) {
  try {
    const actor = await prisma.user.findUnique({
      where: { id: userId },
      select: { givenName: true, familyName: true }
    });

    const changedBy = `${actor?.givenName || ''} ${actor?.familyName || ''}`.trim() || 'A collaborator';

    const recipients = await prisma.manuscriptCollaborator.findMany({
      where: { manuscriptId: manuscript.id, userId: { not: userId } },
      select: { userId: true }
    });

    const recipientIds = new Set(recipients.map((r) => r.userId));
    if (manuscript.createdBy !== userId) {
      recipientIds.add(manuscript.createdBy);
    }

    await Promise.all(
      [...recipientIds].map((recipientId) =>
        notificationService.createFromTemplate('MANUSCRIPT_STATUS_CHANGED', {
          userId: recipientId,
          manuscriptId: manuscript.id,
          manuscriptTitle: manuscript.title,
          oldStatus: getStageLabel(previousStatus),
          newStatus: getStageLabel(newStatus),
          changedBy,
          actionUrl: `/researcher/publications/collaborate/edit/${manuscript.id}`
        })
      )
    );
  } catch (error) {
    // Notification failures should not roll back the stage change
    console.error('Failed to notify collaborators of status change:', error);
  }
}
