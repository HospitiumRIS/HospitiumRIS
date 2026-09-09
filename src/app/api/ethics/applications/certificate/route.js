import { NextResponse } from 'next/server';
import prisma from '../../../../../lib/prisma';
import { getAuthenticatedUser } from '../../../../../lib/auth-server';
import {
  saveEthicsFile,
  ethicsFileUrl,
  getFileExtension,
  ETHICS_CERTIFICATE_MAX_BYTES,
  ETHICS_CERTIFICATE_EXTENSIONS,
} from '../../../../../lib/ethics-files';

const RECORDED_NOTE =
  'This record was created by uploading an existing ethics clearance certificate. Full protocol details were not submitted through Hospitium.';

function parseDate(value) {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

export async function POST(request) {
  try {
    const user = await getAuthenticatedUser(request);
    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }
    if (user.accountType !== 'RESEARCHER') {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
    }

    const formData = await request.formData();
    const title = String(formData.get('title') || '').trim();
    const principalInvestigator = String(formData.get('principalInvestigator') || '').trim();
    const department = String(formData.get('department') || '').trim() || 'Not specified';
    const researchType = String(formData.get('researchType') || '').trim() || 'Not specified';
    const committeeName = String(formData.get('committeeName') || '').trim();
    const referenceNumber = String(formData.get('referenceNumber') || '').trim();
    const approvalDate = parseDate(formData.get('approvalDate'));
    const expiryDate = parseDate(formData.get('expiryDate'));
    const file = formData.get('certificate');

    if (!title) {
      return NextResponse.json({ success: false, error: 'Study title is required' }, { status: 400 });
    }
    if (!principalInvestigator) {
      return NextResponse.json(
        { success: false, error: 'Principal investigator is required' },
        { status: 400 }
      );
    }
    if (!committeeName) {
      return NextResponse.json(
        { success: false, error: 'Issuing ethics committee is required' },
        { status: 400 }
      );
    }
    if (!referenceNumber) {
      return NextResponse.json(
        { success: false, error: 'Certificate / protocol reference number is required' },
        { status: 400 }
      );
    }
    if (!approvalDate) {
      return NextResponse.json({ success: false, error: 'Approval date is required' }, { status: 400 });
    }
    if (expiryDate && expiryDate < approvalDate) {
      return NextResponse.json(
        { success: false, error: 'Expiry date must be on or after the approval date' },
        { status: 400 }
      );
    }
    if (!file || typeof file === 'string' || !file.size) {
      return NextResponse.json(
        { success: false, error: 'Please attach the ethics clearance certificate' },
        { status: 400 }
      );
    }
    if (file.size > ETHICS_CERTIFICATE_MAX_BYTES) {
      return NextResponse.json(
        { success: false, error: 'Certificate file must be 15MB or smaller' },
        { status: 400 }
      );
    }

    const extension = getFileExtension(file.name);
    if (!ETHICS_CERTIFICATE_EXTENSIONS.includes(extension)) {
      return NextResponse.json(
        { success: false, error: 'Certificate must be a PDF or image (PDF, PNG, JPG, WEBP)' },
        { status: 400 }
      );
    }

    const now = new Date();
    const expired = expiryDate && expiryDate < now;
    const status = expired ? 'EXPIRED' : 'APPROVED';

    let application;
    try {
      application = await prisma.ethicsApplication.create({
        data: {
          userId: user.id,
          title,
          principalInvestigator,
          principalInvestigatorId: user.id,
          department,
          researchType,
          researchSummary: RECORDED_NOTE,
          researchObjectives: RECORDED_NOTE,
          methodology: RECORDED_NOTE,
          participantPopulation: RECORDED_NOTE,
          riskLevel: 'MINIMAL',
          potentialRisks: RECORDED_NOTE,
          riskMitigation: RECORDED_NOTE,
          potentialBenefits: RECORDED_NOTE,
          consentProcess: RECORDED_NOTE,
          dataCollectionMethods: RECORDED_NOTE,
          dataStorageMethods: RECORDED_NOTE,
          dataSecurityMeasures: RECORDED_NOTE,
          status,
          referenceNumber,
          committeeName,
          submittedDate: now,
          approvalDate,
          expiryDate,
          documents: [],
        },
      });
    } catch (error) {
      if (error?.code === 'P2002') {
        return NextResponse.json(
          {
            success: false,
            error: 'An ethics record with this reference number already exists',
          },
          { status: 409 }
        );
      }
      throw error;
    }

    try {
      await prisma.$executeRaw`
        UPDATE "ethics_applications"
        SET "source" = 'EXTERNAL_CERTIFICATE'
        WHERE "id" = ${application.id}
      `;
    } catch (sourceError) {
      console.warn('Could not set ethics source column; run the latest Prisma migration.', sourceError);
    }

    const { storedName, size } = await saveEthicsFile(application.id, file);
    const documents = [
      {
        type: 'Ethics Clearance Certificate',
        name: file.name,
        originalName: file.name,
        fileName: storedName,
        size,
        mimeType: file.type || 'application/octet-stream',
        url: ethicsFileUrl(application.id, storedName),
        uploadedAt: now.toISOString(),
        source: 'EXTERNAL_CERTIFICATE',
      },
    ];

    application = await prisma.ethicsApplication.update({
      where: { id: application.id },
      data: { documents },
    });

    return NextResponse.json(
      { success: true, application: { ...application, source: 'EXTERNAL_CERTIFICATE' } },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error uploading ethics clearance certificate:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to upload ethics clearance certificate' },
      { status: 500 }
    );
  }
}
