import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// GET - Get specific grant application
export async function GET(request, { params }) {
  try {
    const { id } = params;

    const application = await prisma.grantApplication.findUnique({
      where: { id },
      include: {
        proposal: {
          select: {
            id: true,
            title: true,
            status: true,
            principalInvestigator: true,
            totalBudgetAmount: true,
            researchObjectives: true,
            methodology: true,
            startDate: true,
            endDate: true,
          }
        },
        communications: {
          orderBy: {
            date: 'desc'
          }
        },
        milestones: {
          orderBy: {
            dueDate: 'asc'
          }
        },
        award: {
          include: {
            reports: {
              orderBy: {
                dueDate: 'asc'
              }
            }
          }
        }
      }
    });

    if (!application) {
      return NextResponse.json(
        { success: false, error: 'Grant application not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      application
    });
  } catch (error) {
    console.error('Error fetching grant application:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch grant application' },
      { status: 500 }
    );
  }
}

// PUT - Update grant application
export async function PUT(request, { params }) {
  try {
    const { id } = params;
    const data = await request.json();

    const application = await prisma.grantApplication.update({
      where: { id },
      data: {
        grantorName: data.grantorName,
        grantorEmail: data.grantorEmail,
        grantorContactPerson: data.grantorContactPerson,
        grantorPhone: data.grantorPhone,
        grantProgram: data.grantProgram,
        applicationTitle: data.applicationTitle,
        requestedAmount: data.requestedAmount,
        submissionDeadline: data.submissionDeadline,
        applicationDate: data.applicationDate,
        status: data.status,
        stage: data.stage,
        priority: data.priority,
        requirements: data.requirements,
        notes: data.notes,
        grantInstitutionEmail: data.grantInstitutionEmail,
        submittedAt: data.submittedAt
      }
    });

    return NextResponse.json({
      success: true,
      application
    });
  } catch (error) {
    console.error('Error updating grant application:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update grant application' },
      { status: 500 }
    );
  }
}

// DELETE - Delete grant application (only if PREPARING)
export async function DELETE(request, { params }) {
  try {
    const { id } = params;

    const application = await prisma.grantApplication.findUnique({
      where: { id }
    });

    if (!application) {
      return NextResponse.json(
        { success: false, error: 'Grant application not found' },
        { status: 404 }
      );
    }

    if (application.status !== 'PREPARING') {
      return NextResponse.json(
        { success: false, error: 'Can only delete applications in PREPARING status' },
        { status: 400 }
      );
    }

    await prisma.grantApplication.delete({
      where: { id }
    });

    return NextResponse.json({
      success: true,
      message: 'Grant application deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting grant application:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete grant application' },
      { status: 500 }
    );
  }
}
