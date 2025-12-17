import { NextResponse } from 'next/server';
import prisma from '../../../../../lib/prisma';

/**
 * GET /api/researcher/profile/[id]
 * Fetch public researcher profile data by ID
 */
export async function GET(request, { params }) {
  try {
    const { id } = await params;

    if (!id) {
      return NextResponse.json(
        { error: 'Researcher ID is required' },
        { status: 400 }
      );
    }

    // Fetch user with research profile, manuscripts, and publications
    const userProfile = await prisma.user.findUnique({
      where: { id },
      include: {
        researchProfile: true,
        institution: true,
        manuscripts: {
          orderBy: { createdAt: 'desc' },
          select: {
            id: true,
            title: true,
            type: true,
            field: true,
            status: true,
            description: true,
            wordCount: true,
            createdAt: true,
            updatedAt: true,
            _count: {
              select: {
                collaborators: true,
                citations: true,
              }
            }
          },
        },
        publications: {
          include: {
            publication: true
          }
        },
        _count: {
          select: {
            manuscripts: true,
          },
        },
      },
    });

    if (!userProfile) {
      return NextResponse.json(
        { error: 'Researcher not found' },
        { status: 404 }
      );
    }

    // Fetch proposals by this researcher
    const proposals = await prisma.proposal.findMany({
      where: {
        principalInvestigator: {
          contains: `${userProfile.givenName} ${userProfile.familyName}`,
          mode: 'insensitive',
        },
      },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        title: true,
        status: true,
        researchAreas: true,
        totalBudgetAmount: true,
        fundingSource: true,
        startDate: true,
        endDate: true,
        createdAt: true,
        updatedAt: true,
      }
    });

    // Get collaborations with details
    const collaborations = await prisma.manuscriptCollaborator.findMany({
      where: { userId: id },
      include: {
        manuscript: {
          select: {
            id: true,
            title: true,
            status: true,
            createdAt: true,
          }
        }
      },
      orderBy: { joinedAt: 'desc' },
    });

    // Calculate manuscript status breakdown
    const manuscriptStatusBreakdown = {
      DRAFT: 0,
      IN_REVIEW: 0,
      UNDER_REVISION: 0,
      PUBLISHED: 0,
      ARCHIVED: 0,
    };
    userProfile.manuscripts.forEach(m => {
      if (manuscriptStatusBreakdown[m.status] !== undefined) {
        manuscriptStatusBreakdown[m.status]++;
      }
    });

    // Calculate proposal status breakdown
    const proposalStatusBreakdown = {
      DRAFT: 0,
      SUBMITTED: 0,
      UNDER_REVIEW: 0,
      APPROVED: 0,
      REJECTED: 0,
      REVISION_REQUESTED: 0,
    };
    proposals.forEach(p => {
      if (proposalStatusBreakdown[p.status] !== undefined) {
        proposalStatusBreakdown[p.status]++;
      }
    });

    // Build activity timeline (recent 20 activities)
    const activityTimeline = [];
    
    // Add manuscripts to timeline
    userProfile.manuscripts.forEach(m => {
      activityTimeline.push({
        id: m.id,
        type: 'manuscript',
        action: m.status === 'DRAFT' ? 'created' : m.status === 'PUBLISHED' ? 'published' : 'updated',
        title: m.title,
        status: m.status,
        date: m.updatedAt,
        metadata: {
          wordCount: m.wordCount,
          collaborators: m._count.collaborators,
          citations: m._count.citations,
        }
      });
    });

    // Add proposals to timeline
    proposals.forEach(p => {
      activityTimeline.push({
        id: p.id,
        type: 'proposal',
        action: p.status === 'APPROVED' ? 'approved' : p.status === 'SUBMITTED' ? 'submitted' : 'updated',
        title: p.title,
        status: p.status,
        date: p.updatedAt,
        metadata: {
          budget: p.totalBudgetAmount,
          fundingSource: p.fundingSource,
        }
      });
    });

    // Sort timeline by date
    activityTimeline.sort((a, b) => new Date(b.date) - new Date(a.date));

    // Calculate yearly output for the last 3 years
    const currentYear = new Date().getFullYear();
    const yearlyOutput = [];
    for (let year = currentYear - 2; year <= currentYear; year++) {
      const manuscriptsThisYear = userProfile.manuscripts.filter(m => 
        new Date(m.createdAt).getFullYear() === year
      ).length;
      const proposalsThisYear = proposals.filter(p => 
        new Date(p.createdAt).getFullYear() === year
      ).length;
      const publicationsThisYear = userProfile.publications.filter(p => 
        p.publication?.year === year
      ).length;
      
      yearlyOutput.push({
        year,
        manuscripts: manuscriptsThisYear,
        proposals: proposalsThisYear,
        publications: publicationsThisYear,
        total: manuscriptsThisYear + proposalsThisYear + publicationsThisYear,
      });
    }

    // Format publications from relation
    const formattedPublications = userProfile.publications.map(pa => ({
      id: pa.publication.id,
      title: pa.publication.title,
      authors: pa.publication.authors?.join(', ') || '',
      journal: pa.publication.journal,
      year: pa.publication.year,
      doi: pa.publication.doi,
      citationCount: pa.publication.citationCount || 0,
      type: pa.publication.type,
      isCorresponding: pa.isCorresponding,
      authorOrder: pa.authorOrder,
    }));

    const proposalCount = proposals.length;
    const collaborationsCount = collaborations.length;

    // Prepare profile data (public view - no sensitive data)
    const profile = {
      id: userProfile.id,
      givenName: userProfile.givenName,
      familyName: userProfile.familyName,
      email: userProfile.email,
      orcidId: userProfile.orcidId,
      primaryInstitution: userProfile.primaryInstitution,
      createdAt: userProfile.createdAt,
      researchProfile: userProfile.researchProfile ? {
        academicTitle: userProfile.researchProfile.academicTitle,
        department: userProfile.researchProfile.department,
        biography: userProfile.researchProfile.biography,
        researchInterests: userProfile.researchProfile.researchInterests,
        specialization: userProfile.researchProfile.specialization || [],
        keywords: userProfile.researchProfile.keywords || [],
        hIndex: userProfile.researchProfile.hIndex,
        citationCount: userProfile.researchProfile.citationCount,
        website: userProfile.researchProfile.website,
        linkedin: userProfile.researchProfile.linkedin,
        twitter: userProfile.researchProfile.twitter,
        googleScholar: userProfile.researchProfile.googleScholar,
      } : null,
    };

    // Calculate stats
    const stats = {
      manuscripts: userProfile._count.manuscripts,
      publications: userProfile.publications.length,
      proposals: proposalCount,
      collaborations: collaborationsCount,
      totalCitations: formattedPublications.reduce((sum, pub) => sum + (pub.citationCount || 0), 0),
    };

    // Fetch ORCID data if ORCID ID exists
    let orcidData = null;
    if (userProfile.orcidId) {
      try {
        const orcidResponse = await fetch(
          `https://pub.orcid.org/v3.0/${userProfile.orcidId}/record`,
          {
            headers: {
              'Accept': 'application/json',
              'User-Agent': 'HospitiumRis/1.0 (https://hospitiumris.com)',
            },
          }
        );

        if (orcidResponse.ok) {
          const orcidRawData = await orcidResponse.json();
          
          // Extract employments
          const employments = orcidRawData.activities?.employments?.['employment-summary'] || [];
          const educations = orcidRawData.activities?.educations?.['education-summary'] || [];
          
          orcidData = {
            employments: employments.map(emp => ({
              role: emp['role-title'] || 'Role not specified',
              organization: emp.organization?.name || 'Organization not specified',
              department: emp['department-name'] || null,
              startDate: emp['start-date'] || null,
              endDate: emp['end-date'] || null,
            })).slice(0, 5),
            educations: educations.map(edu => ({
              degree: edu['role-title'] || 'Degree not specified',
              organization: edu.organization?.name || 'Organization not specified',
              department: edu['department-name'] || null,
              startDate: edu['start-date'] || null,
              endDate: edu['end-date'] || null,
            })).slice(0, 5),
          };
        }
      } catch (orcidError) {
        console.error('Error fetching ORCID data:', orcidError);
      }
    }

    return NextResponse.json({
      success: true,
      profile,
      stats,
      manuscripts: userProfile.manuscripts,
      publications: formattedPublications,
      proposals,
      collaborations: collaborations.map(c => ({
        id: c.id,
        role: c.role,
        joinedAt: c.joinedAt,
        manuscript: c.manuscript,
      })),
      breakdown: {
        manuscriptStatus: manuscriptStatusBreakdown,
        proposalStatus: proposalStatusBreakdown,
        yearlyOutput,
      },
      activityTimeline: activityTimeline.slice(0, 20),
      orcidData,
    });
  } catch (error) {
    console.error('Error fetching researcher profile:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

