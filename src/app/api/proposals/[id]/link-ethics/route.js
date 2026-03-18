import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// POST - Link ethics application to proposal
export async function POST(request, { params }) {
  try {
    const { id } = params;
    const { ethicsApplicationId, linkedBy } = await request.json();

    // Verify proposal exists
    const proposal = await prisma.proposal.findUnique({
      where: { id }
    });

    if (!proposal) {
      return NextResponse.json(
        { success: false, error: 'Proposal not found' },
        { status: 404 }
      );
    }

    // Verify ethics application exists
    const ethicsApplication = await prisma.ethicsApplication.findUnique({
      where: { id: ethicsApplicationId }
    });

    if (!ethicsApplication) {
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
        linkedBy
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
    const { id } = params;

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
