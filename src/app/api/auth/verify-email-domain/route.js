import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { findVerifiedDomainByEmail } from '@/lib/institution-domain';

export async function POST(request) {
  try {
    const { email } = await request.json();

    if (!email || typeof email !== 'string' || !email.includes('@')) {
      return NextResponse.json({
        valid: false,
        message: 'Please enter a valid email address',
      });
    }

    const match = await findVerifiedDomainByEmail(prisma, email);

    if (!match) {
      return NextResponse.json({
        valid: false,
        message: 'Email domain is not a verified domain',
      });
    }

    return NextResponse.json({
      valid: true,
      institutionId: match.institutionId,
      institutionName: match.institution?.name || null,
      domain: match.domain,
      message: match.institution?.name
        ? `Email domain verified for ${match.institution.name}`
        : 'Email domain is verified',
    });
  } catch (error) {
    console.error('Email domain verification error:', error);
    return NextResponse.json(
      { valid: false, message: 'Failed to verify email domain' },
      { status: 500 }
    );
  }
}
