import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getAuthenticatedUser } from '@/lib/auth-server';

export async function POST(request, { params }) {
  try {
    const user = await getAuthenticatedUser(request);

    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    if (user.accountType !== 'INSTITUTION_ADMIN') {
      return NextResponse.json(
        { error: 'Forbidden - Institution Admin access required' },
        { status: 403 }
      );
    }

    const institution = await prisma.institution.findUnique({
      where: { userId: user.id }
    });

    if (!institution) {
      return NextResponse.json(
        { error: 'No institution found for this admin' },
        { status: 404 }
      );
    }

    const { id } = params;

    const existingDomain = await prisma.verifiedDomain.findFirst({
      where: {
        id,
        institutionId: institution.id
      }
    });

    if (!existingDomain) {
      return NextResponse.json(
        { error: 'Domain not found' },
        { status: 404 }
      );
    }

    if (existingDomain.status === 'VERIFIED') {
      return NextResponse.json(
        { error: 'Domain is already verified' },
        { status: 400 }
      );
    }

    const updatedDomain = await prisma.verifiedDomain.update({
      where: { id },
      data: {
        status: 'VERIFIED',
        verifiedAt: new Date(),
        verifiedBy: user.id
      }
    });

    return NextResponse.json({
      success: true,
      domain: updatedDomain,
      message: 'Domain verified successfully'
    });

  } catch (error) {
    console.error('Error verifying domain:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
