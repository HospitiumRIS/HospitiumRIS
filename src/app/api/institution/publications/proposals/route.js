import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET() {
  try {
    const proposals = await prisma.proposal.findMany({
      orderBy: { updatedAt: 'desc' }
    });

    const result = proposals.map(p => ({
      id: p.id,
      title: p.title,
      status: p.status,
      principalInvestigator: p.principalInvestigator,
      departments: p.departments || [],
      researchAreas: p.researchAreas || [],
      fundingSource: p.fundingSource,
      totalBudgetAmount: p.totalBudgetAmount,
      milestoneCount: (p.milestones || []).length,
      coInvestigatorCount: (p.coInvestigators || []).length,
      createdAt: p.createdAt,
      updatedAt: p.updatedAt
    }));

    return NextResponse.json({ success: true, proposals: result, count: result.length });
  } catch (error) {
    console.error('Error fetching institution proposals:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch proposals', message: error.message },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
