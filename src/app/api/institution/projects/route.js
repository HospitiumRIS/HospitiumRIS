import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import {
  requireInstitutionPortalAccess,
  getInstitutionProposalScopeWhere,
  withDateFilter,
} from '@/lib/institution-scope';

export async function GET() {
  try {
    const access = await requireInstitutionPortalAccess();
    if (access.error) return access.error;

    const { institution, memberIds } = access;
    const proposalScopeWhere = await getInstitutionProposalScopeWhere(institution, memberIds);

    const proposals = await prisma.proposal.findMany({
      where: withDateFilter(
        {
          ...proposalScopeWhere,
          status: {
            in: ['APPROVED', 'UNDER_REVIEW', 'SUBMITTED'],
          },
        },
        {}
      ),
      orderBy: {
        createdAt: 'desc',
      },
    });

    const projects = proposals.map((proposal) => {
      let projectStatus = 'ONGOING';

      if (proposal.status === 'APPROVED') {
        const now = new Date();
        const endDate = proposal.endDate ? new Date(proposal.endDate) : null;
        const startDate = proposal.startDate ? new Date(proposal.startDate) : null;

        if (endDate && now > endDate) {
          projectStatus = 'COMPLETED';
        } else if (endDate) {
          const daysUntilEnd = Math.ceil((endDate - now) / (1000 * 60 * 60 * 24));
          const milestoneProgress =
            proposal.milestones && proposal.milestones.length > 0
              ? (proposal.milestones.filter((m) => m.completed).length / proposal.milestones.length) * 100
              : 0;
          const percentComplete =
            startDate && endDate
              ? Math.min(100, Math.max(0, ((now - startDate) / (endDate - startDate)) * 100))
              : 0;

          if (percentComplete > 80 && milestoneProgress < 60) {
            projectStatus = 'DELAYED';
          } else if (daysUntilEnd < 30 && milestoneProgress < 70) {
            projectStatus = 'AT_RISK';
          }
        }
      } else if (proposal.status === 'UNDER_REVIEW' || proposal.status === 'SUBMITTED') {
        projectStatus = 'PENDING_APPROVAL';
      }

      return {
        id: proposal.id,
        title: proposal.title,
        principalInvestigator: proposal.principalInvestigator,
        department: proposal.departments?.[0] || institution.name,
        status: projectStatus,
        proposalStatus: proposal.status,
        startDate: proposal.startDate,
        endDate: proposal.endDate,
        totalBudgetAmount: proposal.totalBudgetAmount,
        milestones: proposal.milestones || [],
        deliverables: proposal.deliverables || [],
        researchObjectives: proposal.researchObjectives,
        methodology: proposal.methodology,
        coInvestigators: proposal.coInvestigators || [],
        fundingSource: proposal.fundingSource,
        fundingInstitution: proposal.fundingInstitution,
        grantNumber: proposal.grantNumber,
        createdAt: proposal.createdAt,
        updatedAt: proposal.updatedAt,
      };
    });

    return NextResponse.json({
      success: true,
      institution: { id: institution.id, name: institution.name },
      projects,
      count: projects.length,
    });
  } catch (error) {
    console.error('Error fetching projects:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch projects',
        message: error.message,
      },
      { status: 500 }
    );
  }
}
