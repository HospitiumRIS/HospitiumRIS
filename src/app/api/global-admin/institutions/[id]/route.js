import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { getAuthenticatedUser } from '@/lib/auth-server';

const prisma = new PrismaClient();

export async function PUT(request, { params }) {
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

    const { id } = params;
    const body = await request.json();
    const { givenName, familyName, email, institutionName, institutionType, country, password } = body;

    // Validate required fields
    if (!givenName || !familyName || !email || !institutionName || !country) {
      return NextResponse.json(
        { error: 'All fields except password are required' },
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

    // Validate password if provided
    if (password && password.length < 8) {
      return NextResponse.json(
        { error: 'Password must be at least 8 characters' },
        { status: 400 }
      );
    }

    // Validate institution type
    const validTypes = ['UNIVERSITY', 'RESEARCH_INSTITUTE', 'HOSPITAL', 'GOVERNMENT', 'PRIVATE', 'NON_PROFIT', 'OTHER'];
    const finalType = institutionType && validTypes.includes(institutionType) ? institutionType : 'UNIVERSITY';

    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { id },
      include: { institution: true }
    });

    if (!existingUser) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Check if email is being changed and if it's already in use
    if (email !== existingUser.email) {
      const emailExists = await prisma.user.findUnique({
        where: { email }
      });

      if (emailExists) {
        return NextResponse.json(
          { error: 'Email already in use' },
          { status: 400 }
        );
      }
    }

    // Prepare update data
    const updateData = {
      givenName,
      familyName,
      email
    };

    // Add password hash if password is provided
    if (password) {
      updateData.passwordHash = await bcrypt.hash(password, 10);
    }

    // Update user and institution in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // Update user
      const updatedUser = await tx.user.update({
        where: { id },
        data: updateData
      });

      // Update institution
      const updatedInstitution = await tx.institution.update({
        where: { id: existingUser.institution.id },
        data: {
          name: institutionName,
          type: finalType,
          country: country
        }
      });

      return { user: updatedUser, institution: updatedInstitution };
    });

    return NextResponse.json({
      success: true,
      message: 'Institution admin updated successfully',
      data: {
        id: result.user.id,
        name: `${result.user.givenName} ${result.user.familyName}`,
        email: result.user.email,
        institution: result.institution.name,
        status: result.user.status
      }
    });

  } catch (error) {
    console.error('Error updating institution admin:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
