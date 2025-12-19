import { NextResponse } from 'next/server';
import prisma from '../../../../../lib/prisma';
import { getAuthenticatedUser } from '../../../../../lib/auth-server';
import { format, startOfYear, endOfYear } from 'date-fns';

export async function GET(request) {
  try {
    const user = await getAuthenticatedUser(request);
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = user.id;

    // Fetch user's publications with all relevant data
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
          },
          orderBy: {
            authorOrder: 'asc'
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

    // Calculate overview metrics
    const totalPublications = publications.length;
    const totalCitations = researchProfile?.citationCount || 0;
    const hIndex = researchProfile?.hIndex || 0;
    const averageCitationsPerPaper = totalPublications > 0 
      ? (totalCitations / totalPublications).toFixed(1) 
      : 0;

    // Calculate publications this year
    const currentYear = new Date().getFullYear();
    const recentPublications = publications.filter(pub => {
      const year = pub.year || (pub.publicationDate ? new Date(pub.publicationDate).getFullYear() : null);
      return year === currentYear;
    }).length;

    // Count under review publications
    const underReview = publications.filter(pub => pub.status === 'DRAFT').length;

    // Mock views and downloads (not in schema)
    const totalViews = totalPublications * 642;
    const totalDownloads = totalPublications * 365;

    // Calculate yearly trend
    const yearlyTrendMap = {};
    publications.forEach(pub => {
      const year = pub.year || (pub.publicationDate ? new Date(pub.publicationDate).getFullYear() : null);
      if (year) {
        if (!yearlyTrendMap[year]) {
          yearlyTrendMap[year] = { year, publications: 0, citations: 0 };
        }
        yearlyTrendMap[year].publications++;
        yearlyTrendMap[year].citations += pub.manuscriptCitations?.length || 0;
      }
    });

    const yearlyTrend = Object.values(yearlyTrendMap).sort((a, b) => a.year - b.year);

    // Format publications for display
    const formattedPublications = publications.map(pub => {
      const year = pub.year || (pub.publicationDate ? new Date(pub.publicationDate).getFullYear() : null);
      const citationCount = pub.manuscriptCitations?.length || 0;
      
      // Format authors list
      const authorsText = pub.authors && pub.authors.length > 0 
        ? pub.authors.join(', ')
        : pub.authorRelations.map(ar => `${ar.user.familyName}, ${ar.user.givenName.charAt(0)}.`).join(', ');

      // Determine status
      let status = 'Published';
      if (pub.status === 'DRAFT') status = 'Draft';
      else if (pub.status === 'PUBLISHED') status = 'Published';

      // Mock impact factor and quartile (not in schema)
      const impactFactor = pub.journal ? (Math.random() * 15 + 3).toFixed(1) : null;
      const quartile = impactFactor > 10 ? 'Q1' : impactFactor > 6 ? 'Q2' : impactFactor > 3 ? 'Q3' : 'Q4';

      return {
        id: pub.id,
        title: pub.title,
        authors: authorsText,
        journal: pub.journal || 'Unknown Journal',
        year: year,
        type: pub.type || 'Article',
        citations: citationCount,
        views: Math.floor(Math.random() * 3000) + 500,
        downloads: Math.floor(Math.random() * 2000) + 300,
        status: status,
        doi: pub.doi,
        impactFactor: impactFactor,
        quartile: quartile,
        abstract: pub.abstract,
        keywords: pub.keywords,
        url: pub.url
      };
    });

    // Analyze top journals
    const journalMap = {};
    publications.forEach(pub => {
      const journal = pub.journal || 'Unknown Journal';
      if (!journalMap[journal]) {
        journalMap[journal] = {
          journal: journal,
          publications: 0,
          totalCitations: 0,
          impactFactor: (Math.random() * 15 + 3).toFixed(1)
        };
      }
      journalMap[journal].publications++;
      journalMap[journal].totalCitations += pub.manuscriptCitations?.length || 0;
    });

    const topJournals = Object.values(journalMap)
      .map(j => ({
        ...j,
        avgCitations: j.publications > 0 ? (j.totalCitations / j.publications).toFixed(1) : 0
      }))
      .sort((a, b) => b.publications - a.publications)
      .slice(0, 10);

    // Analyze collaborators
    const collaboratorMap = {};
    publications.forEach(pub => {
      pub.authorRelations.forEach(ar => {
        if (ar.userId !== userId) {
          const key = ar.userId;
          if (!collaboratorMap[key]) {
            collaboratorMap[key] = {
              name: `${ar.user.givenName} ${ar.user.familyName}`,
              institution: ar.user.institution?.name || 'Unknown Institution',
              publications: 0
            };
          }
          collaboratorMap[key].publications++;
        }
      });
    });

    const collaborators = Object.values(collaboratorMap)
      .sort((a, b) => b.publications - a.publications)
      .slice(0, 10);

    // Get unique years for filter
    const years = [...new Set(publications.map(pub => {
      const year = pub.year || (pub.publicationDate ? new Date(pub.publicationDate).getFullYear() : null);
      return year;
    }).filter(Boolean))].sort((a, b) => b - a);

    // Get unique types for filter
    const types = [...new Set(publications.map(pub => pub.type).filter(Boolean))];

    const publicationsData = {
      overview: {
        totalPublications,
        totalCitations,
        averageCitationsPerPaper: parseFloat(averageCitationsPerPaper),
        hIndex,
        recentPublications,
        underReview,
        totalViews,
        totalDownloads
      },
      yearlyTrend,
      publications: formattedPublications,
      topJournals,
      collaborators,
      filters: {
        years,
        types
      }
    };

    return NextResponse.json(publicationsData);

  } catch (error) {
    console.error('Error fetching publications analytics:', error);
    return NextResponse.json(
      { error: 'Failed to fetch publications analytics' },
      { status: 500 }
    );
  }
}
