import { NextResponse } from 'next/server';
import prisma from '../../../../../../lib/prisma';
import { getAuthenticatedUser } from '../../../../../../lib/auth-server';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';

/**
 * POST /api/training/[id]/certificates/[regId]
 * Upload certificate for a registration (Admin only)
 */
export async function POST(request, { params }) {
  try {
    const user = await getAuthenticatedUser(request);

    if (!user || user.accountType !== 'RESEARCH_ADMIN') {
      return NextResponse.json(
        { error: 'Unauthorized - Admin access required' },
        { status: 403 }
      );
    }

    const { id, regId } = await params;

    // Check registration exists and belongs to user's institution
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

    if (registration.training.institutionId !== user.primaryInstitution) {
      return NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
      );
    }

    // Check if registration is completed
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

    // Create upload directory if it doesn't exist
    const uploadDir = path.join(process.cwd(), 'uploads', 'training', 'certificates');
    await mkdir(uploadDir, { recursive: true });

    // Generate unique filename
    const timestamp = Date.now();
    const originalName = file.name;
    const fileName = `cert_${registration.userId}_${timestamp}_${originalName.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
    const filePath = path.join(uploadDir, fileName);

    // Save file
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    await writeFile(filePath, buffer);

    // Create or update certificate record
    const certificateUrl = `/uploads/training/certificates/${fileName}`;
    
    const existingCertificate = await prisma.trainingCertificate.findUnique({
      where: { registrationId: regId },
    });

    let certificate;
    if (existingCertificate) {
      certificate = await prisma.trainingCertificate.update({
        where: { id: existingCertificate.id },
        data: {
          certificateUrl,
          uploadedBy: user.id,
          issuedAt: new Date(),
        },
      });
    } else {
      certificate = await prisma.trainingCertificate.create({
        data: {
          trainingId: id,
          userId: registration.userId,
          registrationId: regId,
          certificateUrl,
          uploadedBy: user.id,
        },
      });
    }

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
