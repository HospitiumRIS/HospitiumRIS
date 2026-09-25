import { NextResponse } from 'next/server';
import prisma from '../../../../../lib/prisma';
import { getAuthenticatedUser } from '../../../../../lib/auth-server';
import {
  validateTrainingMaterial,
  saveTrainingMaterial,
} from '../../../../../lib/training-files';
import {
  isTrainingAdmin,
  requireTrainingAdminAccess,
  userHasTrainingInstitutionAccess,
} from '@/lib/training-admin-server';

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

    const training = await prisma.training.findUnique({
      where: { id },
    });

    if (!training) {
      return NextResponse.json(
        { error: 'Training not found' },
        { status: 404 }
      );
    }

    const hasAccess = await userHasTrainingInstitutionAccess(user, training.institutionId);

    if (!hasAccess) {
      return NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
      );
    }

    const userRegistration = await prisma.trainingRegistration.findUnique({
      where: {
        trainingId_userId: {
          trainingId: id,
          userId: user.id,
        },
      },
    });

    const materials = await prisma.trainingMaterial.findMany({
      where: { trainingId: id },
      include: {
        module: {
          select: { id: true, title: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    const filteredMaterials = materials.filter((material) => {
      if (isTrainingAdmin(user)) return true;
      if (material.accessLevel === 'PUBLIC') return true;
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

    const { id } = await params;

    const training = await prisma.training.findUnique({
      where: { id },
    });

    if (!training) {
      return NextResponse.json(
        { error: 'Training not found' },
        { status: 404 }
      );
    }

    const access = await requireTrainingAdminAccess(user, training);
    if (access.error) return access.error;

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

    const validation = validateTrainingMaterial(file);
    if (!validation.ok) {
      return NextResponse.json({ error: validation.error }, { status: 400 });
    }

    const originalName = file.name;

    const material = await prisma.trainingMaterial.create({
      data: {
        trainingId: id,
        moduleId: moduleId || null,
        name: name || originalName,
        fileUrl: '',
        fileType: validation.ext,
        accessLevel,
        uploadedBy: user.id,
      },
    });

    const { fileUrl } = await saveTrainingMaterial(material.id, file, {
      user,
      entityTenantId: training.institutionId,
    });

    const updated = await prisma.trainingMaterial.update({
      where: { id: material.id },
      data: { fileUrl },
      include: {
        module: {
          select: { id: true, title: true },
        },
      },
    });

    return NextResponse.json({
      success: true,
      material: updated,
    }, { status: 201 });
  } catch (error) {
    console.error('Error uploading material:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
