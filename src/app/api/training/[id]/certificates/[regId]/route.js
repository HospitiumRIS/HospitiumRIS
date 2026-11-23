import { NextResponse } from 'next/server';
import prisma from '../../../../../../lib/prisma';
import { getAuthenticatedUser } from '../../../../../../lib/auth-server';
import { validateTrainingCertificate } from '../../../../../../lib/training-files';
import { requireTrainingAdminAccess } from '@/lib/training-admin-server';
import { storeUploadedCertificate } from '@/lib/training-certificates-server';
import { sniffMatchesExtension } from '@/lib/certificate-bulk-match';

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

    // The content must match the extension (#100): no renamed executables or HTML.
    const head = new Uint8Array(await file.slice(0, 8).arrayBuffer());
    if (!sniffMatchesExtension(head, file.name)) {
      return NextResponse.json({ error: 'The file content does not match its type (PDF, PNG or JPEG expected)' }, { status: 400 });
    }

    const certificate = await storeUploadedCertificate(registration, file, user);

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
