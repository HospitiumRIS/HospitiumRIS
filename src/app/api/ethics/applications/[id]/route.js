import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';

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
    console.log('PUT request received for ethics application:', id);
    
    // Parse FormData
    const formData = await request.formData();
    const applicationDataString = formData.get('applicationData');
    
    if (!applicationDataString) {
      console.log('No applicationData in request');
      return NextResponse.json(
        { success: false, error: 'Application data is required' },
        { status: 400 }
      );
    }

    const data = JSON.parse(applicationDataString);
    console.log('Parsed data:', { title: data.title, researchType: data.researchType });

    // Create uploads directory if it doesn't exist
    const uploadsDir = join(process.cwd(), 'uploads', 'ethics');
    await mkdir(uploadsDir, { recursive: true });

    // Handle file uploads
    const uploadedDocuments = [];
    
    const fileFields = [
      { field: 'participantInfoSheet', type: 'Participant Information Sheet' },
      { field: 'consentForm', type: 'Consent Form' },
      { field: 'researchProtocol', type: 'Research Protocol' },
      { field: 'recruitmentMaterials', type: 'Recruitment Materials' },
      { field: 'dataCollectionTools', type: 'Data Collection Tools' },
      { field: 'lettersOfSupport', type: 'Letters of Support' },
      { field: 'investigatorCVs', type: 'Investigator CVs' },
    ];

    for (const { field, type } of fileFields) {
      const files = formData.getAll(field);
      for (const file of files) {
        if (file && file.size > 0) {
          const fileName = `${field}_${Date.now()}_${file.name}`;
          const filePath = join(uploadsDir, fileName);
          const bytes = await file.arrayBuffer();
          await writeFile(filePath, Buffer.from(bytes));
          
          uploadedDocuments.push({
            type,
            originalName: file.name,
            fileName,
            size: file.size,
            mimeType: file.type,
            url: `/uploads/ethics/${fileName}`,
            uploadedAt: new Date().toISOString(),
          });
        }
      }
    }

    // Get existing application to preserve existing documents
    const existingApp = await prisma.ethicsApplication.findUnique({
      where: { id },
      select: { documents: true }
    });

    // Merge existing documents with new uploads
    const allDocuments = [
      ...(existingApp?.documents || []),
      ...uploadedDocuments
    ];

    const application = await prisma.ethicsApplication.update({
      where: { id },
      data: {
        title: data.title,
        principalInvestigator: data.principalInvestigator,
        principalInvestigatorId: data.principalInvestigatorId,
        piInstitution: data.piInstitution,
        department: data.department,
        coInvestigators: data.coInvestigators,
        researchType: data.researchType,
        researchTypeOther: data.researchTypeOther,
        researchSummary: data.researchSummary,
        researchObjectives: data.researchObjectives,
        methodology: data.methodology,
        studyDuration: data.studyDuration,
        startDate: data.startDate,
        endDate: data.endDate,
        participantPopulation: data.participantPopulation,
        participantCount: data.participantCount,
        ageRange: data.ageRange,
        inclusionCriteria: data.inclusionCriteria,
        exclusionCriteria: data.exclusionCriteria,
        recruitmentMethod: data.recruitmentMethod,
        vulnerablePopulations: data.vulnerablePopulations,
        vulnerablePopulationDesc: data.vulnerablePopulationDesc,
        powerImbalanceConsiderations: data.powerImbalanceConsiderations,
        riskLevel: data.riskLevel || 'MINIMAL',
        potentialRisks: data.potentialRisks,
        riskMitigation: data.riskMitigation,
        potentialBenefits: data.potentialBenefits,
        riskBenefitRatio: data.riskBenefitRatio,
        consentProcess: data.consentProcess,
        consentCapacityAssessment: data.consentCapacityAssessment,
        withdrawalProcess: data.withdrawalProcess,
        participantCosts: data.participantCosts,
        consentFormAttached: data.consentFormAttached,
        informationSheetAttached: data.informationSheetAttached,
        consentWaiverRequested: data.consentWaiverRequested || false,
        consentWaiverJustification: data.consentWaiverJustification,
        dataCollectionMethods: data.dataCollectionMethods,
        dataStorageMethods: data.dataStorageMethods,
        dataSecurityMeasures: data.dataSecurityMeasures,
        dataRetentionPeriod: data.dataRetentionPeriod,
        dataDisposalProtocol: data.dataDisposalProtocol,
        dataAnonymization: data.dataAnonymization,
        conflictOfInterest: data.conflictOfInterest,
        conflictDetails: data.conflictDetails,
        previousEthicsApproval: data.previousEthicsApproval,
        previousApprovalDetails: data.previousApprovalDetails,
        additionalComments: data.additionalComments,
        dataSharingPlans: data.dataSharingPlans,
        committeeName: data.committeeName,
        documents: allDocuments
      }
    });

    console.log('Database update successful for application:', id);

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
