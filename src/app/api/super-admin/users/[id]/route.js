import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getAuthenticatedUser } from '@/lib/auth-server';

// Helper function to check Super Admin access
async function checkSuperAdminAccess(request) {
  try {
    const user = await getAuthenticatedUser(request);
    
    if (!user) {
      return { authorized: false, error: 'Unauthorized' };
    }

    if (user.accountType !== 'SUPER_ADMIN') {
      return { authorized: false, error: 'Insufficient privileges' };
    }

    return { authorized: true, user };
  } catch (error) {
    return { authorized: false, error: 'Authentication error' };
  }
}

// GET - Fetch single user details
export async function GET(request, { params }) {
  try {
    // Check Super Admin access
    const { authorized, error } = await checkSuperAdminAccess(request);
    if (!authorized) {
      return NextResponse.json(
        { success: false, message: error },
        { status: 403 }
      );
    }

    const userId = params.id;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        institution: true,
        foundation: true,
        researchProfile: true,
        _count: {
          select: {
            manuscripts: true,
            publications: true,
            sentInvitations: true,
            receivedInvitations: true,
            notifications: true,
            comments: true,
            createdVersions: true
          }
        }
      }
    });

    if (!user) {
      return NextResponse.json(
        { success: false, message: 'User not found' },
        { status: 404 }
      );
    }

    // Remove sensitive data
    const { passwordHash, emailVerifyToken, ...safeUser } = user;

    return NextResponse.json({
      success: true,
      user: safeUser
    });
  } catch (error) {
    console.error('Error fetching user:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to fetch user', error: error.message },
      { status: 500 }
    );
  }
}

// PATCH - Update user
export async function PATCH(request, { params }) {
  try {
    // Check Super Admin access
    const { authorized, error } = await checkSuperAdminAccess(request);
    if (!authorized) {
      return NextResponse.json(
        { success: false, message: error },
        { status: 403 }
      );
    }

    const userId = params.id;
    const body = await request.json();

    // Validate user exists
    const existingUser = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!existingUser) {
      return NextResponse.json(
        { success: false, message: 'User not found' },
        { status: 404 }
      );
    }

    // Prevent modification of other super admins (optional security measure)
    if (existingUser.accountType === 'SUPER_ADMIN' && body.status === 'SUSPENDED') {
      return NextResponse.json(
        { success: false, message: 'Cannot suspend other super admins' },
        { status: 403 }
      );
    }

    // Only allow specific fields to be updated
    const allowedUpdates = {
      status: body.status,
      emailVerified: body.emailVerified,
      givenName: body.givenName,
      familyName: body.familyName
    };

    // Remove undefined values
    Object.keys(allowedUpdates).forEach(key => 
      allowedUpdates[key] === undefined && delete allowedUpdates[key]
    );

    // Update user
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: allowedUpdates,
      include: {
        institution: true,
        foundation: true,
        researchProfile: true
      }
    });

    // Remove sensitive data
    const { passwordHash, emailVerifyToken, ...safeUser } = updatedUser;

    return NextResponse.json({
      success: true,
      message: 'User updated successfully',
      user: safeUser
    });
  } catch (error) {
    console.error('Error updating user:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to update user', error: error.message },
      { status: 500 }
    );
  }
}

// DELETE - Delete user (with cascade)
export async function DELETE(request, { params }) {
  try {
    // Check Super Admin access
    const { authorized, error } = await checkSuperAdminAccess(request);
    if (!authorized) {
      return NextResponse.json(
        { success: false, message: error },
        { status: 403 }
      );
    }

    const userId = params.id;

    // Validate user exists
    const existingUser = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!existingUser) {
      return NextResponse.json(
        { success: false, message: 'User not found' },
        { status: 404 }
      );
    }

    // Prevent deletion of super admins
    if (existingUser.accountType === 'SUPER_ADMIN') {
      return NextResponse.json(
        { success: false, message: 'Cannot delete super admin accounts' },
        { status: 403 }
      );
    }

    // Delete user (will cascade to related records)
    await prisma.user.delete({
      where: { id: userId }
    });

    return NextResponse.json({
      success: true,
      message: 'User deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting user:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to delete user', error: error.message },
      { status: 500 }
    );
  }
}

