import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function PUT(request, { params }) {
  try {
    const { id } = await params;
    const body = await request.json();
    const {
      name,
      config,
      isRequired,
      failOnError,
      weight,
      errorMessage,
      successMessage
    } = body;

    const updatedParameter = await prisma.validationParameter.update({
      where: { id },
      data: {
        name,
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
      parameter: updatedParameter
    });
  } catch (error) {
    console.error('Error updating parameter:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update parameter' },
      { status: 500 }
    );
  }
}

export async function DELETE(request, { params }) {
  try {
    const { id } = await params;

    await prisma.validationParameter.delete({
      where: { id }
    });

    return NextResponse.json({
      success: true,
      message: 'Parameter deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting parameter:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete parameter' },
      { status: 500 }
    );
  }
}
