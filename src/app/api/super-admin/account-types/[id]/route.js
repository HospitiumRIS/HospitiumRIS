import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { getUserId } from '../../../../../lib/auth-server.js';

const prisma = new PrismaClient();

// PATCH - Update account type
export async function PATCH(request, { params }) {
  try {
    const userId = await getUserId(request);
    
    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Verify user is super admin
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { accountType: true }
    });

    if (!user || user.accountType !== 'SUPER_ADMIN') {
      return NextResponse.json(
        { success: false, error: 'Unauthorized. Super Admin access required.' },
        { status: 403 }
      );
    }

    const { id } = await params;
    const body = await request.json();
    const { displayName, description, permissions, isActive } = body;

    // Check if account type exists
    const accountType = await prisma.accountType.findUnique({
      where: { id }
    });

    if (!accountType) {
      return NextResponse.json(
        { success: false, error: 'Account type not found' },
        { status: 404 }
      );
    }

    // Prevent modification of system roles' core properties
    if (accountType.isSystem && (body.name || body.isSystem === false)) {
      return NextResponse.json(
        { success: false, error: 'Cannot modify system account type name or system status' },
        { status: 400 }
      );
    }

    // Update account type
    const updated = await prisma.accountType.update({
      where: { id },
      data: {
        ...(displayName && { displayName }),
        ...(description !== undefined && { description }),
        ...(permissions && { permissions: JSON.stringify(permissions) }),
        ...(isActive !== undefined && { isActive })
      }
    });

    return NextResponse.json({
      success: true,
      message: 'Account type updated successfully',
      accountType: {
        ...updated,
        permissions: JSON.parse(updated.permissions)
      }
    });
  } catch (error) {
    console.error('Error updating account type:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update account type' },
      { status: 500 }
    );
  }
}

// DELETE - Delete account type
export async function DELETE(request, { params }) {
  try {
    const userId = await getUserId(request);
    
    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Verify user is super admin
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { accountType: true }
    });

    if (!user || user.accountType !== 'SUPER_ADMIN') {
      return NextResponse.json(
        { success: false, error: 'Unauthorized. Super Admin access required.' },
        { status: 403 }
      );
    }

    const { id } = await params;

    // Check if account type exists
    const accountType = await prisma.accountType.findUnique({
      where: { id },
      include: {
        _count: {
          select: { users: true }
        }
      }
    });

    if (!accountType) {
      return NextResponse.json(
        { success: false, error: 'Account type not found' },
        { status: 404 }
      );
    }

    // Prevent deletion of system roles
    if (accountType.isSystem) {
      return NextResponse.json(
        { success: false, error: 'Cannot delete system account types' },
        { status: 400 }
      );
    }

    // Prevent deletion if users are assigned to this account type
    if (accountType._count.users > 0) {
      return NextResponse.json(
        { 
          success: false, 
          error: `Cannot delete account type. ${accountType._count.users} user(s) are assigned to this role.` 
        },
        { status: 400 }
      );
    }

    // Delete account type
    await prisma.accountType.delete({
      where: { id }
    });

    return NextResponse.json({
      success: true,
      message: 'Account type deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting account type:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete account type' },
      { status: 500 }
    );
  }
}
