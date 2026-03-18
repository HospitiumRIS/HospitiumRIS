import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// GET /api/foundation/internal-grants
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';
    const status = searchParams.get('status') || 'all';
    const stage = searchParams.get('stage') || 'all';
    const id = searchParams.get('id');

    // Fetch single record
    if (id) {
      const request_ = await prisma.internalGrantRequest.findUnique({
        where: { id },
        include: {
          reviews: {
            orderBy: { reviewDate: 'asc' }
          }
        }
      });

      if (!request_) {
        return NextResponse.json({ success: false, error: 'Request not found' }, { status: 404 });
      }

      return NextResponse.json({ success: true, request: request_ });
    }

    let whereClause = {};

    if (search) {
      whereClause = {
        OR: [
          { title: { contains: search, mode: 'insensitive' } },
          { applicantName: { contains: search, mode: 'insensitive' } },
          { department: { contains: search, mode: 'insensitive' } },
          { purpose: { contains: search, mode: 'insensitive' } }
        ]
      };
    }

    if (status !== 'all') {
      whereClause.status = status;
    }

    if (stage !== 'all') {
      whereClause.stage = stage;
    }

    const requests = await prisma.internalGrantRequest.findMany({
      where: whereClause,
      include: {
        reviews: {
          orderBy: { reviewDate: 'asc' }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    // Summary stats
    const all = await prisma.internalGrantRequest.findMany({ select: { status: true, requestedAmount: true, approvedAmount: true } });
    const stats = {
      total: all.length,
      draft: all.filter(r => r.status === 'draft').length,
      submitted: all.filter(r => r.status === 'submitted').length,
      under_review: all.filter(r => r.status === 'under_review').length,
      approved: all.filter(r => r.status === 'approved').length,
      rejected: all.filter(r => r.status === 'rejected').length,
      revision_requested: all.filter(r => r.status === 'revision_requested').length,
      totalRequestedAmount: all.reduce((s, r) => s + parseFloat(r.requestedAmount || 0), 0),
      totalApprovedAmount: all.filter(r => r.approvedAmount).reduce((s, r) => s + parseFloat(r.approvedAmount || 0), 0)
    };

    return NextResponse.json({ success: true, requests, stats });
  } catch (error) {
    console.error('Error fetching internal grant requests:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch requests' }, { status: 500 });
  }
}

// POST /api/foundation/internal-grants — create or submit
export async function POST(request) {
  try {
    const body = await request.json();
    const {
      applicantName,
      applicantEmail,
      applicantTitle,
      department,
      title,
      purpose,
      description,
      requestedAmount,
      projectStartDate,
      projectEndDate,
      attachments,
      submit // if true, status becomes 'submitted'
    } = body;

    if (!applicantName || !applicantEmail || !department || !title || !purpose || !description || !requestedAmount) {
      return NextResponse.json(
        { success: false, error: 'Applicant name, email, department, title, purpose, description, and requested amount are required' },
        { status: 400 }
      );
    }

    const parsedAmount = parseFloat(requestedAmount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      return NextResponse.json({ success: false, error: 'Requested amount must be a positive number' }, { status: 400 });
    }

    const status = submit ? 'submitted' : 'draft';
    const now = new Date();

    const newRequest = await prisma.internalGrantRequest.create({
      data: {
        applicantName: applicantName.trim(),
        applicantEmail: applicantEmail.trim(),
        applicantTitle: applicantTitle?.trim() || null,
        department: department.trim(),
        title: title.trim(),
        purpose,
        description: description.trim(),
        requestedAmount: parsedAmount,
        projectStartDate: projectStartDate ? new Date(projectStartDate) : null,
        projectEndDate: projectEndDate ? new Date(projectEndDate) : null,
        attachments: attachments || [],
        status,
        stage: 'intake',
        submittedAt: submit ? now : null
      },
      include: { reviews: true }
    });

    return NextResponse.json({
      success: true,
      request: newRequest,
      message: submit ? 'Grant request submitted successfully' : 'Grant request saved as draft'
    });
  } catch (error) {
    console.error('Error creating internal grant request:', error);
    return NextResponse.json({ success: false, error: 'Failed to create request' }, { status: 500 });
  }
}

// PUT /api/foundation/internal-grants — update request, advance stage, record review, or mark report
export async function PUT(request) {
  try {
    const body = await request.json();
    const { id, action } = body;

    if (!id) {
      return NextResponse.json({ success: false, error: 'Request ID is required' }, { status: 400 });
    }

    const existing = await prisma.internalGrantRequest.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ success: false, error: 'Request not found' }, { status: 404 });
    }

    // --- action: edit (update fields) ---
    if (action === 'edit' || !action) {
      const {
        applicantName,
        applicantEmail,
        applicantTitle,
        department,
        title,
        purpose,
        description,
        requestedAmount,
        projectStartDate,
        projectEndDate,
        attachments,
        submit
      } = body;

      const parsedAmount = requestedAmount ? parseFloat(requestedAmount) : undefined;

      const updated = await prisma.internalGrantRequest.update({
        where: { id },
        data: {
          ...(applicantName && { applicantName: applicantName.trim() }),
          ...(applicantEmail && { applicantEmail: applicantEmail.trim() }),
          ...(applicantTitle !== undefined && { applicantTitle: applicantTitle?.trim() || null }),
          ...(department && { department: department.trim() }),
          ...(title && { title: title.trim() }),
          ...(purpose && { purpose }),
          ...(description && { description: description.trim() }),
          ...(parsedAmount && { requestedAmount: parsedAmount }),
          ...(projectStartDate !== undefined && { projectStartDate: projectStartDate ? new Date(projectStartDate) : null }),
          ...(projectEndDate !== undefined && { projectEndDate: projectEndDate ? new Date(projectEndDate) : null }),
          ...(attachments && { attachments }),
          ...(submit && { status: 'submitted', submittedAt: existing.submittedAt || new Date() })
        },
        include: { reviews: { orderBy: { reviewDate: 'asc' } } }
      });

      return NextResponse.json({ success: true, request: updated, message: submit ? 'Request submitted' : 'Request updated' });
    }

    // --- action: review (record a review and advance stage/status) ---
    if (action === 'review') {
      const { reviewerName, reviewerEmail, stage, decision, comments, approvedAmount, decisionNotes, revisionNotes, reportingRequired, reportDueDate } = body;

      if (!reviewerName || !stage || !decision || !comments) {
        return NextResponse.json({ success: false, error: 'Reviewer name, stage, decision, and comments are required' }, { status: 400 });
      }

      const STAGE_ORDER = ['intake', 'initial_review', 'committee_review', 'final_decision'];
      const currentStageIdx = STAGE_ORDER.indexOf(existing.stage);

      let newStatus = existing.status;
      let newStage = existing.stage;
      let decisionDate = null;

      if (decision === 'approved') {
        newStatus = 'approved';
        newStage = 'final_decision';
        decisionDate = new Date();
      } else if (decision === 'rejected') {
        newStatus = 'rejected';
        newStage = 'final_decision';
        decisionDate = new Date();
      } else if (decision === 'revision_requested') {
        newStatus = 'revision_requested';
        decisionDate = new Date();
      } else if (decision === 'forward') {
        // Advance to next stage
        newStatus = 'under_review';
        newStage = STAGE_ORDER[Math.min(currentStageIdx + 1, STAGE_ORDER.length - 1)];
      }

      // Record the review
      await prisma.internalGrantReview.create({
        data: {
          grantRequestId: id,
          reviewerName: reviewerName.trim(),
          reviewerEmail: reviewerEmail?.trim() || null,
          stage,
          decision,
          comments: comments.trim(),
          reviewDate: new Date()
        }
      });

      // Update the request
      const updated = await prisma.internalGrantRequest.update({
        where: { id },
        data: {
          status: newStatus,
          stage: newStage,
          ...(decisionDate && { decisionDate }),
          ...(decisionNotes && { decisionNotes: decisionNotes.trim() }),
          ...(revisionNotes && { revisionNotes: revisionNotes.trim() }),
          ...(approvedAmount && decision === 'approved' && { approvedAmount: parseFloat(approvedAmount) }),
          ...(reportingRequired !== undefined && decision === 'approved' && { reportingRequired }),
          ...(reportDueDate && decision === 'approved' && { reportDueDate: new Date(reportDueDate) })
        },
        include: { reviews: { orderBy: { reviewDate: 'asc' } } }
      });

      return NextResponse.json({ success: true, request: updated, message: 'Review recorded successfully' });
    }

    // --- action: report (mark report as submitted) ---
    if (action === 'report') {
      const updated = await prisma.internalGrantRequest.update({
        where: { id },
        data: { reportSubmitted: true, reportSubmittedAt: new Date() },
        include: { reviews: { orderBy: { reviewDate: 'asc' } } }
      });

      return NextResponse.json({ success: true, request: updated, message: 'Report marked as submitted' });
    }

    return NextResponse.json({ success: false, error: 'Unknown action' }, { status: 400 });
  } catch (error) {
    console.error('Error updating internal grant request:', error);
    if (error.code === 'P2025') {
      return NextResponse.json({ success: false, error: 'Request not found' }, { status: 404 });
    }
    return NextResponse.json({ success: false, error: 'Failed to update request' }, { status: 500 });
  }
}

// DELETE /api/foundation/internal-grants
export async function DELETE(request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ success: false, error: 'Request ID is required' }, { status: 400 });
    }

    await prisma.internalGrantRequest.delete({ where: { id } });

    return NextResponse.json({ success: true, message: 'Grant request deleted successfully' });
  } catch (error) {
    console.error('Error deleting internal grant request:', error);
    if (error.code === 'P2025') {
      return NextResponse.json({ success: false, error: 'Request not found' }, { status: 404 });
    }
    return NextResponse.json({ success: false, error: 'Failed to delete request' }, { status: 500 });
  }
}
