import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { forbidden, proposalReviewContext } from '@/lib/review-access-server';

// DELETE - Unlink ethics application from proposal
export async function DELETE(request, { params }) {
  try {
    const { id, ethicsId } = await params;
    const ctx = await proposalReviewContext(request, id);
    if (ctx.error) return ctx.error;
    if (!ctx.perms.linkEthics) return forbidden('Only the people on this proposal or its research office can unlink ethics approvals');

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
