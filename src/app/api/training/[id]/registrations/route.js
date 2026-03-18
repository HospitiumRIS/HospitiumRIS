import { NextResponse } from 'next/server';
import prisma from '../../../../../lib/prisma';
import { getAuthenticatedUser } from '../../../../../lib/auth-server';

/**
 * GET /api/training/[id]/registrations
 * Get all registrations for a training (Admin only)
 */
export async function GET(request, { params }) {
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
