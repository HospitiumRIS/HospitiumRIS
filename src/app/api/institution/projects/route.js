import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(request) {
  try {
    // Fetch all proposals that are approved (these become projects)
    const proposals = await prisma.proposal.findMany({
      where: {
        status: {
          in: ['APPROVED', 'UNDER_REVIEW', 'SUBMITTED']
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    // Transform proposals into project format with progress tracking
    const projects = proposals.map(proposal => {
      // Determine project status based on proposal status and dates
      let projectStatus = 'ONGOING';
      
      if (proposal.status === 'APPROVED') {
        const now = new Date();
        const endDate = proposal.endDate ? new Date(proposal.endDate) : null;
        const startDate = proposal.startDate ? new Date(proposal.startDate) : null;
        
        if (endDate && now > endDate) {
          projectStatus = 'COMPLETED';
        } else if (endDate) {
          const daysUntilEnd = Math.ceil((endDate - now) / (1000 * 60 * 60 * 24));
          const totalDays = startDate && endDate ? Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24)) : 365;
          const percentComplete = startDate ? Math.min(100, Math.max(0, ((now - startDate) / (endDate - startDate)) * 100)) : 0;
          
          // Mark as delayed if we're past 80% of timeline but less than 80% complete on milestones
          const milestoneProgress = proposal.milestones && proposal.milestones.length > 0
            ? (proposal.milestones.filter(m => m.completed).length / proposal.milestones.length) * 100
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
        department: proposal.departments?.[0] || 'Unknown',
        status: projectStatus,
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
        updatedAt: proposal.updatedAt
      };
    });

    return NextResponse.json({
      success: true,
      projects,
      count: projects.length
    });

  } catch (error) {
    console.error('Error fetching projects:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to fetch projects',
        message: error.message 
      },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
