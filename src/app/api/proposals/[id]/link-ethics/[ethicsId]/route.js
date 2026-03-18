import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// DELETE - Unlink ethics application from proposal
export async function DELETE(request, { params }) {
  try {
    const { id, ethicsId } = params;

    const link = await prisma.proposalEthicsLink.findUnique({
      where: {
        proposalId_ethicsApplicationId: {
          proposalId: id,
          ethicsApplicationId: ethicsId
        }
      }
    });

    if (!link) {
      return NextResponse.json(
        { success: false, error: 'Link not found' },
        { status: 404 }
      );
    }

    await prisma.proposalEthicsLink.delete({
      where: {
        proposalId_ethicsApplicationId: {
          proposalId: id,
          ethicsApplicationId: ethicsId
        }
      }
    });

    return NextResponse.json({
      success: true,
      message: 'Ethics application unlinked successfully'
    });
  } catch (error) {
    console.error('Error unlinking ethics application:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to unlink ethics application' },
      { status: 500 }
    );
  }
}
