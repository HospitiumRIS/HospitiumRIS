import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { getUserId } from '../../../../lib/auth-server.js';

const prisma = new PrismaClient();

// GET - Fetch all account types
export async function GET(request) {
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

    const accountTypes = await prisma.accountType.findMany({
      orderBy: [
        { isSystem: 'desc' },
        { displayName: 'asc' }
      ],
      include: {
        _count: {
          select: { users: true }
        }
      }
    });

    return NextResponse.json({
      success: true,
      accountTypes: accountTypes.map(type => ({
        ...type,
        permissions: JSON.parse(type.permissions),
        userCount: type._count.users
      }))
    });
  } catch (error) {
    console.error('Error fetching account types:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch account types' },
      { status: 500 }
    );
  }
}

// POST - Create new account type
export async function POST(request) {
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

    const body = await request.json();
    const { name, displayName, description, permissions, isActive } = body;

    // Validate required fields
    if (!name || !displayName) {
      return NextResponse.json(
        { success: false, error: 'Name and display name are required' },
        { status: 400 }
      );
    }

    // Check if account type already exists
    const existing = await prisma.accountType.findUnique({
      where: { name }
    });

    if (existing) {
      return NextResponse.json(
        { success: false, error: 'Account type with this name already exists' },
        { status: 400 }
      );
    }

    // Create new account type
    const accountType = await prisma.accountType.create({
      data: {
        name: name.toUpperCase().replace(/\s+/g, '_'),
        displayName,
        description: description || null,
        permissions: JSON.stringify(permissions || []),
        isActive: isActive !== undefined ? isActive : true,
        isSystem: false
      }
    });

    return NextResponse.json({
      success: true,
      message: 'Account type created successfully',
      accountType: {
        ...accountType,
        permissions: JSON.parse(accountType.permissions)
      }
    });
  } catch (error) {
    console.error('Error creating account type:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create account type' },
      { status: 500 }
    );
  }
}
