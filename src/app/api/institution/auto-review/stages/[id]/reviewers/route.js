import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function POST(request, { params }) {
  try {
    const { id: stageId } = await params;
    const body = await request.json();
    const {
      userId,
      roleId,
      externalEmail,
      externalName,
      isRequired = true,
      order = 0
    } = body;

    if (!roleId) {
      return NextResponse.json(
        { success: false, error: 'Role is required' },
        { status: 400 }
      );
    }

    if (!userId && !externalEmail) {
      return NextResponse.json(
        { success: false, error: 'Either userId or externalEmail is required' },
        { status: 400 }
      );
    }

    const reviewer = await prisma.stageReviewer.create({
      data: {
        stageId,
        userId,
        roleId,
        externalEmail,
        externalName,
        isRequired,
        order,
        invitedAt: externalEmail ? new Date() : null
      },
      include: {
        role: true
      }
    });

    return NextResponse.json({
      success: true,
      reviewer
    }, { status: 201 });
  } catch (error) {
    console.error('Error adding reviewer:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to add reviewer' },
      { status: 500 }
    );
  }
}

export async function GET(request, { params }) {
  try {
    const { id: stageId } = await params;

    const reviewers = await prisma.stageReviewer.findMany({
      where: { stageId },
      include: {
        role: true
      },
      orderBy: { order: 'asc' }
    });

    return NextResponse.json({
      success: true,
      reviewers
    });
  } catch (error) {
    console.error('Error fetching reviewers:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch reviewers' },
      { status: 500 }
    );
  }
}
