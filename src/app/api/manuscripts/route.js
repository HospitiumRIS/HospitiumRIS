import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { getUserId } from '../../../lib/auth-server.js';

const prisma = new PrismaClient();

export async function GET(request) {
    try {
        // Get authenticated user ID
        const userId = await getUserId(request);
        if (!userId) {
            return NextResponse.json(
                { error: 'Authentication required' },
                { status: 401 }
            );
        }

        const { searchParams } = new URL(request.url);
        const search = searchParams.get('search');
        const type = searchParams.get('type');
        const limit = parseInt(searchParams.get('limit')) || 20;
        const offset = parseInt(searchParams.get('offset')) || 0;

        // Build the where clause for filtering
        const where = {
            OR: [
                // User is the creator
                { createdBy: userId },
                // User is a collaborator
                {
                    collaborators: {
                        some: {
                            userId: userId
                        }
                    }
                }
            ]
        };

        // Add search filtering
        if (search) {
            where.AND = [
                {
                    OR: [
                        {
                            title: {
                                contains: search,
                                mode: 'insensitive'
                            }
                        },
                        {
                            description: {
                                contains: search,
                                mode: 'insensitive'
                            }
                        }
                    ]
                }
            ];
        }

        // Add type filtering
        if (type) {
            if (where.AND) {
                where.AND.push({ type: type });
            } else {
                where.AND = [{ type: type }];
            }
        }

        // Get manuscripts with filtering and pagination
    const manuscripts = await prisma.manuscript.findMany({
            where,
            orderBy: {
                updatedAt: 'desc'
            },
            take: limit,
            skip: offset,
            include: {
                creator: {
                    select: {
                        id: true,
                        givenName: true,
                        familyName: true,
                        email: true,
                        orcidId: true
                    }
                },
                collaborators: {
                    select: {
                        user: {
                            select: {
                                id: true,
                                givenName: true,
                                familyName: true,
                                email: true,
                                orcidId: true
                            }
                        },
                        role: true
                    }
                },
                invitations: {
                    where: {
                        status: 'PENDING'
                    },
                    select: {
                        id: true,
                        givenName: true,
                        familyName: true,
                        email: true,
                        role: true
                    }
                }
            }
        });

        // Get total count for pagination
        const totalCount = await prisma.manuscript.count({ where });

        // Transform the data to match the expected format
    const transformedManuscripts = manuscripts.map(manuscript => {
        // Process creator information
        const creatorName = manuscript.creator ? 
            `${manuscript.creator.givenName || ''} ${manuscript.creator.familyName || ''}`.trim() || manuscript.creator.email || 'Unknown Creator' : 
            'Unknown Creator';

        // Process collaborators (excluding creator if they're also in collaborators)
        const processedCollaborators = manuscript.collaborators.map(collab => {
            const user = collab.user;
            const fullName = `${user.givenName || ''} ${user.familyName || ''}`.trim() || user.email || 'Unknown User';
            return {
                id: user.id,
                name: fullName,
                role: collab.role,
                avatar: fullName.split(' ').map(n => n.charAt(0)).join('').toUpperCase().slice(0, 2),
                isCreator: user.id === manuscript.createdBy
            };
        });

        // Process pending invitations
        const pendingInvitationsList = manuscript.invitations.map(invitation => ({
            id: invitation.id,
            givenName: invitation.givenName,
            familyName: invitation.familyName,
            email: invitation.email,
            role: invitation.role || 'CONTRIBUTOR'
        }));

        return {
            ...manuscript,
            creator: {
                id: manuscript.creator?.id,
                name: creatorName,
                givenName: manuscript.creator?.givenName,
                familyName: manuscript.creator?.familyName,
                email: manuscript.creator?.email
            },
            collaborators: processedCollaborators,
            pendingInvitationsList,
            pendingInvitations: pendingInvitationsList.length,
            authors: [creatorName, ...processedCollaborators.map(c => c.name)].join(', '),
            lastUpdated: manuscript.updatedAt.toISOString(),
            collaboratorCount: processedCollaborators.length,
            totalCollaborators: processedCollaborators.length
        };
    });

    return NextResponse.json({
      success: true,
            manuscripts: transformedManuscripts,
            pagination: {
                total: totalCount,
                limit,
                offset,
                hasMore: offset + limit < totalCount
            }
    });

  } catch (error) {
    console.error('Error fetching manuscripts:', error);
    return NextResponse.json(
            { error: 'Failed to fetch manuscripts' },
      { status: 500 }
    );
    } finally {
        await prisma.$disconnect();
    }
}

export async function POST(request) {
  try {
    const userId = await getUserId(request);
    if (!userId) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { title, type, field, description } = body;

    // Validate required fields
    if (!title || !type) {
      return NextResponse.json(
        { error: 'Title and type are required' },
        { status: 400 }
      );
    }

    // Create the manuscript
    const manuscript = await prisma.manuscript.create({
      data: {
        title: title.trim(),
        type: type,
        field: field?.trim() || null,
        description: description?.trim() || null,
        status: 'DRAFT',
        createdBy: userId,
        content: '', // Initialize with empty content
        wordCount: 0
      },
      include: {
        creator: {
          select: {
            id: true,
            givenName: true,
            familyName: true,
            email: true,
            orcidId: true
          }
        },
        collaborators: {
          include: {
            user: {
              select: {
                id: true,
                givenName: true,
                familyName: true,
                email: true,
                orcidId: true
              }
            }
          }
        }
      }
    });

    // Transform the response to match expected format
    const transformedManuscript = {
      ...manuscript,
      authors: manuscript.collaborators
        .map(collab => {
          const user = collab.user;
          const fullName = `${user.givenName || ''} ${user.familyName || ''}`.trim();
          return fullName || user.email;
        })
        .join(', ') || 'Unknown',
      lastUpdated: manuscript.updatedAt.toISOString().split('T')[0],
      collaboratorCount: manuscript.collaborators.length
    };

    return NextResponse.json({
      success: true,
      data: {
        manuscript: transformedManuscript
      },
      message: 'Manuscript created successfully'
    });

  } catch (error) {
    console.error('Error creating manuscript:', error);
    return NextResponse.json(
      { error: 'Failed to create manuscript' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
