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

        const deadlines = [];
        const now = new Date();

        // 1. Get deadlines from proposals with start dates
        const upcomingProposals = await prisma.proposal.findMany({
            where: {
                startDate: {
                    gte: now
                },
                status: {
                    in: ['DRAFT', 'UNDER_REVIEW', 'APPROVED']
                }
            },
            orderBy: {
                startDate: 'asc'
            },
            take: 5,
            select: {
                id: true,
                title: true,
                startDate: true,
                endDate: true,
                status: true,
                fundingAmount: true
            }
        });

        upcomingProposals.forEach(proposal => {
            const daysUntil = Math.floor((new Date(proposal.startDate) - now) / (1000 * 60 * 60 * 24));
            deadlines.push({
                id: `proposal-start-${proposal.id}`,
                title: `Proposal start: ${proposal.title.substring(0, 50)}${proposal.title.length > 50 ? '...' : ''}`,
                description: `Project start date`,
                date: proposal.startDate,
                daysUntil: daysUntil,
                type: 'proposal',
                priority: daysUntil <= 7 ? 'high' : daysUntil <= 14 ? 'medium' : 'low',
                status: proposal.status,
                link: `/researcher/proposals/${proposal.id}`,
                icon: 'assignment',
                color: '#42A5F5',
                metadata: {
                    fundingAmount: proposal.fundingAmount
                }
            });
        });

        // 2. Get deadlines from proposals with end dates
        const endingProposals = await prisma.proposal.findMany({
            where: {
                endDate: {
                    gte: now
                },
                status: {
                    in: ['IN_PROGRESS', 'APPROVED']
                }
            },
            orderBy: {
                endDate: 'asc'
            },
            take: 3,
            select: {
                id: true,
                title: true,
                endDate: true,
                status: true
            }
        });

        endingProposals.forEach(proposal => {
            const daysUntil = Math.floor((new Date(proposal.endDate) - now) / (1000 * 60 * 60 * 24));
            deadlines.push({
                id: `proposal-end-${proposal.id}`,
                title: `Proposal deadline: ${proposal.title.substring(0, 45)}${proposal.title.length > 45 ? '...' : ''}`,
                description: `Project completion deadline`,
                date: proposal.endDate,
                daysUntil: daysUntil,
                type: 'deadline',
                priority: daysUntil <= 14 ? 'high' : daysUntil <= 30 ? 'medium' : 'low',
                status: proposal.status,
                link: `/researcher/proposals/${proposal.id}`,
                icon: 'event',
                color: '#EF5350'
            });
        });

        // 3. Get manuscripts that need submission (in DRAFT for >30 days)
        const oldDrafts = await prisma.manuscript.findMany({
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
                status: 'DRAFT',
                createdAt: {
                    lte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) // 30 days ago
                }
            },
            orderBy: {
                createdAt: 'asc'
            },
            take: 3,
            select: {
                id: true,
                title: true,
                createdAt: true,
                updatedAt: true
            }
        });

        oldDrafts.forEach(manuscript => {
            const suggestedDeadline = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000); // 14 days from now
            const daysUntil = 14;
            
            deadlines.push({
                id: `manuscript-submit-${manuscript.id}`,
                title: `Submit manuscript: ${manuscript.title.substring(0, 45)}${manuscript.title.length > 45 ? '...' : ''}`,
                description: `Draft created ${Math.floor((now - new Date(manuscript.createdAt)) / (1000 * 60 * 60 * 24))} days ago`,
                date: suggestedDeadline,
                daysUntil: daysUntil,
                type: 'manuscript',
                priority: 'medium',
                status: 'DRAFT',
                link: `/researcher/publications/collaborate?manuscriptId=${manuscript.id}`,
                icon: 'send',
                color: '#FF6B6B'
            });
        });

        // 4. Add some conference/event deadlines (these could come from a separate events table in the future)
        // For now, we'll add placeholder deadlines that could be customized
        const genericDeadlines = [
            {
                id: 'conference-abstract-1',
                title: 'Conference abstract submission',
                description: 'Annual Research Conference 2026',
                date: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000),
                daysUntil: 45,
                type: 'conference',
                priority: 'low',
                icon: 'event',
                color: '#66BB6A'
            },
            {
                id: 'annual-report-1',
                title: 'Annual research report',
                description: 'Institutional reporting deadline',
                date: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000),
                daysUntil: 60,
                type: 'report',
                priority: 'low',
                icon: 'description',
                color: '#FFA726'
            }
        ];

        // Only add generic deadlines if we have less than 5 real deadlines
        if (deadlines.length < 5) {
            deadlines.push(...genericDeadlines.slice(0, 5 - deadlines.length));
        }

        // Sort by date (closest first)
        deadlines.sort((a, b) => new Date(a.date) - new Date(b.date));

        // Take top 10
        const topDeadlines = deadlines.slice(0, 10);

        // Calculate summary
        const summary = {
            total: topDeadlines.length,
            urgent: topDeadlines.filter(d => d.daysUntil <= 7).length,
            upcoming: topDeadlines.filter(d => d.daysUntil > 7 && d.daysUntil <= 30).length,
            future: topDeadlines.filter(d => d.daysUntil > 30).length
        };

        return NextResponse.json({
            success: true,
            deadlines: topDeadlines,
            summary
        });

    } catch (error) {
        console.error('Error fetching deadlines:', error);
        return NextResponse.json(
            { error: 'Failed to fetch deadlines', details: error.message },
            { status: 500 }
        );
    } finally {
        await prisma.$disconnect();
    }
}
