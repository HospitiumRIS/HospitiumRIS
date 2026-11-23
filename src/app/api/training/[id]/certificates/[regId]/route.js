import { NextResponse } from 'next/server';
import prisma from '../../../../../../lib/prisma';
import { getAuthenticatedUser } from '../../../../../../lib/auth-server';
import {
  validateTrainingCertificate,
  saveTrainingCertificate,
  deleteTrainingFile,
} from '../../../../../../lib/training-files';
import { requireTrainingAdminAccess } from '@/lib/training-admin-server';
import { auditTraining } from '@/lib/training-audit';
import { notifyTraining } from '@/lib/training-notify';
import { certificateExpiry, verifyUrl } from '@/lib/certificate-issuance';
import { appBaseUrl, ensureCertificateIdentity } from '@/lib/training-certificates-server';

/**
 * POST /api/training/[id]/certificates/[regId]
 * Upload certificate for a registration (Admin only)
 */
export async function POST(request, { params }) {
  try {
    const user = await getAuthenticatedUser(request);

    const { id, regId } = await params;

    const registration = await prisma.trainingRegistration.findUnique({
      where: { id: regId },
      include: {
        training: true,
        user: true,
      },
    });

    if (!registration) {
      return NextResponse.json(
        { error: 'Registration not found' },
        { status: 404 }
      );
    }

    const access = await requireTrainingAdminAccess(user, registration.training);
    if (access.error) return access.error;

    // The certificate is stored against the training in the URL: it must match.
    if (registration.trainingId !== id) {
      return NextResponse.json({ error: 'Registration not found' }, { status: 404 });
    }

    if (registration.status !== 'COMPLETED') {
      return NextResponse.json(
        { error: 'Cannot upload certificate - registration not completed' },
        { status: 400 }
      );
    }

    const formData = await request.formData();
    const file = formData.get('file');

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }

    const validation = validateTrainingCertificate(file);
    if (!validation.ok) {
      return NextResponse.json({ error: validation.error }, { status: 400 });
    }

    const existingCertificate = await prisma.trainingCertificate.findUnique({
      where: { registrationId: regId },
    });

    let certificate;
    if (existingCertificate) {
      certificate = existingCertificate;
    } else {
      certificate = await prisma.trainingCertificate.create({
        data: {
          trainingId: id,
          userId: registration.userId,
          registrationId: regId,
          certificateUrl: '',
          uploadedBy: user.id,
        },
      });
    }

    const { fileUrl } = await saveTrainingCertificate(certificate.id, file, {
      user,
      entityTenantId: registration.training.institutionId,
      registrationUserId: registration.userId,
    });

    if (certificate.certificateUrl && certificate.certificateUrl !== fileUrl) {
      await deleteTrainingFile(certificate.certificateUrl, user);
    }

    const issuedAt = new Date();
    certificate = await prisma.trainingCertificate.update({
      where: { id: certificate.id },
      data: {
        certificateUrl: fileUrl,
        uploadedBy: user.id,
        issuedAt,
        // An upload is a new version of the certificate (#99): valid again, numbered.
        source: 'UPLOADED',
        status: 'ISSUED',
        version: existingCertificate?.certificateUrl ? (existingCertificate.version || 1) + 1 : existingCertificate?.version || 1,
        expiresAt: certificateExpiry(issuedAt, registration.training.certificateValidityMonths),
        revokedAt: null,
        revokedBy: null,
        revokedReason: null,
      },
    });
    certificate = await ensureCertificateIdentity(certificate, registration.training);

    await auditTraining({
      trainingId: id,
      actorId: user.id,
      action: existingCertificate ? 'CERTIFICATE_REPLACED' : 'CERTIFICATE_UPLOADED',
      entityType: 'TrainingCertificate',
      entityId: certificate.id,
      before: existingCertificate ? { certificateUrl: existingCertificate.certificateUrl, issuedAt: existingCertificate.issuedAt } : null,
      after: { certificateUrl: certificate.certificateUrl, registrationId: regId },
    });

    await notifyTraining('CERTIFICATE_ISSUED', {
      userId: registration.userId,
      trainingId: id,
      dedupeKey: `certificate:${certificate.id}:v${certificate.version}:upload`,
      extra: { certificate: { number: certificate.certificateNumber, verifyUrl: verifyUrl(appBaseUrl(), certificate.verificationCode) } },
    });

    return NextResponse.json({
      success: true,
      certificate,
    }, { status: 201 });
  } catch (error) {
    console.error('Error uploading certificate:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
