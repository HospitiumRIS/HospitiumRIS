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

        const tasks = [];

        // 1. Tasks from manuscripts in DRAFT status
        const draftManuscripts = await prisma.manuscript.findMany({
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
                status: 'DRAFT'
            },
            select: {
                id: true,
                title: true,
                updatedAt: true,
                createdAt: true
            },
            take: 5
        });

        draftManuscripts.forEach(manuscript => {
            const daysSinceUpdate = Math.floor((new Date() - new Date(manuscript.updatedAt)) / (1000 * 60 * 60 * 24));
            const priority = daysSinceUpdate > 7 ? 'high' : daysSinceUpdate > 3 ? 'medium' : 'low';
            
            tasks.push({
                id: `manuscript-${manuscript.id}`,
                title: `Complete manuscript: ${manuscript.title.substring(0, 40)}${manuscript.title.length > 40 ? '...' : ''}`,
                description: 'Draft manuscript needs completion',
                priority: priority,
                type: 'manuscript',
                dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
                status: 'pending',
                link: `/researcher/publications/collaborate?manuscriptId=${manuscript.id}`,
                icon: 'edit',
                color: '#FF6B6B'
            });
        });

        // 2. Tasks from manuscripts in IN_PROGRESS status
        const inProgressManuscripts = await prisma.manuscript.findMany({
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
                status: 'IN_PROGRESS'
            },
            select: {
                id: true,
                title: true,
                updatedAt: true
            },
            take: 3
        });

        inProgressManuscripts.forEach(manuscript => {
            tasks.push({
                id: `review-${manuscript.id}`,
                title: `Review manuscript: ${manuscript.title.substring(0, 40)}${manuscript.title.length > 40 ? '...' : ''}`,
                description: 'Manuscript in progress needs review',
                priority: 'medium',
                type: 'review',
                dueDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000), // 5 days from now
                status: 'pending',
                link: `/researcher/publications/collaborate?manuscriptId=${manuscript.id}`,
                icon: 'rate_review',
                color: '#8b6cbc'
            });
        });

        // 3. Tasks from proposals in DRAFT status
        const draftProposals = await prisma.proposal.findMany({
            where: {
                status: 'DRAFT'
            },
            select: {
                id: true,
                title: true,
                updatedAt: true,
                startDate: true
            },
            take: 3
        });

        draftProposals.forEach(proposal => {
            const daysUntilStart = proposal.startDate 
                ? Math.floor((new Date(proposal.startDate) - new Date()) / (1000 * 60 * 60 * 24))
                : 30;
            const priority = daysUntilStart < 7 ? 'high' : daysUntilStart < 14 ? 'medium' : 'low';
            
            tasks.push({
                id: `proposal-${proposal.id}`,
                title: `Finalize proposal: ${proposal.title.substring(0, 40)}${proposal.title.length > 40 ? '...' : ''}`,
                description: 'Proposal draft needs finalization',
                priority: priority,
                type: 'proposal',
                dueDate: proposal.startDate || new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
                status: 'pending',
                link: `/researcher/proposals/${proposal.id}`,
                icon: 'assignment',
                color: '#42A5F5'
            });
        });

        // 4. Tasks from proposals UNDER_REVIEW
        const reviewProposals = await prisma.proposal.findMany({
            where: {
                status: 'UNDER_REVIEW'
            },
            select: {
                id: true,
                title: true,
                updatedAt: true
            },
            take: 2
        });

        reviewProposals.forEach(proposal => {
            tasks.push({
                id: `proposal-review-${proposal.id}`,
                title: `Monitor proposal review: ${proposal.title.substring(0, 35)}${proposal.title.length > 35 ? '...' : ''}`,
                description: 'Proposal under review',
                priority: 'low',
                type: 'monitoring',
                dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
                status: 'pending',
                link: `/researcher/proposals/${proposal.id}`,
                icon: 'visibility',
                color: '#66BB6A'
            });
        });

        // 5. Add a task to update research profile if not updated recently
        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: { 
                updatedAt: true,
                researchProfile: {
                    select: {
                        updatedAt: true
                    }
                }
            }
        });

        if (user) {
            const profileUpdateDate = user.researchProfile?.updatedAt || user.updatedAt;
            const daysSinceProfileUpdate = Math.floor((new Date() - new Date(profileUpdateDate)) / (1000 * 60 * 60 * 24));
            
            if (daysSinceProfileUpdate > 30) {
                tasks.push({
                    id: 'update-profile',
                    title: 'Update research profile',
                    description: `Last updated ${daysSinceProfileUpdate} days ago`,
                    priority: daysSinceProfileUpdate > 90 ? 'high' : 'medium',
                    type: 'profile',
                    dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
                    status: 'pending',
                    link: '/researcher/profile',
                    icon: 'person',
                    color: '#FFA726'
                });
            }
        }

        // Sort tasks by priority (high -> medium -> low) and then by due date
        const priorityOrder = { high: 1, medium: 2, low: 3 };
        tasks.sort((a, b) => {
            if (priorityOrder[a.priority] !== priorityOrder[b.priority]) {
                return priorityOrder[a.priority] - priorityOrder[b.priority];
            }
            return new Date(a.dueDate) - new Date(b.dueDate);
        });

        // Calculate days until due for each task
        const tasksWithDaysUntil = tasks.map(task => ({
            ...task,
            daysUntilDue: Math.floor((new Date(task.dueDate) - new Date()) / (1000 * 60 * 60 * 24))
        }));

        return NextResponse.json({
            success: true,
            tasks: tasksWithDaysUntil,
            total: tasksWithDaysUntil.length,
            summary: {
                high: tasksWithDaysUntil.filter(t => t.priority === 'high').length,
                medium: tasksWithDaysUntil.filter(t => t.priority === 'medium').length,
                low: tasksWithDaysUntil.filter(t => t.priority === 'low').length
            }
        });

    } catch (error) {
        console.error('Error fetching tasks:', error);
        return NextResponse.json(
            { error: 'Failed to fetch tasks', details: error.message },
            { status: 500 }
        );
    } finally {
        await prisma.$disconnect();
    }
}
