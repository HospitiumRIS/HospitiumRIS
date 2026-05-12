import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(request) {
  try {
    const roles = await prisma.reviewerRole.findMany({
      orderBy: { name: 'asc' }
    });

    return NextResponse.json({
      success: true,
      roles
    });
  } catch (error) {
    console.error('Error fetching roles:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch roles' },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    const {
      name,
      type,
      description,
      canApprove = true,
      canReject = true,
      canRequestChange = true,
      canComment = true,
      canOverride = false
    } = body;

    if (!name || !type) {
      return NextResponse.json(
        { success: false, error: 'Name and type are required' },
        { status: 400 }
      );
    }

    const role = await prisma.reviewerRole.create({
      data: {
        name,
        type,
        description,
        canApprove,
        canReject,
        canRequestChange,
        canComment,
        canOverride
      }
    });

    return NextResponse.json({
      success: true,
      role
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating role:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create role' },
      { status: 500 }
    );
  }
}
