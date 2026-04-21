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

    // Get all institution admins with full institution details
    const institutionAdmins = await prisma.user.findMany({
      where: {
        accountType: 'INSTITUTION_ADMIN'
      },
      include: {
        institution: {
          select: {
            id: true,
            name: true,
            type: true,
            country: true,
            website: true,
            createdAt: true,
            updatedAt: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    return NextResponse.json({
      success: true,
      institutions: institutionAdmins
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
