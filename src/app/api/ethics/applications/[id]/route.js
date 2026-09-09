import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { deleteEthicsApplicationFiles, saveEthicsFile, ethicsFileUrl } from '../../../../../lib/ethics-files';

const prisma = new PrismaClient();

const FILE_FIELDS = [
  { field: 'participantInfoSheet', type: 'Participant Information Sheet' },
  { field: 'consentForm', type: 'Consent Form' },
  { field: 'researchProtocol', type: 'Research Protocol' },
  { field: 'recruitmentMaterials', type: 'Recruitment Materials' },
  { field: 'dataCollectionTools', type: 'Data Collection Tools' },
  { field: 'lettersOfSupport', type: 'Letters of Support' },
  { field: 'investigatorCVs', type: 'Investigator CVs' },
];

const REQUIRED_UPDATE_FIELDS = [
  'title',
  'principalInvestigator',
  'department',
  'researchType',
  'researchSummary',
  'researchObjectives',
  'methodology',
  'participantPopulation',
  'riskLevel',
  'potentialRisks',
  'riskMitigation',
  'potentialBenefits',
  'consentProcess',
  'dataCollectionMethods',
  'dataStorageMethods',
  'dataSecurityMeasures',
];

function emptyToNull(value) {
  if (value === undefined || value === '') return null;
  return value;
}

function parseParticipantCount(value) {
  if (value === null || value === undefined || value === '') return null;
  const parsed = parseInt(value, 10);
  return Number.isFinite(parsed) ? parsed : null;
}

function documentKey(doc) {
  return `${doc?.type || ''}::${doc?.originalName || doc?.name || ''}`.toLowerCase();
}

/**
 * Map the comprehensive edit form onto columns that actually exist on EthicsApplication.
 * Extra form fields (piInstitution, coInvestigators, startDate, etc.) are ignored.
 */
function buildEthicsUpdateData(data) {
  const researchType =
    data.researchType === 'Other' && data.researchTypeOther
      ? data.researchTypeOther
      : data.researchType;

  const update = {
    title: data.title,
    principalInvestigator: data.principalInvestigator,
    principalInvestigatorId: emptyToNull(data.principalInvestigatorId),
    department: data.department || data.piDepartment,
    researchType,
    researchSummary: data.researchSummary,
    researchObjectives: data.researchObjectives,
    methodology: data.methodology,
    studyDuration: data.studyDuration != null && data.studyDuration !== '' ? String(data.studyDuration) : null,
    participantPopulation: data.participantPopulation,
    participantCount: parseParticipantCount(data.participantCount),
    ageRange: emptyToNull(data.ageRange),
    inclusionCriteria: emptyToNull(data.inclusionCriteria),
    exclusionCriteria: emptyToNull(data.exclusionCriteria),
    recruitmentMethod: emptyToNull(data.recruitmentMethod),
    vulnerablePopulations: Boolean(data.vulnerablePopulations),
    vulnerablePopulationDesc: emptyToNull(data.vulnerablePopulationDesc),
    riskLevel: data.riskLevel || 'MINIMAL',
    potentialRisks: data.potentialRisks,
    riskMitigation: data.riskMitigation,
    potentialBenefits: data.potentialBenefits,
    riskBenefitRatio: emptyToNull(data.riskBenefitRatio),
    consentProcess: data.consentProcess,
    consentFormAttached: Boolean(data.consentFormAttached),
    informationSheetAttached: Boolean(data.informationSheetAttached),
    consentWaiverRequested: Boolean(data.consentWaiverRequested),
    consentWaiverJustification: emptyToNull(data.consentWaiverJustification),
    dataCollectionMethods: data.dataCollectionMethods,
    dataStorageMethods: data.dataStorageMethods,
    dataSecurityMeasures: data.dataSecurityMeasures,
    dataRetentionPeriod: emptyToNull(data.dataRetentionPeriod),
    dataAnonymization: Boolean(data.dataAnonymization),
    dataSharingPlans: emptyToNull(data.dataSharingPlans),
    committeeName: emptyToNull(data.committeeName),
  };

  for (const key of REQUIRED_UPDATE_FIELDS) {
    if (update[key] == null || update[key] === '') {
      delete update[key];
    }
  }

  return update;
}

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

    const existingApp = await prisma.ethicsApplication.findUnique({
      where: { id },
      select: { documents: true }
    });

    if (!existingApp) {
      return NextResponse.json(
        { success: false, error: 'Ethics application not found' },
        { status: 404 }
      );
    }

    const existingDocuments = Array.isArray(existingApp.documents) ? existingApp.documents : [];
    const existingKeys = new Set(existingDocuments.map(documentKey));
    const uploadedDocuments = [];

    for (const { field, type } of FILE_FIELDS) {
      const files = formData.getAll(field);
      for (const file of files) {
        if (!file || typeof file === 'string' || !file.size) continue;

        const originalName = file.name || 'document';
        if (existingKeys.has(documentKey({ type, originalName }))) {
          continue;
        }

        const { storedName, size } = await saveEthicsFile(id, file);
        const doc = {
          type,
          name: originalName,
          originalName,
          fileName: storedName,
          size,
          mimeType: file.type || 'application/octet-stream',
          url: ethicsFileUrl(id, storedName),
          uploadedAt: new Date().toISOString(),
        };
        uploadedDocuments.push(doc);
        existingKeys.add(documentKey(doc));
      }
    }

    const allDocuments = [...existingDocuments, ...uploadedDocuments];
    const updateData = {
      ...buildEthicsUpdateData(data),
      documents: allDocuments,
    };

    const application = await prisma.ethicsApplication.update({
      where: { id },
      data: updateData,
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

    const isExternalCertificate =
      application.source === 'EXTERNAL_CERTIFICATE' ||
      (Array.isArray(application.documents) &&
        application.documents.some(
          (doc) => doc?.type === 'Ethics Clearance Certificate' || doc?.source === 'EXTERNAL_CERTIFICATE'
        ));

    const canDelete = application.status === 'DRAFT' || isExternalCertificate;

    if (!canDelete) {
      return NextResponse.json(
        { success: false, error: 'Can only delete draft applications or uploaded certificates' },
        { status: 400 }
      );
    }

    await prisma.ethicsApplication.delete({
      where: { id }
    });
    await deleteEthicsApplicationFiles(id);

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
