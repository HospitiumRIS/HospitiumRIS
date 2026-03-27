import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import prisma from '@/lib/prisma';

export async function GET(request) {
  try {
    // Check for session cookie
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get('hospitium_session');
    
    if (!sessionCookie?.value) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const currentUserId = sessionCookie.value;

    // Fetch the current user with their profile and institution
    const currentUser = await prisma.user.findUnique({
      where: { id: currentUserId },
      include: {
        researchProfile: true,
        institution: true,
        foundation: true
      }
    });

    if (!currentUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Check if user is still active
    if (currentUser.status !== 'ACTIVE' || !currentUser.emailVerified) {
      return NextResponse.json({ error: 'Account is inactive or not verified' }, { status: 401 });
    }

    // Fetch all publications where the current user is an author
    const userPublications = await prisma.publication.findMany({
      where: {
        authorRelations: {
          some: {
            userId: currentUserId
          }
        }
      },
      include: {
        authorRelations: {
          include: {
            user: {
              include: {
                researchProfile: true,
                institution: true,
                foundation: true
              }
            }
          },
          orderBy: {
            authorOrder: 'asc'
          }
        }
      },
      orderBy: {
        year: 'desc'
      }
    });

    // Fetch all manuscripts where the current user is creator or collaborator
    const userManuscripts = await prisma.manuscript.findMany({
      where: {
        OR: [
          { createdBy: currentUserId },
          {
            collaborators: {
              some: {
                userId: currentUserId
              }
            }
          }
        ]
      },
      include: {
        creator: {
          include: {
            researchProfile: true,
            institution: true,
            foundation: true
          }
        },
        collaborators: {
          include: {
            user: {
              include: {
                researchProfile: true,
                institution: true,
                foundation: true
              }
            }
          }
        },
        invitations: {
          include: {
            invitedUser: {
              include: {
                researchProfile: true,
                institution: true,
                foundation: true
              }
            }
          }
        }
      },
      orderBy: {
        updatedAt: 'desc'
      }
    });

    // Fetch all proposals where the current user is PI or co-investigator
    const userProposals = await prisma.proposal.findMany({
      where: {
        OR: [
          { principalInvestigatorOrcid: currentUser.orcidId },
          { principalInvestigator: `${currentUser.givenName} ${currentUser.familyName}` }
        ]
      },
      orderBy: {
        updatedAt: 'desc'
      }
    });

    // Build the collaboration network
    const collaborators = new Map();
    const publicationsList = [];
    const manuscriptsList = [];
    const proposalsList = [];

    // Process each publication to build the network
    userPublications.forEach(publication => {
      const coAuthors = (publication.authorRelations || [])
        .filter(author => author.userId && author.userId !== currentUserId)
        .map(author => author.userId)
        .filter(id => id);

      publicationsList.push({
        pub_id: publication.id,
        title: publication.title,
        journal: publication.journal,
        year: publication.year,
        abstract: publication.abstract,
        doi: publication.doi,
        url: publication.url,
        publicationType: publication.type,
        keywords: publication.keywords,
        co_authors: [currentUserId, ...coAuthors]
      });

      // Track collaborations from publications
      coAuthors.forEach(coAuthorId => {
        if (coAuthorId && !collaborators.has(coAuthorId)) {
          collaborators.set(coAuthorId, {
            userId: coAuthorId,
            publications: [],
            manuscripts: [],
            proposals: [],
            collaborationCount: 0
          });
        }
        
        if (coAuthorId && collaborators.has(coAuthorId)) {
          const collaborator = collaborators.get(coAuthorId);
          collaborator.publications.push(publication.id);
          collaborator.collaborationCount++;
        }
      });
    });

    // Process each manuscript to build the network (including pending invitations)
    userManuscripts.forEach(manuscript => {
      const manuscriptCollaborators = (manuscript.collaborators || [])
        .filter(collab => collab.userId && collab.userId !== currentUserId)
        .map(collab => collab.userId)
        .filter(id => id);
      
      const pendingCollaborators = (manuscript.invitations || [])
        .filter(invitation => 
          invitation.invitedUserId && 
          invitation.invitedUserId !== currentUserId && 
          invitation.status === 'PENDING'
        )
        .map(invitation => invitation.invitedUserId)
        .filter(id => id);
      
      if (manuscript.createdBy && manuscript.createdBy !== currentUserId) {
        manuscriptCollaborators.push(manuscript.createdBy);
      }

      const allCollaborators = [...new Set([...manuscriptCollaborators, ...pendingCollaborators])].filter(id => id);

      manuscriptsList.push({
        manuscript_id: manuscript.id,
        title: manuscript.title,
        type: manuscript.type,
        field: manuscript.field,
        status: manuscript.status,
        description: manuscript.description,
        wordCount: manuscript.wordCount,
        createdAt: manuscript.createdAt,
        updatedAt: manuscript.updatedAt,
        collaborators: [currentUserId, ...allCollaborators],
        pendingInvitations: pendingCollaborators
      });

      // Track collaborations from manuscripts (including pending)
      allCollaborators.forEach(collaboratorId => {
        if (collaboratorId && !collaborators.has(collaboratorId)) {
          collaborators.set(collaboratorId, {
            userId: collaboratorId,
            publications: [],
            manuscripts: [],
            proposals: [],
            collaborationCount: 0,
            isPending: pendingCollaborators.includes(collaboratorId)
          });
        }
        
        if (collaboratorId && collaborators.has(collaboratorId)) {
          const collaborator = collaborators.get(collaboratorId);
          collaborator.manuscripts.push(manuscript.id);
          collaborator.collaborationCount++;
          if (pendingCollaborators.includes(collaboratorId)) {
            collaborator.isPending = true;
          }
        }
      });
    });

    // Process each proposal to build the network
    userProposals.forEach(proposal => {
      const coInvestigators = (proposal.coInvestigators || [])
        .map(coInv => {
          if (typeof coInv === 'object' && coInv.userId) {
            return coInv.userId;
          }
          return null;
        })
        .filter(id => id && id !== currentUserId);

      proposalsList.push({
        proposal_id: proposal.id,
        title: proposal.title,
        principalInvestigator: proposal.principalInvestigator,
        status: proposal.status,
        researchAreas: proposal.researchAreas,
        startDate: proposal.startDate,
        endDate: proposal.endDate,
        coInvestigators: [currentUserId, ...coInvestigators]
      });

      // Track collaborations from proposals
      coInvestigators.forEach(coInvestigatorId => {
        if (coInvestigatorId && !collaborators.has(coInvestigatorId)) {
          collaborators.set(coInvestigatorId, {
            userId: coInvestigatorId,
            publications: [],
            manuscripts: [],
            proposals: [],
            collaborationCount: 0
          });
        }
        
        if (coInvestigatorId && collaborators.has(coInvestigatorId)) {
          const collaborator = collaborators.get(coInvestigatorId);
          if (!collaborator.proposals) collaborator.proposals = [];
          collaborator.proposals.push(proposal.id);
          collaborator.collaborationCount++;
        }
      });
    });

    // Fetch all unique collaborators
    const collaboratorIds = Array.from(collaborators.keys()).filter(id => id && typeof id === 'string');
    let collaboratorUsers = [];

    if (collaboratorIds.length > 0) {
      collaboratorUsers = await prisma.user.findMany({
        where: {
          id: {
            in: collaboratorIds
          }
        },
        include: {
          researchProfile: true,
          institution: true,
          foundation: true
        }
      });
    }

    // Build the authors list
    const authors = [];

    // Calculate global citations
    const globalCitations = userPublications.reduce((sum, pub) => {
      return sum + (pub.citationCount || 0);
    }, 0);
    
    const hospitiumCitations = userManuscripts.reduce((sum, manuscript) => {
      return sum + (manuscript._count?.citations || 0);
    }, 0);

    // Add current user as lead investigator
    authors.push({
      author_id: currentUser.id,
      name: `${currentUser.givenName} ${currentUser.familyName}`,
      orcidId: currentUser.orcidId || null,
      specialization: currentUser.researchProfile?.specialization?.join(', ') || 'General Research',
      institution: currentUser.institution?.name || currentUser.foundation?.institutionName || 'Independent Researcher',
      role: 'Lead Investigator/Current User',
      publications_count: userPublications.length,
      manuscripts_count: userManuscripts.length,
      proposals_count: userProposals.length,
      total_collaborations: collaboratorIds.length,
      collaborations: collaboratorIds,
      collaboration_types: {
        publications: userPublications.map(p => p.id),
        manuscripts: userManuscripts.map(m => m.id),
        proposals: userProposals.map(p => p.id)
      },
      globalCitations: globalCitations,
      hospitiumCitations: hospitiumCitations,
      isLead: true
    });

    // Add collaborators (including those with pending invitations)
    collaboratorUsers.forEach(user => {
      const collaboratorData = collaborators.get(user.id);
      
      authors.push({
        author_id: user.id,
        name: `${user.givenName} ${user.familyName}`,
        specialization: user.researchProfile?.specialization?.join(', ') || 'General Research',
        institution: user.institution?.name || user.foundation?.institutionName || 'Independent Researcher',
        role: user.researchProfile?.academicTitle || 'Researcher',
        publications_count: collaboratorData.publications.length,
        manuscripts_count: collaboratorData.manuscripts.length,
        proposals_count: collaboratorData.proposals?.length || 0,
        total_collaborations: collaboratorData.collaborationCount,
        collaborations: [currentUserId],
        collaboration_types: {
          publications: collaboratorData.publications,
          manuscripts: collaboratorData.manuscripts,
          proposals: collaboratorData.proposals || []
        },
        isPending: collaboratorData.isPending || false,
        isLead: false
      });
    });

    // Calculate collaboration levels (excluding secondary collaborators as per user requirement)
    const collaborationLevels = {
      [currentUserId]: {
        direct: collaboratorIds,
        secondary: []
      }
    };

    // Build the response
    const networkData = {
      network_name: `${currentUser.givenName} ${currentUser.familyName}'s Research Collaboration Network`,
      lead_investigator_id: currentUserId,
      authors: authors,
      publications: publicationsList,
      manuscripts: manuscriptsList,
      proposals: proposalsList,
      collaboration_levels: collaborationLevels,
      metadata: {
        total_publications: userPublications.length,
        total_manuscripts: userManuscripts.length,
        total_proposals: userProposals.length,
        total_collaborators: collaboratorIds.length,
        generated_at: new Date().toISOString()
      }
    };

    return NextResponse.json(networkData);

  } catch (error) {
    console.error('Error fetching network data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch network data' },
      { status: 500 }
    );
  }
}
