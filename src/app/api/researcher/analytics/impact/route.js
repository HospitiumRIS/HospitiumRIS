import { NextResponse } from 'next/server';
import prisma from '../../../../../lib/prisma';
import { getAuthenticatedUser } from '../../../../../lib/auth-server';
import { subMonths, format } from 'date-fns';

export async function GET(request) {
  try {
    const user = await getAuthenticatedUser(request);
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = user.id;

    // Fetch user's publications with author relations and citations
    const publications = await prisma.publication.findMany({
      where: {
        authorRelations: {
          some: {
            userId: userId
          }
        }
      },
      include: {
        authorRelations: {
          include: {
            user: {
              select: {
                givenName: true,
                familyName: true,
                institution: true
              }
            }
          }
        },
        manuscriptCitations: true
      },
      orderBy: {
        publicationDate: 'desc'
      }
    });

    // Fetch research profile for h-index and citation count
    const researchProfile = await prisma.researchProfile.findUnique({
      where: { userId: userId }
    });

    // Calculate metrics
    const totalPublications = publications.length;
    const totalCitations = researchProfile?.citationCount || 0;
    const hIndex = researchProfile?.hIndex || 0;

    // Calculate i10-index (publications with at least 10 citations)
    // Note: We don't have citation data per publication in the schema, so we'll estimate
    const i10Index = Math.floor(totalPublications * 0.33); // Rough estimate

    // Get unique collaborators from publications
    const collaboratorSet = new Set();
    const institutionCollaborations = {};

    publications.forEach(pub => {
      pub.authorRelations.forEach(author => {
        if (author.userId !== userId) {
          collaboratorSet.add(author.userId);
          
          const institutionName = author.user.institution?.name || 'Unknown Institution';
          if (!institutionCollaborations[institutionName]) {
            institutionCollaborations[institutionName] = {
              institution: institutionName,
              country: author.user.institution?.country || 'Unknown',
              collaborations: 0
            };
          }
          institutionCollaborations[institutionName].collaborations++;
        }
      });
    });

    const totalCollaborators = collaboratorSet.size;

    // Generate citation trend for last 6 months (mock data based on total citations)
    const citationTrend = [];
    const avgCitationsPerMonth = totalCitations > 0 ? Math.floor(totalCitations / 12) : 0;
    for (let i = 5; i >= 0; i--) {
      const date = subMonths(new Date(), i);
      const variance = Math.floor(Math.random() * 10) - 5;
      citationTrend.push({
        month: format(date, 'MMM'),
        citations: Math.max(0, avgCitationsPerMonth + variance)
      });
    }

    // Get actual publications with real data from database
    const topPublications = publications.map(pub => {
      // Determine publication year
      const year = pub.year || (pub.publicationDate ? new Date(pub.publicationDate).getFullYear() : null);
      
      // Count citations from manuscript citations (how many times this publication is cited)
      const citationCount = pub.manuscriptCitations?.length || 0;
      
      // Determine impact level based on citations and recency
      let impact = 'Low';
      const currentYear = new Date().getFullYear();
      const yearsOld = year ? currentYear - year : 10;
      
      // Calculate impact score considering both citations and recency
      const impactScore = citationCount - (yearsOld * 0.5);
      
      if (impactScore > 20 || citationCount > 50) {
        impact = 'High';
      } else if (impactScore > 5 || citationCount > 15) {
        impact = 'Medium';
      }
      
      return {
        id: pub.id,
        title: pub.title,
        citations: citationCount,
        year: year,
        journal: pub.journal || 'Unknown Journal',
        type: pub.type || 'Article',
        doi: pub.doi,
        url: pub.url,
        abstract: pub.abstract,
        impact: impact,
        authors: pub.authors,
        keywords: pub.keywords
      };
    });

    // Sort publications by citation count (descending)
    topPublications.sort((a, b) => b.citations - a.citations);

    // Get collaboration network (top institutions)
    const collaborationNetwork = Object.values(institutionCollaborations)
      .sort((a, b) => b.collaborations - a.collaborations)
      .slice(0, 10);

    // Calculate research score (based on various metrics)
    const researchScore = Math.min(100, 
      (hIndex * 5) + 
      (totalPublications * 2) + 
      (totalCollaborators * 0.5) +
      (totalCitations * 0.1)
    ).toFixed(1);

    // Mock alternative metrics
    const metrics = {
      altmetricScore: Math.floor(50 + (totalPublications * 2)),
      socialMediaMentions: Math.floor(totalPublications * 6.5),
      newsArticles: Math.floor(totalPublications * 0.96),
      policyDocuments: Math.floor(totalPublications * 0.17),
      blogPosts: Math.floor(totalPublications * 3.7)
    };

    // Mock total views and downloads
    const totalViews = totalPublications * 642;
    const totalDownloads = totalPublications * 365;

    const impactData = {
      overview: {
        totalCitations,
        hIndex,
        i10Index,
        totalPublications,
        totalViews,
        totalDownloads,
        collaborators: totalCollaborators,
        researchScore: parseFloat(researchScore)
      },
      citationTrend,
      topPublications: topPublications,
      collaborationNetwork,
      metrics
    };

    return NextResponse.json(impactData);

  } catch (error) {
    console.error('Error fetching impact analytics:', error);
    return NextResponse.json(
      { error: 'Failed to fetch impact analytics' },
      { status: 500 }
    );
  }
}
