import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { getAuthenticatedUser } from '@/lib/auth-server';

const prisma = new PrismaClient();

export async function GET(request) {
  try {
    const user = await getAuthenticatedUser(request);
    
    if (!user || user.accountType !== 'INSTITUTION_ADMIN') {
      return NextResponse.json(
        { error: 'Unauthorized. Institution Admin access required.' },
        { status: 403 }
      );
    }

    // Get all ethics applications for the institution
    const applications = await prisma.ethicsApplication.findMany({
      where: {
        user: {
          institutionId: user.institutionId
        }
      },
      include: {
        user: {
          select: {
            id: true,
            givenName: true,
            familyName: true,
            email: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    // Format the applications
    const formattedApplications = applications.map(app => ({
      id: app.id,
      applicationNumber: app.applicationNumber,
      title: app.title,
      principalInvestigator: `${app.user.givenName} ${app.user.familyName}`,
      status: app.status,
      submittedDate: app.submittedDate,
      createdAt: app.createdAt,
      updatedAt: app.updatedAt
    }));

    return NextResponse.json({
      success: true,
      applications: formattedApplications
    });

  } catch (error) {
    console.error('Error fetching ethics applications:', error);
    return NextResponse.json(
      { error: 'Failed to fetch ethics applications' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
