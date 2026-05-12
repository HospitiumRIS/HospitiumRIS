import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search');

    const where = {
      status: 'ACTIVE',
      accountType: {
        in: ['RESEARCHER', 'RESEARCH_ADMIN', 'INSTITUTION_ADMIN']
      }
    };

    if (search) {
      where.OR = [
        { givenName: { contains: search, mode: 'insensitive' } },
        { familyName: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } }
      ];
    }

    const users = await prisma.user.findMany({
      where,
      select: {
        id: true,
        givenName: true,
        familyName: true,
        email: true,
        accountType: true,
        researchProfile: {
          select: {
            department: true,
            position: true
          }
        }
      },
      take: 50,
      orderBy: [
        { familyName: 'asc' },
        { givenName: 'asc' }
      ]
    });

    return NextResponse.json({
      success: true,
      users
    });
  } catch (error) {
    console.error('Error fetching reviewers:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch reviewers' },
      { status: 500 }
    );
  }
}
