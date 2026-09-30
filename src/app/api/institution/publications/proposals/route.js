import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import {
  requireInstitutionPortalAccess,
  getInstitutionProposalScopeWhere,
} from '@/lib/institution-scope';

export async function GET() {
  try {
    const access = await requireInstitutionPortalAccess();
    if (access.error) return access.error;

    const { institution, memberIds } = access;
    const proposalScopeWhere = await getInstitutionProposalScopeWhere(institution, memberIds);

    const proposals = await prisma.proposal.findMany({
      where: proposalScopeWhere,
      orderBy: { updatedAt: 'desc' },
    });

    const result = proposals.map((p) => ({
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
      updatedAt: p.updatedAt,
    }));

    return NextResponse.json({
      success: true,
      institution: { id: institution.id, name: institution.name },
      proposals: result,
      count: result.length,
    });
  } catch (error) {
    console.error('Error fetching institution proposals:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch proposals', message: error.message },
      { status: 500 }
    );
  }
}
