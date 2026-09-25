import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { logApiActivity, logDatabaseActivity, getRequestMetadata } from '../../../utils/activityLogger.js';
import { getUserId, requireAuth } from '../../../lib/auth-server.js';
import { saveProposalDocument } from '../../../lib/proposal-files.js';

const prisma = new PrismaClient();

export async function GET(request) {
    try {
        // Get current user
        const userId = await getUserId(request);
        let currentUser = null;
        
        if (userId) {
            currentUser = await prisma.user.findUnique({
                where: { id: userId },
                select: { id: true, email: true, orcidId: true, accountType: true, givenName: true, familyName: true, primaryInstitution: true }
            });
        }
        
        const requestMetadata = getRequestMetadata(request, currentUser);
        await logApiActivity('GET', '/api/proposals', 200, requestMetadata);
        
        const { searchParams } = new URL(request.url);
        const search = searchParams.get('search') || '';
        const status = searchParams.get('status') || '';
        const limit = parseInt(searchParams.get('limit')) || 50;
        const offset = parseInt(searchParams.get('offset')) || 0;

        console.log('Query params:', { search, status, limit, offset });
        console.log('Current user:', { orcidId: currentUser?.orcidId, accountType: currentUser?.accountType, institution: currentUser?.primaryInstitution });

        // Build where clause
        const where = {};
        
        // Filter based on user account type
        if (currentUser?.accountType === 'RESEARCHER' && currentUser?.orcidId) {
            // Researchers only see their own proposals
            where.principalInvestigatorOrcid = currentUser.orcidId;
        }
        // Institution admins and global admins see all proposals (no filter)
        
        if (search) {
            where.OR = [
                { title: { contains: search, mode: 'insensitive' } },
                { principalInvestigator: { contains: search, mode: 'insensitive' } },
                { researchAreas: { hasSome: [search] } }
            ];
        }
        
        if (status && status !== 'All Statuses') {
            where.status = status;
        }

        console.log('Where clause:', JSON.stringify(where, null, 2));

        const proposals = await prisma.proposal.findMany({
            where,
            orderBy: { createdAt: 'desc' },
            take: limit,
            skip: offset
        });

        console.log('Found proposals:', proposals.length);

        // Transform data for frontend
        const transformedProposals = proposals.map(proposal => ({
            ...proposal,
            author: proposal.principalInvestigator,
            fields: proposal.researchAreas || [],
            startDate: proposal.startDate ? proposal.startDate.toISOString().split('T')[0] : null,
            endDate: proposal.endDate ? proposal.endDate.toISOString().split('T')[0] : null,
            grantStartDate: proposal.grantStartDate ? proposal.grantStartDate.toISOString().split('T')[0] : null,
            grantEndDate: proposal.grantEndDate ? proposal.grantEndDate.toISOString().split('T')[0] : null,
            approvalDate: proposal.approvalDate ? proposal.approvalDate.toISOString().split('T')[0] : null,
            completion: proposal.status === 'DRAFT' ? 25 : proposal.status === 'UNDER_REVIEW' ? 75 : 100,
            daysOverdue: proposal.endDate && new Date() > proposal.endDate ? 
                Math.floor((new Date() - proposal.endDate) / (1000 * 60 * 60 * 24)) : 0,
            description: proposal.abstract || proposal.researchObjectives || 'No description available'
        }));

        return NextResponse.json({
            success: true,
            proposals: transformedProposals,
            total: transformedProposals.length
        });

    } catch (error) {
        console.error('Error fetching proposals:', error);
        return NextResponse.json(
            { error: 'Failed to fetch proposals' },
            { status: 500 }
        );
    }
}

export async function POST(request) {
    const requestMetadata = getRequestMetadata(request);
    
    try {
        await logApiActivity('POST', '/api/proposals', 200, requestMetadata);

        const auth = await requireAuth(request);
        if (auth.error) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }
        const user = auth.user;

        const formData = await request.formData();
        const proposalDataString = formData.get('proposalData');
        
        if (!proposalDataString) {
            return NextResponse.json(
                { error: 'Proposal data is required' },
                { status: 400 }
            );
        }

        const proposalData = JSON.parse(proposalDataString);

        if (user.accountType === 'RESEARCHER') {
            if (user.orcidId && proposalData.principalInvestigatorOrcid && proposalData.principalInvestigatorOrcid !== user.orcidId) {
                return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
            }
            if (!proposalData.principalInvestigatorOrcid && user.orcidId) {
                proposalData.principalInvestigatorOrcid = user.orcidId;
            }
        }

        const uploadedFiles = {
            ethicsDocuments: [],
            dataManagementPlan: [],
            otherRelatedFiles: []
        };

        const fileGroups = [
            { key: 'ethicsDocuments', formField: 'ethicsDocuments', prefix: 'ethics' },
            { key: 'dataManagementPlan', formField: 'dataManagementPlan', prefix: 'dmp' },
            { key: 'otherRelatedFiles', formField: 'otherRelatedFiles', prefix: 'other' },
        ];

        for (const { key, formField, prefix } of fileGroups) {
            for (const file of formData.getAll(formField)) {
                if (!file || !file.size) continue;
                try {
                    uploadedFiles[key].push(await saveProposalDocument(prefix, file));
                } catch (err) {
                    return NextResponse.json({ error: err.message || 'Invalid file' }, { status: 400 });
                }
            }
        }

        // Create the proposal in the database
        const proposal = await prisma.proposal.create({
            data: {
                // Core Information
                title: proposalData.title,
                principalInvestigator: proposalData.principalInvestigator,
                principalInvestigatorOrcid: proposalData.principalInvestigatorOrcid,
                coInvestigators: proposalData.coInvestigators || [],
                departments: proposalData.departments || [],
                startDate: proposalData.startDate ? new Date(proposalData.startDate) : null,
                endDate: proposalData.endDate ? new Date(proposalData.endDate) : null,

                // Research Details
                researchAreas: proposalData.researchAreas || [],
                researchObjectives: proposalData.researchObjectives,
                methodology: proposalData.methodology,
                abstract: proposalData.abstract,

                // Project Management
                milestones: proposalData.milestones || [],
                deliverables: proposalData.deliverables || [],

                // Funding and Grants
                fundingSource: proposalData.fundingSource,
                grantNumber: proposalData.grantNumber,
                fundingInstitution: proposalData.fundingInstitution,
                grantStartDate: proposalData.grantStartDate ? new Date(proposalData.grantStartDate) : null,
                grantEndDate: proposalData.grantEndDate ? new Date(proposalData.grantEndDate) : null,
                totalBudgetAmount: proposalData.totalBudgetAmount ? parseFloat(proposalData.totalBudgetAmount) : null,

                // Ethical Considerations
                ethicalConsiderationsOverview: proposalData.ethicalConsiderationsOverview,
                consentProcedures: proposalData.consentProcedures,
                dataSecurityMeasures: proposalData.dataSecurityMeasures,
                ethicsApprovalStatus: proposalData.ethicsApprovalStatus,
                ethicsApprovalReference: proposalData.ethicsApprovalReference,
                ethicsCommittee: proposalData.ethicsCommittee,
                approvalDate: proposalData.approvalDate ? new Date(proposalData.approvalDate) : null,

                // Related Publications & Files
                publicationRelevance: proposalData.publicationRelevance,

                // File uploads
                ethicsDocuments: uploadedFiles.ethicsDocuments,
                dataManagementPlan: uploadedFiles.dataManagementPlan,
                otherRelatedFiles: uploadedFiles.otherRelatedFiles,

                // Status
                status: proposalData.status || 'DRAFT',

                // TODO: Add userId when authentication is implemented
                // userId: session.user.id
            }
        });

        // Create relations to publications
        if (proposalData.selectedPublications && proposalData.selectedPublications.length > 0) {
            await prisma.proposalPublication.createMany({
                data: proposalData.selectedPublications.map(pubId => ({
                    proposalId: proposal.id,
                    publicationId: pubId
                }))
            });
        }

        // Create relations to collaborative proposals (manuscripts)
        if (proposalData.linkedCollaborativeProposals && proposalData.linkedCollaborativeProposals.length > 0) {
            await prisma.proposalManuscript.createMany({
                data: proposalData.linkedCollaborativeProposals.map(manuscriptId => ({
                    proposalId: proposal.id,
                    manuscriptId: manuscriptId
                }))
            });
        }

        return NextResponse.json({
            success: true,
            proposal: {
                id: proposal.id,
                title: proposal.title,
                status: proposal.status,
                createdAt: proposal.createdAt
            },
            message: 'Proposal submitted successfully'
        });

    } catch (error) {
        console.error('Error creating proposal:', error);
        
        return NextResponse.json(
            { error: 'Failed to create proposal. Please try again.' },
            { status: 500 }
        );
    } finally {
        await prisma.$disconnect();
    }
}
