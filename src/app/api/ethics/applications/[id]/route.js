import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// GET - Get specific ethics application
export async function GET(request, { params }) {
  try {
    const { id } = await params;

    const application = await prisma.ethicsApplication.findUnique({
      where: { id },
      include: {
        linkedProposals: {
          include: {
            proposal: {
              select: {
                id: true,
                title: true,
                status: true,
                principalInvestigator: true,
                startDate: true,
                endDate: true,
              }
            }
          }
        },
        reviews: {
          orderBy: {
            createdAt: 'desc'
          }
        },
        amendments: {
          orderBy: {
            amendmentNumber: 'desc'
          }
        }
      }
    });

    if (!application) {
      return NextResponse.json(
        { success: false, error: 'Ethics application not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      application
    });
  } catch (error) {
    console.error('Error fetching ethics application:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch ethics application' },
      { status: 500 }
    );
  }
}

// PUT - Update ethics application
export async function PUT(request, { params }) {
  try {
    const { id } = await params;
    const data = await request.json();

    const application = await prisma.ethicsApplication.update({
      where: { id },
      data: {
        title: data.title,
        principalInvestigator: data.principalInvestigator,
        principalInvestigatorId: data.principalInvestigatorId,
        department: data.department,
        researchType: data.researchType,
        researchSummary: data.researchSummary,
        researchObjectives: data.researchObjectives,
        methodology: data.methodology,
        studyDuration: data.studyDuration,
        participantPopulation: data.participantPopulation,
        participantCount: data.participantCount,
        ageRange: data.ageRange,
        inclusionCriteria: data.inclusionCriteria,
        exclusionCriteria: data.exclusionCriteria,
        recruitmentMethod: data.recruitmentMethod,
        vulnerablePopulations: data.vulnerablePopulations,
        vulnerablePopulationDesc: data.vulnerablePopulationDesc,
        riskLevel: data.riskLevel,
        potentialRisks: data.potentialRisks,
        riskMitigation: data.riskMitigation,
        potentialBenefits: data.potentialBenefits,
        riskBenefitRatio: data.riskBenefitRatio,
        consentProcess: data.consentProcess,
        consentFormAttached: data.consentFormAttached,
        informationSheetAttached: data.informationSheetAttached,
        consentWaiverRequested: data.consentWaiverRequested,
        consentWaiverJustification: data.consentWaiverJustification,
        dataCollectionMethods: data.dataCollectionMethods,
        dataStorageMethods: data.dataStorageMethods,
        dataSecurityMeasures: data.dataSecurityMeasures,
        dataRetentionPeriod: data.dataRetentionPeriod,
        dataAnonymization: data.dataAnonymization,
        dataSharingPlans: data.dataSharingPlans,
        committeeName: data.committeeName,
        documents: data.documents
      }
    });

    return NextResponse.json({
      success: true,
      application
    });
  } catch (error) {
    console.error('Error updating ethics application:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update ethics application' },
      { status: 500 }
    );
  }
}

// DELETE - Delete ethics application (only if DRAFT)
export async function DELETE(request, { params }) {
  try {
    const { id } = await params;

    const application = await prisma.ethicsApplication.findUnique({
      where: { id }
    });

    if (!application) {
      return NextResponse.json(
        { success: false, error: 'Ethics application not found' },
        { status: 404 }
      );
    }

    if (application.status !== 'DRAFT') {
      return NextResponse.json(
        { success: false, error: 'Can only delete draft applications' },
        { status: 400 }
      );
    }

    await prisma.ethicsApplication.delete({
      where: { id }
    });

    return NextResponse.json({
      success: true,
      message: 'Ethics application deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting ethics application:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete ethics application' },
      { status: 500 }
    );
  }
}
