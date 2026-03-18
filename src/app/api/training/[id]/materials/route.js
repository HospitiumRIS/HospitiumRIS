import { NextResponse } from 'next/server';
import prisma from '../../../../../lib/prisma';
import { getAuthenticatedUser } from '../../../../../lib/auth-server';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';

/**
 * GET /api/training/[id]/materials
 * Get training materials (filtered by access level)
 */
export async function GET(request, { params }) {
  try {
    const user = await getAuthenticatedUser(request);

    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { id } = await params;

    // Check training exists and user has access
    const training = await prisma.training.findUnique({
      where: { id },
    });

    if (!training) {
      return NextResponse.json(
        { error: 'Training not found' },
        { status: 404 }
      );
    }

    if (training.institutionId !== user.primaryInstitution) {
      return NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
      );
    }

    // Check if user is registered
    const userRegistration = await prisma.trainingRegistration.findUnique({
      where: {
        trainingId_userId: {
          trainingId: id,
          userId: user.id,
        },
      },
    });

    // Get materials
    const materials = await prisma.trainingMaterial.findMany({
      where: {
        trainingId: id,
      },
      include: {
        module: {
          select: {
            id: true,
            title: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    // Filter based on access level
    const filteredMaterials = materials.filter(material => {
      // Admin sees all
      if (user.accountType === 'RESEARCH_ADMIN') return true;
      // Public materials visible to all
      if (material.accessLevel === 'PUBLIC') return true;
      // Registered-only materials only for registered users
      if (material.accessLevel === 'REGISTERED_ONLY' && userRegistration) return true;
      return false;
    });

    return NextResponse.json({
      success: true,
      materials: filteredMaterials,
    });
  } catch (error) {
    console.error('Error fetching materials:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/training/[id]/materials
 * Upload training material (Admin only)
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

    const { id } = await params;

    // Check training exists and belongs to user's institution
    const training = await prisma.training.findUnique({
      where: { id },
    });

    if (!training) {
      return NextResponse.json(
        { error: 'Training not found' },
        { status: 404 }
      );
    }

    if (training.institutionId !== user.primaryInstitution) {
      return NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
      );
    }

    const formData = await request.formData();
    const file = formData.get('file');
    const name = formData.get('name');
    const moduleId = formData.get('moduleId');
    const accessLevel = formData.get('accessLevel') || 'PUBLIC';

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }

    // Create upload directory if it doesn't exist
    const uploadDir = path.join(process.cwd(), 'uploads', 'training', 'materials');
    await mkdir(uploadDir, { recursive: true });

    // Generate unique filename
    const timestamp = Date.now();
    const originalName = file.name;
    const fileExtension = path.extname(originalName);
    const fileName = `${timestamp}_${originalName.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
    const filePath = path.join(uploadDir, fileName);

    // Save file
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    await writeFile(filePath, buffer);

    // Create database record
    const fileUrl = `/uploads/training/materials/${fileName}`;
    const material = await prisma.trainingMaterial.create({
      data: {
        trainingId: id,
        moduleId: moduleId || null,
        name: name || originalName,
        fileUrl,
        fileType: fileExtension.replace('.', ''),
        accessLevel,
        uploadedBy: user.id,
      },
      include: {
        module: {
          select: {
            id: true,
            title: true,
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      material,
    }, { status: 201 });
  } catch (error) {
    console.error('Error uploading material:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
