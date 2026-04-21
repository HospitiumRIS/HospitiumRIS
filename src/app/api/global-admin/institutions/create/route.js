import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { getAuthenticatedUser } from '@/lib/auth-server';

const prisma = new PrismaClient();

export async function POST(request) {
  try {
    // Check authentication and authorization
    const currentUser = await getAuthenticatedUser();
    
    if (!currentUser) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    if (currentUser.accountType !== 'GLOBAL_ADMIN') {
      return NextResponse.json(
        { error: 'Forbidden - Global Admin access required' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { givenName, familyName, email, institutionName, institutionType, country, password } = body;

    // Validate required fields
    if (!givenName || !familyName || !email || !institutionName || !country || !password) {
      return NextResponse.json(
        { error: 'All fields are required' },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      );
    }

    // Validate password length
    if (password.length < 8) {
      return NextResponse.json(
        { error: 'Password must be at least 8 characters' },
        { status: 400 }
      );
    }

    // Validate and set institution type
    const validTypes = ['UNIVERSITY', 'RESEARCH_INSTITUTE', 'HOSPITAL', 'GOVERNMENT', 'PRIVATE', 'NON_PROFIT', 'OTHER'];
    const finalType = institutionType && validTypes.includes(institutionType) ? institutionType : 'UNIVERSITY';

    // Check if email already exists
    const existingUser = await prisma.user.findUnique({
      where: { email }
    });

    if (existingUser) {
      return NextResponse.json(
        { error: 'Email already exists' },
        { status: 400 }
      );
    }

    // Check if institution already exists
    const existingInstitution = await prisma.institution.findFirst({
      where: { 
        name: {
          equals: institutionName,
          mode: 'insensitive'
        }
      }
    });

    if (existingInstitution) {
      return NextResponse.json(
        { error: 'Institution already exists' },
        { status: 400 }
      );
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 10);

    // Create institution and admin user together (institution requires a user)
    const result = await prisma.$transaction(async (tx) => {
      // Create institution with nested user creation
      const institution = await tx.institution.create({
        data: {
          name: institutionName,
          type: finalType,
          country: country,
          user: {
            create: {
              givenName,
              familyName,
              email,
              passwordHash,
              accountType: 'INSTITUTION_ADMIN',
              status: 'ACTIVE',
              emailVerified: true
            }
          }
        },
        include: {
          user: true
        }
      });

      return { 
        institution, 
        user: institution.user 
      };
    });

    return NextResponse.json({
      success: true,
      message: 'Institution admin created successfully',
      data: {
        id: result.user.id,
        name: `${result.user.givenName} ${result.user.familyName}`,
        email: result.user.email,
        institution: result.institution.name,
        status: result.user.status,
        createdAt: result.user.createdAt
      }
    });

  } catch (error) {
    console.error('Error creating institution admin:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
