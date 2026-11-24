import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { autoReviewAccess } from '@/lib/auto-review-access';

/**
 * GET: people who can be assigned as stage reviewers: active members of the caller's
 * institution only (#9; previously every user on the platform, and a 500 from a
 * non-existent `researchProfile.position` field).
 */
export async function GET(request) {
  try {
    const ctx = await autoReviewAccess();
    if (ctx.error) return ctx.error;
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search');

    const where = {
      AND: [ctx.memberWhere],
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
            academicTitle: true
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
