import { NextResponse } from 'next/server';
import prisma from '../../../../../lib/prisma';
import { getAuthenticatedUser } from '../../../../../lib/auth-server';

/**
 * GET /api/training/my/certificates
 * Get current user's training certificates
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

    const certificates = await prisma.trainingCertificate.findMany({
      where: {
        userId: user.id,
      },
      include: {
        training: {
          select: {
            id: true,
            title: true,
            description: true,
            department: true,
            targetGroup: true,
            startDate: true,
            endDate: true,
            institutionId: true,
          },
        },
        registration: {
          select: {
            id: true,
            status: true,
            registeredAt: true,
          },
        },
      },
      orderBy: {
        issuedAt: 'desc',
      },
    });

    // Filter by institution
    const filteredCertificates = certificates.filter(
      cert => cert.training.institutionId === user.primaryInstitution
    );

    return NextResponse.json({
      success: true,
      count: filteredCertificates.length,
      certificates: filteredCertificates,
    });
  } catch (error) {
    console.error('Error fetching user certificates:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
