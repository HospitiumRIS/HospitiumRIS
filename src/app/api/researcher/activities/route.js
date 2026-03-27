import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { getUserId } from '../../../../lib/auth-server.js';

const prisma = new PrismaClient();

export async function GET(request) {
    try {
        const userId = await getUserId(request);
        
        if (!userId) {
            return NextResponse.json(
                { error: 'Authentication required' },
                { status: 401 }
            );
        }

        const { searchParams } = new URL(request.url);
        const limit = parseInt(searchParams.get('limit')) || 10;

        // Fetch recent activities from various sources
        const activities = [];

        // 1. Recent publications added
        const recentPublications = await prisma.publication.findMany({
            where: {
                authorRelations: {
                    some: {
                        userId: userId
                    }
                }
            },
            orderBy: {
                createdAt: 'desc'
            },
            take: 3,
            select: {
                id: true,
                title: true,
                createdAt: true,
                type: true
            }
        });

        recentPublications.forEach(pub => {
            activities.push({
                id: `pub-${pub.id}`,
                type: 'publication',
                title: `Added publication: ${pub.title.substring(0, 50)}${pub.title.length > 50 ? '...' : ''}`,
                description: pub.type || 'Publication',
                timestamp: pub.createdAt,
                icon: 'article',
                color: '#8b6cbc',
                link: `/researcher/publications/${pub.id}`
            });
        });

        // 2. Recent manuscripts created or updated
        const recentManuscripts = await prisma.manuscript.findMany({
            where: {
                OR: [
                    { createdBy: userId },
                    {
                        collaborators: {
                            some: {
                                userId: userId
                            }
                        }
                    }
                ]
            },
            orderBy: {
                updatedAt: 'desc'
            },
            take: 3,
            select: {
                id: true,
                title: true,
                status: true,
                updatedAt: true,
                createdAt: true,
                createdBy: true
            }
        });

        recentManuscripts.forEach(manuscript => {
            const isCreator = manuscript.createdBy === userId;
            const action = isCreator ? 'Created' : 'Collaborated on';
            activities.push({
                id: `manuscript-${manuscript.id}`,
                type: 'manuscript',
                title: `${action} manuscript: ${manuscript.title.substring(0, 50)}${manuscript.title.length > 50 ? '...' : ''}`,
                description: manuscript.status,
                timestamp: manuscript.updatedAt,
                icon: 'edit',
                color: '#FF6B6B',
                link: `/researcher/publications/collaborate?manuscriptId=${manuscript.id}`
            });
        });

        // 3. Recent collaboration invitations
        const recentCollaborations = await prisma.manuscriptCollaborator.findMany({
            where: {
                userId: userId
            },
            orderBy: {
                joinedAt: 'desc'
            },
            take: 3,
            include: {
                manuscript: {
                    select: {
                        id: true,
                        title: true,
                        status: true
                    }
                }
            }
        });

        recentCollaborations.forEach(collab => {
            activities.push({
                id: `collab-${collab.id}`,
                type: 'collaboration',
                title: `Joined collaboration: ${collab.manuscript.title.substring(0, 50)}${collab.manuscript.title.length > 50 ? '...' : ''}`,
                description: `Role: ${collab.role}`,
                timestamp: collab.joinedAt,
                icon: 'group',
                color: '#42A5F5',
                link: `/researcher/publications/collaborate?manuscriptId=${collab.manuscript.id}`
            });
        });

        // 4. Recent proposals
        const recentProposals = await prisma.proposal.findMany({
            orderBy: {
                updatedAt: 'desc'
            },
            take: 2,
            select: {
                id: true,
                title: true,
                status: true,
                updatedAt: true
            }
        });

        recentProposals.forEach(proposal => {
            activities.push({
                id: `proposal-${proposal.id}`,
                type: 'proposal',
                title: `Updated proposal: ${proposal.title.substring(0, 50)}${proposal.title.length > 50 ? '...' : ''}`,
                description: proposal.status,
                timestamp: proposal.updatedAt,
                icon: 'assignment',
                color: '#66BB6A',
                link: `/researcher/proposals/${proposal.id}`
            });
        });

        // Sort all activities by timestamp (most recent first)
        activities.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

        // Take only the requested limit
        const limitedActivities = activities.slice(0, limit);

        // Format timestamps to relative time
        const formattedActivities = limitedActivities.map(activity => ({
            ...activity,
            timeAgo: getTimeAgo(activity.timestamp)
        }));

        return NextResponse.json({
            success: true,
            activities: formattedActivities,
            total: activities.length
        });

    } catch (error) {
        console.error('Error fetching activities:', error);
        return NextResponse.json(
            { error: 'Failed to fetch activities', details: error.message },
            { status: 500 }
        );
    } finally {
        await prisma.$disconnect();
    }
}

// Helper function to calculate relative time
function getTimeAgo(timestamp) {
    const now = new Date();
    const past = new Date(timestamp);
    const diffInSeconds = Math.floor((now - past) / 1000);

    if (diffInSeconds < 60) {
        return 'Just now';
    } else if (diffInSeconds < 3600) {
        const minutes = Math.floor(diffInSeconds / 60);
        return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
    } else if (diffInSeconds < 86400) {
        const hours = Math.floor(diffInSeconds / 3600);
        return `${hours} hour${hours > 1 ? 's' : ''} ago`;
    } else if (diffInSeconds < 604800) {
        const days = Math.floor(diffInSeconds / 86400);
        return `${days} day${days > 1 ? 's' : ''} ago`;
    } else if (diffInSeconds < 2592000) {
        const weeks = Math.floor(diffInSeconds / 604800);
        return `${weeks} week${weeks > 1 ? 's' : ''} ago`;
    } else {
        const months = Math.floor(diffInSeconds / 2592000);
        return `${months} month${months > 1 ? 's' : ''} ago`;
    }
}
