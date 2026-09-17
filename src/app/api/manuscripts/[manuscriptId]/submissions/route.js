import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { getUserId } from '../../../../../lib/auth-server.js';
import { SUBMISSION_STATUS_VALUES } from '../../../../../lib/manuscript-workflow.js';

const prisma = new PrismaClient();

const SUBMISSION_TYPE_VALUES = ['EXTERNAL', 'MANUAL', 'PREPRINT'];

/**
 * List submission records for a manuscript
 * GET /api/manuscripts/[manuscriptId]/submissions
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
      select: { id: true }
    });

    if (!manuscript) {
      return NextResponse.json(
        { error: 'Manuscript not found or insufficient permissions' },
        { status: 404 }
      );
    }

    const submissions = await prisma.manuscriptSubmission.findMany({
      where: { manuscriptId },
      include: {
        creator: {
          select: { id: true, givenName: true, familyName: true }
        }
      },
      orderBy: { submittedAt: 'desc' }
    });

    return NextResponse.json({ success: true, data: submissions });

  } catch (error) {
    console.error('Error fetching manuscript submissions:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

/**
 * Record a submission to a journal, repository, or preprint server
 * POST /api/manuscripts/[manuscriptId]/submissions
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
    const { type, targetName, targetUrl, referenceId, status, submittedAt, notes } = body;

    if (!targetName || !targetName.trim()) {
      return NextResponse.json(
        { error: 'A journal, repository, or preprint server name is required' },
        { status: 400 }
      );
    }

    if (type && !SUBMISSION_TYPE_VALUES.includes(type)) {
      return NextResponse.json(
        { error: `Invalid submission type: ${type}` },
        { status: 400 }
      );
    }

    if (status && !SUBMISSION_STATUS_VALUES.includes(status)) {
      return NextResponse.json(
        { error: `Invalid submission status: ${status}` },
        { status: 400 }
      );
    }

    // Recording a submission requires the same rights as changing the stage
    const manuscript = await prisma.manuscript.findFirst({
      where: {
        id: manuscriptId,
        OR: [
          { createdBy: userId },
          { collaborators: { some: { userId: userId, canInvite: true } } }
        ]
      },
      select: { id: true }
    });

    if (!manuscript) {
      return NextResponse.json(
        { error: 'Manuscript not found or insufficient permissions' },
        { status: 404 }
      );
    }

    const submission = await prisma.manuscriptSubmission.create({
      data: {
        manuscriptId,
        type: type || 'MANUAL',
        targetName: targetName.trim(),
        targetUrl: targetUrl?.trim() || null,
        referenceId: referenceId?.trim() || null,
        status: status || 'SUBMITTED',
        submittedAt: submittedAt ? new Date(submittedAt) : new Date(),
        notes: notes?.trim() || null,
        createdBy: userId
      },
      include: {
        creator: {
          select: { id: true, givenName: true, familyName: true }
        }
      }
    });

    return NextResponse.json({
      success: true,
      data: submission,
      message: 'Submission recorded'
    });

  } catch (error) {
    console.error('Error recording manuscript submission:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
