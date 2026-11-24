import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { canAccessEthicsApplication } from '@/lib/ethics-access';
import { forbidden, notFound, proposalReviewContext } from '@/lib/review-access-server';

// POST - Link ethics application to proposal
export async function POST(request, { params }) {
  try {
    const { id } = await params;
    const ctx = await proposalReviewContext(request, id);
    if (ctx.error) return ctx.error;
    if (!ctx.perms.linkEthics) return forbidden('Only the people on this proposal or its research office can link ethics approvals');
    const { ethicsApplicationId } = await request.json().catch(() => ({}));
    if (!ethicsApplicationId) return NextResponse.json({ success: false, error: 'ethicsApplicationId is required' }, { status: 400 });

    // Verify ethics application exists
    const ethicsApplication = await prisma.ethicsApplication.findUnique({
      where: { id: ethicsApplicationId }
    });

    // The ethics application must be one the user can see (their own, or their institution's).
    if (!ethicsApplication || !(await canAccessEthicsApplication(prisma, ctx.user, ethicsApplication))) {
      return NextResponse.json(
        { success: false, error: 'Ethics application not found' },
        { status: 404 }
      );
    }

    // Check if link already exists
    const existingLink = await prisma.proposalEthicsLink.findUnique({
      where: {
        proposalId_ethicsApplicationId: {
          proposalId: id,
          ethicsApplicationId
        }
      }
    });

    if (existingLink) {
      return NextResponse.json(
        { success: false, error: 'Ethics application already linked to this proposal' },
        { status: 400 }
      );
    }

    // Create link
    const link = await prisma.proposalEthicsLink.create({
      data: {
        proposalId: id,
        ethicsApplicationId,
        linkedBy: ctx.user.id
      },
      include: {
        ethicsApplication: true
      }
    });

    return NextResponse.json({
      success: true,
      link,
      message: 'Ethics application linked successfully'
    });
  } catch (error) {
    console.error('Error linking ethics application:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to link ethics application' },
      { status: 500 }
    );
  }
}

// GET - Get linked ethics applications for a proposal
export async function GET(request, { params }) {
  try {
    const { id } = await params;
    const ctx = await proposalReviewContext(request, id);
    if (ctx.error) return ctx.error;
    if (!ctx.perms.read) return notFound('Proposal not found');

    const links = await prisma.proposalEthicsLink.findMany({
      where: { proposalId: id },
      include: {
        ethicsApplication: {
          include: {
            reviews: {
              orderBy: { createdAt: 'desc' },
              take: 1
            }
          }
        }
      },
      orderBy: { linkedDate: 'desc' }
    });

    return NextResponse.json({
      success: true,
      links
    });
  } catch (error) {
    console.error('Error fetching linked ethics applications:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch linked ethics applications' },
      { status: 500 }
    );
  }
}
