import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// GET - List ethics applications
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const userId = searchParams.get('userId');

    const where = {};
    
    if (status) {
      where.status = status;
    }
    
    if (userId) {
      where.userId = userId;
    }

    const applications = await prisma.ethicsApplication.findMany({
      where,
      include: {
        linkedProposals: {
          include: {
            proposal: {
              select: {
                id: true,
                title: true,
                status: true,
              }
            }
          }
        },
        reviews: {
          orderBy: {
            createdAt: 'desc'
          },
          take: 1
        },
        amendments: {
          orderBy: {
            amendmentNumber: 'desc'
          }
        }
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
    console.error('Error fetching ethics applications:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch ethics applications' },
      { status: 500 }
    );
  }
}

// POST - Create new ethics application
export async function POST(request) {
  try {
    const data = await request.json();

    // Map form data to database schema
    const application = await prisma.ethicsApplication.create({
      data: {
        userId: data.userId,
        title: data.title || '',
        principalInvestigator: data.principalInvestigator || data.piOption === 'useProfile' ? 'Current User' : '',
        principalInvestigatorId: data.principalInvestigatorId,
        department: data.piDepartment || 'Not specified',
        researchType: data.researchType || 'Not specified',
        
        // Map comprehensive form fields to schema
        researchSummary: data.laySummary || 'Not provided',
        researchObjectives: data.researchAims || 'Not provided',
        methodology: data.researchProcedures || 'Not provided',
        studyDuration: data.studyDuration?.toString() || null,
        
        // Participant details
        participantPopulation: data.studyPopulation || 'Not specified',
        participantCount: data.sampleSize ? parseInt(data.sampleSize) : null,
        ageRange: null,
        inclusionCriteria: data.inclusionCriteria || null,
        exclusionCriteria: data.exclusionCriteria || null,
        recruitmentMethod: data.recruitmentStrategy || null,
        vulnerablePopulations: data.vulnerablePopulations?.length > 0 && !data.vulnerablePopulations.includes('None'),
        vulnerablePopulationDesc: data.vulnerableGroupJustification || null,
        
        // Risk assessment
        riskLevel: 'MINIMAL', // Default, can be calculated based on risks
        potentialRisks: [data.physicalRisks, data.psychologicalRisks, data.socialRisks].filter(Boolean).join('\n\n') || 'Not specified',
        riskMitigation: data.riskMitigationStrategies || 'Not specified',
        potentialBenefits: [data.directBenefits, data.indirectBenefits].filter(Boolean).join('\n\n') || 'Not specified',
        riskBenefitRatio: data.riskBenefitAnalysis || null,
        
        // Consent process
        consentProcess: data.informedConsentProcess || 'Not specified',
        consentFormAttached: data.consentForm?.length > 0 || false,
        informationSheetAttached: data.participantInfoSheet?.length > 0 || false,
        consentWaiverRequested: false,
        consentWaiverJustification: null,
        
        // Data protection
        dataCollectionMethods: data.dataCollectionMethods || 'Not specified',
        dataStorageMethods: data.dataStorageLocation || 'Not specified',
        dataSecurityMeasures: data.dataStorageSecurity || 'Not specified',
        dataRetentionPeriod: data.dataRetentionPeriod || null,
        dataAnonymization: !!data.anonymizationMethod,
        dataSharingPlans: null,
        
        status: data.status || 'DRAFT',
        committeeName: data.committeeName,
        documents: data.documents || []
      }
    });

    return NextResponse.json({
      success: true,
      application
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating ethics application:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create ethics application' },
      { status: 500 }
    );
  }
}
