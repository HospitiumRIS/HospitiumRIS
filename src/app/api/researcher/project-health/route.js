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

        const projects = [];

        // 1. Get manuscripts (both created and collaborated)
        const manuscripts = await prisma.manuscript.findMany({
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
                ],
                status: {
                    in: ['DRAFT', 'IN_PROGRESS', 'UNDER_REVIEW']
                }
            },
            include: {
                collaborators: {
                    select: {
                        id: true,
                        userId: true,
                        role: true,
                        user: {
                            select: {
                                givenName: true,
                                familyName: true,
                                email: true
                            }
                        }
                    }
                },
                _count: {
                    select: {
                        collaborators: true
                    }
                }
            },
            orderBy: {
                updatedAt: 'desc'
            },
            take: 5
        });

        manuscripts.forEach(manuscript => {
            const daysSinceUpdate = Math.floor((new Date() - new Date(manuscript.updatedAt)) / (1000 * 60 * 60 * 24));
            const daysSinceCreation = Math.floor((new Date() - new Date(manuscript.createdAt)) / (1000 * 60 * 60 * 24));
            
            // Calculate progress based on status and activity
            let progress = 0;
            let status = 'at-risk';
            
            switch(manuscript.status) {
                case 'DRAFT':
                    progress = daysSinceCreation > 30 ? 20 : 35;
                    status = daysSinceUpdate > 14 ? 'at-risk' : daysSinceUpdate > 7 ? 'needs-attention' : 'on-track';
                    break;
                case 'IN_PROGRESS':
                    progress = 60;
                    status = daysSinceUpdate > 7 ? 'needs-attention' : 'on-track';
                    break;
                case 'UNDER_REVIEW':
                    progress = 85;
                    status = 'on-track';
                    break;
                default:
                    progress = 25;
            }

            projects.push({
                id: manuscript.id,
                name: manuscript.title,
                type: 'manuscript',
                status: status,
                progress: progress,
                lastUpdated: manuscript.updatedAt,
                daysSinceUpdate: daysSinceUpdate,
                team: manuscript.collaborators.map(c => ({
                    id: c.userId,
                    name: `${c.user.givenName || ''} ${c.user.familyName || ''}`.trim() || c.user.email,
                    role: c.role,
                    initials: getInitials(c.user.givenName, c.user.familyName, c.user.email)
                })),
                teamSize: manuscript._count.collaborators + 1, // +1 for creator
                link: `/researcher/publications/collaborate?manuscriptId=${manuscript.id}`,
                statusLabel: manuscript.status,
                icon: 'edit',
                color: '#FF6B6B'
            });
        });

        // 2. Get active proposals
        const proposals = await prisma.proposal.findMany({
            where: {
                status: {
                    in: ['DRAFT', 'UNDER_REVIEW', 'APPROVED', 'IN_PROGRESS']
                }
            },
            orderBy: {
                updatedAt: 'desc'
            },
            take: 3,
            select: {
                id: true,
                title: true,
                status: true,
                startDate: true,
                endDate: true,
                updatedAt: true,
                createdAt: true,
                principalInvestigator: true,
                coInvestigators: true
            }
        });

        proposals.forEach(proposal => {
            const daysSinceUpdate = Math.floor((new Date() - new Date(proposal.updatedAt)) / (1000 * 60 * 60 * 24));
            const now = new Date();
            
            let progress = 0;
            let status = 'on-track';
            
            // Calculate progress based on status and timeline
            switch(proposal.status) {
                case 'DRAFT':
                    progress = 25;
                    status = daysSinceUpdate > 14 ? 'at-risk' : 'on-track';
                    break;
                case 'UNDER_REVIEW':
                    progress = 50;
                    status = 'on-track';
                    break;
                case 'APPROVED':
                    progress = 75;
                    status = 'on-track';
                    break;
                case 'IN_PROGRESS':
                    // Calculate based on timeline if dates available
                    if (proposal.startDate && proposal.endDate) {
                        const totalDays = (new Date(proposal.endDate) - new Date(proposal.startDate)) / (1000 * 60 * 60 * 24);
                        const elapsedDays = (now - new Date(proposal.startDate)) / (1000 * 60 * 60 * 24);
                        progress = Math.min(95, Math.max(75, Math.floor((elapsedDays / totalDays) * 100)));
                        
                        // Check if behind schedule
                        const expectedProgress = (elapsedDays / totalDays) * 100;
                        status = progress < expectedProgress - 10 ? 'at-risk' : progress < expectedProgress ? 'needs-attention' : 'on-track';
                    } else {
                        progress = 80;
                        status = daysSinceUpdate > 30 ? 'needs-attention' : 'on-track';
                    }
                    break;
                default:
                    progress = 30;
            }

            // Get team from coInvestigators
            const team = [];
            if (proposal.principalInvestigator) {
                team.push({
                    id: 'pi',
                    name: proposal.principalInvestigator,
                    role: 'PI',
                    initials: getInitials(proposal.principalInvestigator)
                });
            }
            
            if (Array.isArray(proposal.coInvestigators)) {
                proposal.coInvestigators.slice(0, 3).forEach((coInv, idx) => {
                    if (coInv && typeof coInv === 'object') {
                        const name = coInv.name || coInv.email || `Co-I ${idx + 1}`;
                        team.push({
                            id: `co-${idx}`,
                            name: name,
                            role: 'Co-I',
                            initials: getInitials(name)
                        });
                    }
                });
            }

            projects.push({
                id: proposal.id,
                name: proposal.title,
                type: 'proposal',
                status: status,
                progress: progress,
                lastUpdated: proposal.updatedAt,
                daysSinceUpdate: daysSinceUpdate,
                team: team,
                teamSize: team.length,
                link: `/researcher/proposals/${proposal.id}`,
                statusLabel: proposal.status,
                icon: 'assignment',
                color: '#42A5F5'
            });
        });

        // Sort by status priority (at-risk first, then needs-attention, then on-track)
        const statusPriority = { 'at-risk': 1, 'needs-attention': 2, 'on-track': 3 };
        projects.sort((a, b) => {
            if (statusPriority[a.status] !== statusPriority[b.status]) {
                return statusPriority[a.status] - statusPriority[b.status];
            }
            return new Date(b.lastUpdated) - new Date(a.lastUpdated);
        });

        // Calculate summary
        const summary = {
            total: projects.length,
            onTrack: projects.filter(p => p.status === 'on-track').length,
            needsAttention: projects.filter(p => p.status === 'needs-attention').length,
            atRisk: projects.filter(p => p.status === 'at-risk').length,
            avgProgress: projects.length > 0 
                ? Math.floor(projects.reduce((sum, p) => sum + p.progress, 0) / projects.length)
                : 0
        };

        return NextResponse.json({
            success: true,
            projects: projects.slice(0, 8), // Top 8 projects
            summary
        });

    } catch (error) {
        console.error('Error fetching project health:', error);
        return NextResponse.json(
            { error: 'Failed to fetch project health', details: error.message },
            { status: 500 }
        );
    } finally {
        await prisma.$disconnect();
    }
}

// Helper function to get initials from name
function getInitials(firstName, lastName, email) {
    if (firstName && lastName) {
        return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
    } else if (firstName) {
        const parts = firstName.split(' ');
        if (parts.length > 1) {
            return `${parts[0].charAt(0)}${parts[1].charAt(0)}`.toUpperCase();
        }
        return firstName.substring(0, 2).toUpperCase();
    } else if (email) {
        return email.substring(0, 2).toUpperCase();
    }
    return '??';
}
