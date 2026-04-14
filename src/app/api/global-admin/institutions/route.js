import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { getAuthenticatedUser } from '@/lib/auth-server';

const prisma = new PrismaClient();

export async function GET(request) {
  try {
    const user = await getAuthenticatedUser(request);
    
    if (!user || user.accountType !== 'GLOBAL_ADMIN') {
      return NextResponse.json(
        { error: 'Unauthorized. Global Admin access required.' },
        { status: 403 }
      );
    }

    // Fetch all institution admins
    const institutionAdmins = await prisma.user.findMany({
      where: {
        accountType: 'INSTITUTION_ADMIN'
      },
      select: {
        id: true,
        givenName: true,
        familyName: true,
        email: true,
        status: true,
        createdAt: true,
        primaryInstitution: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    // Format the data
    const institutions = institutionAdmins.map(admin => ({
      id: admin.id,
      name: `${admin.givenName} ${admin.familyName}`,
      email: admin.email,
      institution: admin.primaryInstitution || 'Not specified',
      status: admin.status,
      createdAt: admin.createdAt
    }));

    return NextResponse.json({
      success: true,
      institutions
    });

  } catch (error) {
    console.error('Error fetching institutions:', error);
    return NextResponse.json(
      { error: 'Failed to fetch institutions' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
