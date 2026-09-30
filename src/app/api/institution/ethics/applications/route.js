import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireInstitutionPortalAccess } from '@/lib/institution-scope';

export async function GET() {
  try {
    const access = await requireInstitutionPortalAccess();
    if (access.error) return access.error;

    const { institution, memberWhere } = access;

    const applications = await prisma.ethicsApplication.findMany({
      where: {
        user: memberWhere,
      },
      include: {
        user: {
          select: {
            id: true,
            givenName: true,
            familyName: true,
            email: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    const formattedApplications = applications.map((app) => ({
      id: app.id,
      applicationNumber: app.applicationNumber,
      title: app.title,
      principalInvestigator: `${app.user.givenName} ${app.user.familyName}`,
      status: app.status,
      submittedDate: app.submittedDate,
      createdAt: app.createdAt,
      updatedAt: app.updatedAt,
    }));

    return NextResponse.json({
      success: true,
      institution: { id: institution.id, name: institution.name },
      applications: formattedApplications,
      count: formattedApplications.length,
    });
  } catch (error) {
    console.error('Error fetching ethics applications:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
