import { NextResponse } from 'next/server';
import prisma from '../../../../../lib/prisma';
import { getAuthenticatedUser } from '../../../../../lib/auth-server';
import { requireTrainingAdminAccess } from '@/lib/training-admin-server';

/**
 * GET /api/training/[id]/registrations
 * Get all registrations for a training (Admin only)
 */
export async function GET(request, { params }) {
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

    const registrations = await prisma.trainingRegistration.findMany({
      where: { trainingId: id },
      include: {
        user: {
          select: {
            id: true,
            givenName: true,
            familyName: true,
            email: true,
            researchProfile: {
              select: {
                department: true,
                academicTitle: true,
              },
            },
          },
        },
        moduleProgress: {
          include: {
            module: {
              select: {
                id: true,
                title: true,
                order: true,
              },
            },
          },
          orderBy: {
            module: {
              order: 'asc',
            },
          },
        },
        certificate: true,
      },
      orderBy: { registeredAt: 'desc' },
    });

    return NextResponse.json({
      success: true,
      count: registrations.length,
      registrations,
    });
  } catch (error) {
    console.error('Error fetching registrations:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
