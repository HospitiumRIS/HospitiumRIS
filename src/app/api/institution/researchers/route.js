import { NextResponse } from 'next/server';
import prisma from '../../../../lib/prisma';
import { getAuthenticatedUser } from '../../../../lib/auth-server';

/**
 * GET /api/institution/researchers
 * Fetch all researchers for institution management
 */
export async function GET(request) {
  try {
    const user = await getAuthenticatedUser(request);

    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Fetch all researchers with their profiles and stats
    const researchers = await prisma.user.findMany({
      where: {
        accountType: 'RESEARCHER'
      },
      include: {
        researchProfile: true,
        manuscripts: {
          select: { 
            id: true,
            status: true,
            createdAt: true,
            updatedAt: true
          }
        },
        publications: {
          select: { 
            id: true,
            publicationId: true,
            publication: {
              select: {
                id: true,
                year: true
              }
            }
          }
        },
        _count: {
          select: {
            manuscripts: true,
            publications: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    // Transform data to include computed fields
    const transformedResearchers = researchers.map(researcher => {
      const activeManuscripts = researcher.manuscripts.filter(
        m => m.status !== 'PUBLISHED' && m.status !== 'REJECTED'
      ).length;

      return {
        id: researcher.id,
        email: researcher.email,
        givenName: researcher.givenName,
        familyName: researcher.familyName,
        fullName: `${researcher.givenName || ''} ${researcher.familyName || ''}`.trim(),
        orcidId: researcher.orcidId,
        primaryInstitution: researcher.primaryInstitution,
        createdAt: researcher.createdAt,
        researchProfile: researcher.researchProfile ? {
          academicTitle: researcher.researchProfile.academicTitle,
          department: researcher.researchProfile.department,
          specialization: researcher.researchProfile.specialization || [],
          hIndex: researcher.researchProfile.hIndex,
          citationCount: researcher.researchProfile.citationCount,
        } : null,
        stats: {
          totalManuscripts: researcher._count.manuscripts,
          activeManuscripts,
          totalPublications: researcher._count.publications,
          totalCitations: researcher.researchProfile?.citationCount || 0,
          hIndex: researcher.researchProfile?.hIndex || 0
        }
      };
    });

    return NextResponse.json({
      success: true,
      count: transformedResearchers.length,
      researchers: transformedResearchers
    });
  } catch (error) {
    console.error('Error fetching researchers:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
