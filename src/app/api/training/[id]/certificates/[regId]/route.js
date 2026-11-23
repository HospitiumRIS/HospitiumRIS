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

    certificate = await prisma.trainingCertificate.update({
      where: { id: certificate.id },
      data: {
        certificateUrl: fileUrl,
        uploadedBy: user.id,
        issuedAt: new Date(),
      },
    });

    await auditTraining({
      trainingId: id,
      actorId: user.id,
      action: existingCertificate ? 'CERTIFICATE_REPLACED' : 'CERTIFICATE_UPLOADED',
      entityType: 'TrainingCertificate',
      entityId: certificate.id,
      before: existingCertificate ? { certificateUrl: existingCertificate.certificateUrl, issuedAt: existingCertificate.issuedAt } : null,
      after: { certificateUrl: certificate.certificateUrl, registrationId: regId },
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
