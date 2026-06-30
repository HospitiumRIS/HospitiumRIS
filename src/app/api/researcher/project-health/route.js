import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { getUserId } from '../../../../lib/auth-server.js';

const prisma = new PrismaClient();

export async function GET(request) {
    try {
        console.log('[Project Health] API called');
        const userId = await getUserId(request);
        console.log('[Project Health] getUserId returned:', userId);
        
        // Get current user with ORCID
        let currentUser = null;
        if (userId) {
            currentUser = await prisma.user.findUnique({
                where: { id: userId },
                select: { id: true, orcidId: true, email: true }
            });
            console.log('[Project Health] Current user:', currentUser);
        } else {
            console.log('[Project Health] No userId found - user may not be logged in');
        }
        
        const projects = [];

        // Note: Only showing proposals (projects) in Project Health widget
        // Manuscripts are excluded as per user request

        // 2. Get active proposals - filter by user's ORCID if available
        const proposalWhere = {
            status: {
                in: ['DRAFT', 'SUBMITTED', 'UNDER_REVIEW', 'APPROVED', 'REVISION_REQUESTED']
            }
        };
        
        if (currentUser?.orcidId) {
            proposalWhere.principalInvestigatorOrcid = currentUser.orcidId;
            console.log('[Project Health] Filtering proposals by ORCID:', currentUser.orcidId);
        } else {
            console.log('[Project Health] No ORCID filter applied');
        }
        
        console.log('[Project Health] Proposal where clause:', JSON.stringify(proposalWhere, null, 2));
        
        const proposals = await prisma.proposal.findMany({
            where: proposalWhere,
            orderBy: {
                updatedAt: 'desc'
            },
            take: 5,
            select: {
                id: true,
                title: true,
                status: true,
                startDate: true,
                endDate: true,
                updatedAt: true,
                createdAt: true,
                principalInvestigator: true,
                coInvestigators: true,
                totalBudgetAmount: true,
                milestones: true
            }
        });
        
        console.log('[Project Health] Found proposals:', proposals.length);

        proposals.forEach(proposal => {
            const daysSinceUpdate = Math.floor((new Date() - new Date(proposal.updatedAt)) / (1000 * 60 * 60 * 24));
            const now = new Date();
            
            let progress = 0;
            let status = 'on-track';
            
            // Calculate progress based on status and timeline
            switch(proposal.status) {
                case 'DRAFT':
                    progress = 15;
                    status = daysSinceUpdate > 14 ? 'at-risk' : daysSinceUpdate > 7 ? 'needs-attention' : 'on-track';
                    break;
                case 'SUBMITTED':
                    progress = 35;
                    status = daysSinceUpdate > 30 ? 'needs-attention' : 'on-track';
                    break;
                case 'UNDER_REVIEW':
                    progress = 55;
                    status = daysSinceUpdate > 45 ? 'needs-attention' : 'on-track';
                    break;
                case 'REVISION_REQUESTED':
                    progress = 45;
                    status = daysSinceUpdate > 14 ? 'at-risk' : daysSinceUpdate > 7 ? 'needs-attention' : 'on-track';
                    break;
                case 'APPROVED':
                    // If approved, calculate based on project timeline
                    if (proposal.startDate && proposal.endDate) {
                        const totalDays = (new Date(proposal.endDate) - new Date(proposal.startDate)) / (1000 * 60 * 60 * 24);
                        const elapsedDays = Math.max(0, (now - new Date(proposal.startDate)) / (1000 * 60 * 60 * 24));
                        
                        // Calculate milestone completion if available
                        let milestoneProgress = 0;
                        if (Array.isArray(proposal.milestones) && proposal.milestones.length > 0) {
                            const completedMilestones = proposal.milestones.filter(m => m.status === 'completed').length;
                            milestoneProgress = (completedMilestones / proposal.milestones.length) * 100;
                        }
                        
                        // Combine timeline and milestone progress
                        const timelineProgress = Math.min(100, (elapsedDays / totalDays) * 100);
                        progress = milestoneProgress > 0 
                            ? Math.floor((timelineProgress * 0.4) + (milestoneProgress * 0.6))
                            : Math.floor(timelineProgress);
                        
                        // Determine status based on progress vs timeline
                        const expectedProgress = timelineProgress;
                        if (progress < expectedProgress - 15) {
                            status = 'at-risk';
                        } else if (progress < expectedProgress - 5) {
                            status = 'needs-attention';
                        } else {
                            status = 'on-track';
                        }
                        
                        // Check for overdue milestones
                        if (Array.isArray(proposal.milestones)) {
                            const overdueMilestones = proposal.milestones.filter(m => {
                                if (m.status !== 'completed' && m.targetDate) {
                                    return new Date(m.targetDate) < now;
                                }
                                return false;
                            });
                            if (overdueMilestones.length > 0) {
                                status = 'at-risk';
                            }
                        }
                    } else {
                        // No timeline, use award status
                        progress = proposal.totalBudgetAmount ? 85 : 70;
                        status = proposal.totalBudgetAmount ? 'on-track' : 'needs-attention';
                    }
                    break;
                default:
                    progress = 20;
                    status = 'needs-attention';
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

            // Add additional metadata for proposals
            const metadata = [];
            if (proposal.status === 'APPROVED' && proposal.totalBudgetAmount) {
                metadata.push(`Awarded: $${Number(proposal.totalBudgetAmount).toLocaleString()}`);
            }
            if (proposal.status === 'APPROVED' && !proposal.totalBudgetAmount) {
                metadata.push('Pending award');
            }
            if (Array.isArray(proposal.milestones) && proposal.milestones.length > 0) {
                const completed = proposal.milestones.filter(m => m.status === 'completed').length;
                metadata.push(`${completed}/${proposal.milestones.length} milestones`);
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
                link: `/researcher/projects/proposals/list`,
                statusLabel: proposal.status,
                icon: 'assignment',
                color: '#8b6cbc',
                metadata: metadata.join(' • ')
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
