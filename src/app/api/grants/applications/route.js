import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { sessionUser } from '@/lib/review-access-server';
import { findAccessibleProposal } from '@/lib/proposals/visibility';
import { isPersonallyInvolved } from '@/lib/proposals/scope';

// GET - The signed-in user's grant applications (#6: no `userId` lookup of other people)
export async function GET(request) {
  try {
    const auth = await sessionUser(request);
    if (auth.error) return auth.error;
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const proposalId = searchParams.get('proposalId');

    const where = { userId: auth.user.id };
    
    if (status) {
      where.status = status;
    }

    if (proposalId) {
      where.proposalId = proposalId;
    }

    const applications = await prisma.grantApplication.findMany({
      where,
      include: {
        proposal: {
          select: {
            id: true,
            title: true,
            status: true,
            principalInvestigator: true,
            totalBudgetAmount: true,
          }
        },
        communications: {
          orderBy: {
            date: 'desc'
          },
          take: 5
        },
        milestones: {
          orderBy: {
            dueDate: 'asc'
          }
        },
        award: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    return NextResponse.json({
      success: true,
      applications
    });
  } catch (error) {
    console.error('Error fetching grant applications:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch grant applications' },
      { status: 500 }
    );
  }
}

// POST - Create a grant application for one of the user's own approved proposals (#6)
export async function POST(request) {
  try {
    const auth = await sessionUser(request);
    if (auth.error) return auth.error;
    const data = await request.json().catch(() => ({}));

    // Verify the proposal is visible to the user, they are on it, and it is APPROVED
    const visible = data.proposalId ? await findAccessibleProposal(auth.user, data.proposalId) : null;
    const proposal = visible && isPersonallyInvolved(auth.user, visible)
      ? await prisma.proposal.findUnique({ where: { id: data.proposalId } })
      : null;

    if (!proposal) {
      return NextResponse.json(
        { success: false, error: 'Proposal not found' },
        { status: 404 }
      );
    }

    if (proposal.status !== 'APPROVED') {
      return NextResponse.json(
        { success: false, error: 'Can only create grant applications from APPROVED proposals' },
        { status: 400 }
      );
    }

    const application = await prisma.grantApplication.create({
      data: {
        proposalId: data.proposalId,
        userId: auth.user.id,
        grantorName: data.grantorName,
        grantorEmail: data.grantorEmail,
        grantorContactPerson: data.grantorContactPerson,
        grantorPhone: data.grantorPhone,
        grantProgram: data.grantProgram,
        grantOpportunityId: data.grantOpportunityId,
        applicationTitle: data.applicationTitle,
        requestedAmount: data.requestedAmount,
        submissionDeadline: data.submissionDeadline,
        applicationDate: data.applicationDate,
        status: data.status || 'PREPARING',
        stage: data.stage || 'preparation',
        priority: data.priority || 'Medium',
        requirements: data.requirements || [],
        notes: data.notes,
        grantInstitutionEmail: data.grantInstitutionEmail,
      },
      include: {
        proposal: {
          select: {
            id: true,
            title: true,
            status: true,
            principalInvestigator: true,
            totalBudgetAmount: true,
          }
        }
      }
    });

    return NextResponse.json({
      success: true,
      application
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating grant application:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create grant application' },
      { status: 500 }
    );
  }
}
