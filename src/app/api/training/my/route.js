import { NextResponse } from 'next/server';
import prisma from '../../../../lib/prisma';
import { getAuthenticatedUser } from '../../../../lib/auth-server';

/**
 * GET /api/training/my
 * Get current user's registered trainings
 */
export async function GET(request) {
  try {
    const user = await getAuthenticatedUser(request);

    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const registrations = await prisma.trainingRegistration.findMany({
      where: {
        userId: user.id,
      },
      include: {
        training: {
          include: {
            modules: {
              where: { status: 'ACTIVE' },
              orderBy: { order: 'asc' },
            },
            _count: {
              select: {
                registrations: true,
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
      orderBy: {
        registeredAt: 'desc',
      },
    });

    // Filter by institution and transform data
    const transformedRegistrations = registrations
      .filter(reg => reg.training.institutionId === user.primaryInstitution)
      .map(reg => {
        const completedModules = reg.moduleProgress.filter(p => p.status === 'COMPLETED').length;
        const totalModules = reg.training.modules.length;
        const progressPercentage = totalModules > 0 ? (completedModules / totalModules) * 100 : 0;

        return {
          id: reg.id,
          status: reg.status,
          registeredAt: reg.registeredAt,
          training: {
            id: reg.training.id,
            title: reg.training.title,
            description: reg.training.description,
            department: reg.training.department,
            targetGroup: reg.training.targetGroup,
            location: reg.training.location,
            startDate: reg.training.startDate,
            endDate: reg.training.endDate,
            status: reg.training.status,
            modules: reg.training.modules,
          },
          moduleProgress: reg.moduleProgress,
          progressPercentage,
          completedModules,
          totalModules,
          hasCertificate: !!reg.certificate,
          certificate: reg.certificate,
        };
      });

    return NextResponse.json({
      success: true,
      count: transformedRegistrations.length,
      registrations: transformedRegistrations,
    });
  } catch (error) {
    console.error('Error fetching user trainings:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
