import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function POST(request, { params }) {
  try {
    const { id: stageId } = await params;
    const body = await request.json();
    const {
      name,
      type,
      config,
      isRequired = true,
      failOnError = true,
      weight = 1,
      errorMessage,
      successMessage
    } = body;

    if (!name || !type || !config) {
      return NextResponse.json(
        { success: false, error: 'Name, type, and config are required' },
        { status: 400 }
      );
    }

    const parameter = await prisma.validationParameter.create({
      data: {
        stageId,
        name,
        type,
        config,
        isRequired,
        failOnError,
        weight,
        errorMessage,
        successMessage
      }
    });

    return NextResponse.json({
      success: true,
      parameter
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating parameter:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create parameter' },
      { status: 500 }
    );
  }
}
