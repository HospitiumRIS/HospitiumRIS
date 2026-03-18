import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// GET - List grant applications
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const userId = searchParams.get('userId');
    const proposalId = searchParams.get('proposalId');

    const where = {};
    
    if (status) {
      where.status = status;
    }
    
    if (userId) {
      where.userId = userId;
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

// POST - Create new grant application
export async function POST(request) {
  try {
    const data = await request.json();

    // Verify proposal exists and is APPROVED
    const proposal = await prisma.proposal.findUnique({
      where: { id: data.proposalId }
    });

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
        userId: data.userId,
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
