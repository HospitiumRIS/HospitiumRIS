import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getAuthenticatedUser } from '@/lib/auth-server';

export async function GET(request) {
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

    const domains = await prisma.verifiedDomain.findMany({
      where: {
        institutionId: institution.id
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    return NextResponse.json({
      success: true,
      domains
    });

  } catch (error) {
    console.error('Error fetching verified domains:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request) {
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

    const body = await request.json();
    const { 
      domain, 
      status, 
      autoApproveUsers, 
      allowedAccountTypes,
      verificationMethod,
      notes 
    } = body;

    if (!domain || !domain.trim()) {
      return NextResponse.json(
        { error: 'Domain is required' },
        { status: 400 }
      );
    }

    const normalizedDomain = domain.toLowerCase().trim();

    const existingDomain = await prisma.verifiedDomain.findFirst({
      where: {
        institutionId: institution.id,
        domain: normalizedDomain
      }
    });

    if (existingDomain) {
      return NextResponse.json(
        { error: 'This domain is already registered for your institution' },
        { status: 400 }
      );
    }

    const verificationToken = Math.random().toString(36).substring(2, 15) + 
                             Math.random().toString(36).substring(2, 15);

    const newDomain = await prisma.verifiedDomain.create({
      data: {
        institutionId: institution.id,
        domain: normalizedDomain,
        status: status || 'PENDING',
        autoApproveUsers: autoApproveUsers || false,
        allowedAccountTypes: allowedAccountTypes || [],
        verificationMethod: verificationMethod || 'MANUAL',
        verificationToken,
        notes: notes || null,
        verifiedBy: status === 'VERIFIED' ? user.id : null,
        verifiedAt: status === 'VERIFIED' ? new Date() : null
      }
    });

    return NextResponse.json({
      success: true,
      domain: newDomain
    });

  } catch (error) {
    console.error('Error creating verified domain:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
