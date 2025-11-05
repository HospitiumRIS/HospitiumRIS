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

    // Build the collaboration network
    const collaborators = new Map();
    const publicationsList = [];
    const manuscriptsList = [];

    // Process each publication to build the network
    userPublications.forEach(publication => {
      const coAuthors = (publication.authorRelations || [])
        .filter(author => author.userId && author.userId !== currentUserId)
        .map(author => author.userId)
        .filter(id => id); // Filter out null/undefined

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
        .filter(id => id); // Filter out null/undefined
      
      // Include pending invitations as potential collaborators
      const pendingCollaborators = (manuscript.invitations || [])
        .filter(invitation => 
          invitation.invitedUserId && 
          invitation.invitedUserId !== currentUserId && 
          invitation.status === 'PENDING'
        )
        .map(invitation => invitation.invitedUserId)
        .filter(id => id); // Filter out null/undefined
      
      // Include creator if different from current user and not null
      if (manuscript.createdBy && manuscript.createdBy !== currentUserId) {
        manuscriptCollaborators.push(manuscript.createdBy);
      }

      // Combine all collaborators (accepted and pending) and filter out nulls
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

    // This will be set after we potentially add mock data
    let collaboratorIds = [];
    let collaboratorUsers = [];

    // Build the authors list
    const authors = [];

    // Add current user as lead investigator
    authors.push({
      author_id: currentUser.id,
      name: `${currentUser.givenName} ${currentUser.familyName}`,
      specialization: currentUser.researchProfile?.specialization?.join(', ') || 'General Research',
      institution: currentUser.institution?.name || currentUser.foundation?.institutionName || 'Independent Researcher',
      role: 'Lead Investigator/Current User',
      publications_count: userPublications.length,
      manuscripts_count: userManuscripts.length,
      total_collaborations: collaboratorIds.length,
      collaborations: collaboratorIds,
      collaboration_types: {
        publications: userPublications.map(p => p.id),
        manuscripts: userManuscripts.map(m => m.id)
      },
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
        total_collaborations: collaboratorData.collaborationCount,
        collaborations: [currentUserId], // Direct collaboration with current user
        collaboration_types: {
          publications: collaboratorData.publications,
          manuscripts: collaboratorData.manuscripts
        },
        isPending: collaboratorData.isPending || false,
        isLead: false
      });
    });

    // If no real collaborators exist, add mock data for demonstration
    if (authors.length === 1) { // Only the current user exists
      const mockCollaborators = [
        {
          author_id: 'mock-1',
          name: 'Dr. Sarah Johnson',
          specialization: 'Medical Informatics, AI in Healthcare',
          institution: 'University of Nairobi',
          role: 'Senior Researcher',
          publications_count: 12,
          manuscripts_count: 3,
          total_collaborations: 8,
          collaborations: [currentUserId],
          collaboration_types: { publications: ['mock-pub-1', 'mock-pub-2'], manuscripts: ['mock-ms-1'] },
          isPending: false,
          isLead: false
        },
        {
          author_id: 'mock-2',
          name: 'Prof. Michael Chen',
          specialization: 'Biostatistics, Data Science',
          institution: 'Harvard Medical School',
          role: 'Professor',
          publications_count: 25,
          manuscripts_count: 2,
          total_collaborations: 15,
          collaborations: [currentUserId],
          collaboration_types: { publications: ['mock-pub-3'], manuscripts: ['mock-ms-2'] },
          isPending: false,
          isLead: false
        },
        {
          author_id: 'mock-3',
          name: 'Dr. Emily Rodriguez',
          specialization: 'Public Health, Epidemiology',
          institution: 'University of Cape Town',
          role: 'Research Fellow',
          publications_count: 8,
          manuscripts_count: 4,
          total_collaborations: 6,
          collaborations: [currentUserId],
          collaboration_types: { publications: ['mock-pub-7'], manuscripts: ['mock-ms-3', 'mock-ms-4'] },
          isPending: false, // Direct collaborator
          isLead: false
        },
        {
          author_id: 'mock-4',
          name: 'Dr. James Wilson',
          specialization: 'Machine Learning, Clinical Research',
          institution: 'Oxford University',
          role: 'Postdoctoral Researcher',
          publications_count: 15,
          manuscripts_count: 1,
          total_collaborations: 10,
          collaborations: [currentUserId],
          collaboration_types: { publications: ['mock-pub-4', 'mock-pub-5'], manuscripts: [] },
          isPending: false,
          isLead: false
        },
        {
          author_id: 'mock-5',
          name: 'Dr. Maria Silva',
          specialization: 'Telemedicine, Rural Healthcare',
          institution: 'University of São Paulo',
          role: 'Assistant Professor',
          publications_count: 6,
          manuscripts_count: 2,
          total_collaborations: 4,
          collaborations: [currentUserId],
          collaboration_types: { publications: ['mock-pub-6'], manuscripts: ['mock-ms-5'] },
          isPending: false, // Direct collaborator
          isLead: false
        }
      ];

      // Add mock collaborators to the network
      authors.push(...mockCollaborators);
      
      // Add mock collaborators to the collaborators Map for proper collaboration level detection
      mockCollaborators.forEach(collab => {
        collaborators.set(collab.author_id, {
          userId: collab.author_id,
          publications: collab.collaboration_types.publications,
          manuscripts: collab.collaboration_types.manuscripts,
          collaborationCount: collab.total_collaborations,
          isPending: collab.isPending || false
        });
      });
      
      // Add mock publications
      const mockPublications = [
        {
          pub_id: 'mock-pub-1',
          title: 'AI-Driven Diagnostic Tools for Resource-Limited Settings',
          journal: 'Nature Digital Medicine',
          year: 2024,
          abstract: 'Development of machine learning algorithms for medical diagnosis in low-resource environments.',
          co_authors: [currentUserId, 'mock-1']
        },
        {
          pub_id: 'mock-pub-2',
          title: 'Healthcare Data Integration in Sub-Saharan Africa',
          journal: 'JAMA Network Open',
          year: 2023,
          abstract: 'A comprehensive study on integrating healthcare data systems across African countries.',
          co_authors: [currentUserId, 'mock-1', 'mock-2']
        },
        {
          pub_id: 'mock-pub-3',
          title: 'Statistical Methods for Clinical Trial Analysis',
          journal: 'Statistics in Medicine',
          year: 2024,
          abstract: 'Novel statistical approaches for analyzing clinical trial data with missing values.',
          co_authors: [currentUserId, 'mock-2']
        },
        {
          pub_id: 'mock-pub-4',
          title: 'Machine Learning Applications in Healthcare Automation',
          journal: 'IEEE Transactions on Biomedical Engineering',
          year: 2024,
          abstract: 'Comprehensive review of ML applications for automating clinical workflows.',
          co_authors: [currentUserId, 'mock-4']
        },
        {
          pub_id: 'mock-pub-5',
          title: 'Clinical Decision Support Systems in Low-Resource Settings',
          journal: 'The Lancet Digital Health',
          year: 2023,
          abstract: 'Implementation strategies for clinical decision support in resource-limited environments.',
          co_authors: [currentUserId, 'mock-4']
        },
        {
          pub_id: 'mock-pub-6',
          title: 'Telemedicine Infrastructure for Rural Communities',
          journal: 'Journal of Medical Internet Research',
          year: 2024,
          abstract: 'Designing sustainable telemedicine solutions for underserved rural populations.',
          co_authors: [currentUserId, 'mock-5']
        },
        {
          pub_id: 'mock-pub-7',
          title: 'Epidemiological Surveillance Using Digital Health Tools',
          journal: 'Epidemiology',
          year: 2023,
          abstract: 'Leveraging digital health technologies for improved disease surveillance in Africa.',
          co_authors: [currentUserId, 'mock-3']
        }
      ];

      // Add mock manuscripts
      const mockManuscriptsList = [
        {
          manuscript_id: 'mock-ms-1',
          title: 'Telemedicine Implementation in Rural Kenya',
          type: 'Research Article',
          status: 'DRAFT',
          description: 'A collaborative study on implementing telemedicine solutions in rural Kenyan communities.',
          collaborators: [currentUserId, 'mock-1', 'mock-3']
        },
        {
          manuscript_id: 'mock-ms-2',
          title: 'Machine Learning for Pandemic Preparedness',
          type: 'Review Article',
          status: 'UNDER_REVIEW',
          description: 'Comprehensive review of ML applications in pandemic preparedness and response.',
          collaborators: [currentUserId, 'mock-2', 'mock-4']
        },
        {
          manuscript_id: 'mock-ms-3',
          title: 'Public Health Interventions in Resource-Limited Settings',
          type: 'Research Article',
          status: 'DRAFT',
          description: 'Evaluation of public health intervention strategies in low-resource environments.',
          collaborators: [currentUserId, 'mock-3']
        },
        {
          manuscript_id: 'mock-ms-4',
          title: 'Epidemiological Data Analysis Frameworks',
          type: 'Methods Paper',
          status: 'IN_PREPARATION',
          description: 'Novel frameworks for analyzing complex epidemiological datasets.',
          collaborators: [currentUserId, 'mock-3']
        },
        {
          manuscript_id: 'mock-ms-5',
          title: 'Digital Health Solutions for Rural Healthcare Delivery',
          type: 'Review Article',
          status: 'DRAFT',
          description: 'Systematic review of digital health technologies in rural healthcare settings.',
          collaborators: [currentUserId, 'mock-5']
        }
      ];

      publicationsList.push(...mockPublications);
      manuscriptsList.push(...mockManuscriptsList);
    }

    // Fetch all unique collaborators (filter out null/undefined values) - done after mock data
    collaboratorIds = Array.from(collaborators.keys()).filter(id => id && typeof id === 'string');
    
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

    // Calculate collaboration levels
    const collaborationLevels = {
      [currentUserId]: {
        direct: collaboratorIds,
        secondary: []
      }
    };

    // Find secondary collaborations (collaborators of collaborators)
    const secondaryCollaboratorIds = new Set();
    
    for (const collaboratorId of collaboratorIds) {
      if (!collaboratorId) continue; // Skip null/undefined collaborators
      
      const collaboratorPublications = await prisma.publication.findMany({
        where: {
          authorRelations: {
            some: {
              userId: collaboratorId
            }
          }
        },
        include: {
          authorRelations: {
            where: {
              userId: {
                not: currentUserId // Exclude current user
              }
            }
          }
        }
      });

      collaboratorPublications.forEach(pub => {
        (pub.authorRelations || []).forEach(author => {
          if (author.userId && 
              author.userId !== collaboratorId && 
              !collaboratorIds.includes(author.userId)) {
            secondaryCollaboratorIds.add(author.userId);
          }
        });
      });
    }

    // Filter out nulls from secondary collaborator IDs
    const validSecondaryIds = Array.from(secondaryCollaboratorIds).filter(id => id && typeof id === 'string');
    collaborationLevels[currentUserId].secondary = validSecondaryIds;

    // Fetch secondary collaborators if any
    if (validSecondaryIds.length > 0) {
      const secondaryUsers = await prisma.user.findMany({
        where: {
          id: {
            in: validSecondaryIds
          }
        },
        include: {
          researchProfile: true,
          institution: true,
          foundation: true
        }
      });

      secondaryUsers.forEach(user => {
        authors.push({
          author_id: user.id,
          name: `${user.givenName} ${user.familyName}`,
          specialization: user.researchProfile?.specialization?.join(', ') || 'General Research',
          institution: user.institution?.name || user.foundation?.institutionName || 'Independent Researcher',
          role: user.researchProfile?.academicTitle || 'Researcher',
          publications_count: 0, // We don't have exact count for secondary collaborators
          manuscripts_count: 0,
          total_collaborations: 0,
          collaborations: [], // Secondary collaborators don't directly connect to current user
          collaboration_types: {
            publications: [],
            manuscripts: []
          },
          isLead: false
        });
      });
    }

    // Build the response in the same format as the original JSON
    const networkData = {
      network_name: `${currentUser.givenName} ${currentUser.familyName}'s Research Collaboration Network`,
      lead_investigator_id: currentUserId,
      authors: authors,
      publications: publicationsList,
      manuscripts: manuscriptsList,
      collaboration_levels: collaborationLevels,
      metadata: {
        total_publications: userPublications.length,
        total_manuscripts: userManuscripts.length,
        total_collaborators: collaboratorIds.length,
        total_secondary_collaborators: secondaryCollaboratorIds.size,
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
