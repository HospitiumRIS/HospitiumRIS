import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { logApiActivity, logDatabaseActivity, getRequestMetadata } from '../../../../utils/activityLogger.js';
import { requireAuth } from '../../../../lib/auth-server.js';
import {
    canAccessProposal,
    saveProposalDocument,
    proposalDocumentDisplayUrl,
    resolveProposalTenantId,
} from '../../../../lib/proposal-files.js';
import { collectBudgetDocuments, persistProposalBudgetFields, readProposalBudgetFields } from '../../../../lib/proposal-budget.js';
import { ensureProposalInReviewPipeline, isProposalInReview } from '../../../../lib/proposal-review-pipeline.js';

const prisma = new PrismaClient();

export async function GET(request, { params }) {
    try {
        const { id } = await params;
        
        if (!id) {
            return NextResponse.json(
                { error: 'Proposal ID is required' },
                { status: 400 }
            );
        }

        const proposal = await prisma.proposal.findUnique({
            where: { id },
            include: {
                publications: {
                    include: {
                        publication: {
                            select: {
                                id: true,
                                title: true,
                                authors: true,
                                journal: true,
                                year: true
                            }
                        }
                    }
                },
                manuscripts: {
                    include: {
                        manuscript: {
                            select: {
                                id: true,
                                title: true,
                                type: true,
                                status: true
                            }
                        }
                    }
                },
                ethicsLinks: {
                    include: {
                        ethicsApplication: {
                            select: {
                                id: true,
                                title: true,
                                status: true,
                                referenceNumber: true,
                                committeeName: true,
                                approvalDate: true,
                                documents: true,
                                researchSummary: true,
                                consentProcess: true,
                                dataSecurityMeasures: true,
                            }
                        }
                    },
                    orderBy: { linkedDate: 'desc' }
                }
            }
        });

        if (!proposal) {
            return NextResponse.json(
                { error: 'Proposal not found' },
                { status: 404 }
            );
        }

        // Combine all documents into a single array
        const allDocuments = [];
        
        // Add ethics documents
        if (proposal.ethicsDocuments && Array.isArray(proposal.ethicsDocuments)) {
            proposal.ethicsDocuments.forEach(doc => {
                allDocuments.push({
                    ...doc,
                    category: 'Ethics Documents',
                    fileName: doc.fileName || doc.originalName,
                    type: doc.mimeType || 'application/pdf',
                    size: doc.size,
                    url: proposalDocumentDisplayUrl(doc),
                    uploadedAt: proposal.createdAt
                });
            });
        }
        
        // Add data management plan documents
        if (proposal.dataManagementPlan && Array.isArray(proposal.dataManagementPlan)) {
            proposal.dataManagementPlan.forEach(doc => {
                allDocuments.push({
                    ...doc,
                    category: 'Data Management Plan',
                    fileName: doc.fileName || doc.originalName,
                    type: doc.mimeType || 'application/pdf',
                    size: doc.size,
                    url: proposalDocumentDisplayUrl(doc),
                    uploadedAt: proposal.createdAt
                });
            });
        }
        
        // Add other related files
        if (proposal.otherRelatedFiles && Array.isArray(proposal.otherRelatedFiles)) {
            proposal.otherRelatedFiles.forEach(doc => {
                allDocuments.push({
                    ...doc,
                    category: 'Other Documents',
                    fileName: doc.fileName || doc.originalName,
                    type: doc.mimeType || 'application/pdf',
                    size: doc.size,
                    url: proposalDocumentDisplayUrl(doc),
                    uploadedAt: proposal.createdAt
                });
            });
        }

        const budgetFields = await readProposalBudgetFields(prisma, proposal.id);
        proposal.budgetCurrency = proposal.budgetCurrency || budgetFields.budgetCurrency;
        proposal.budgetDocuments = Array.isArray(proposal.budgetDocuments) && proposal.budgetDocuments.length
            ? proposal.budgetDocuments
            : budgetFields.budgetDocuments;

        if (proposal.budgetDocuments && Array.isArray(proposal.budgetDocuments)) {
            proposal.budgetDocuments.forEach(doc => {
                allDocuments.push({
                    ...doc,
                    category: 'Budget Documents',
                    fileName: doc.fileName || doc.originalName,
                    type: doc.mimeType || 'application/pdf',
                    size: doc.size,
                    url: proposalDocumentDisplayUrl(doc),
                    uploadedAt: proposal.createdAt
                });
            });
        }

        const linkedEthics = proposal.ethicsLinks?.[0]?.ethicsApplication || null;
        if (linkedEthics?.documents && Array.isArray(linkedEthics.documents)) {
            linkedEthics.documents.forEach((doc) => {
                const storedName = doc.fileName || doc.originalName || doc.name;
                allDocuments.push({
                    ...doc,
                    category: doc.type || 'Ethics Documents',
                    fileName: storedName,
                    type: doc.mimeType || 'application/pdf',
                    size: doc.size,
                    url: doc.url
                        || (doc.fileId ? `/api/files/${doc.fileId}` : null)
                        || (storedName ? `/api/ethics/applications/${linkedEthics.id}/file?name=${encodeURIComponent(storedName)}` : null),
                    uploadedAt: doc.uploadedAt || proposal.createdAt,
                    ethicsApplicationId: linkedEthics.id,
                });
            });
        }
        const transformedProposal = {
            ...proposal,
            startDate: proposal.startDate?.toISOString(),
            endDate: proposal.endDate?.toISOString(),
            grantStartDate: proposal.grantStartDate?.toISOString(),
            grantEndDate: proposal.grantEndDate?.toISOString(),
            approvalDate: proposal.approvalDate?.toISOString(),
            createdAt: proposal.createdAt.toISOString(),
            updatedAt: proposal.updatedAt.toISOString(),
            documents: allDocuments,
            linkedEthicsApplicationId: linkedEthics?.id || proposal.ethicsLinks?.[0]?.ethicsApplicationId || null,
            linkedEthicsDocuments: linkedEthics?.documents || [],
        };

        return NextResponse.json({
            success: true,
            proposal: transformedProposal
        });

    } catch (error) {
        console.error('Error fetching proposal:', error);
        return NextResponse.json(
            { error: 'Failed to fetch proposal' },
            { status: 500 }
        );
    } finally {
        await prisma.$disconnect();
    }
}

export async function PUT(request, { params }) {
    const requestMetadata = getRequestMetadata(request);
    
    try {
        const { id } = await params;
        await logApiActivity('PUT', `/api/proposals/${id}`, 200, requestMetadata);
        
        
        if (!id) {
            return NextResponse.json(
                { error: 'Proposal ID is required' },
                { status: 400 }
            );
        }

        // Check if proposal exists
        const existingProposal = await prisma.proposal.findUnique({
            where: { id }
        });

        if (!existingProposal) {
            return NextResponse.json(
                { error: 'Proposal not found' },
                { status: 404 }
            );
        }

        const auth = await requireAuth(request);
        if (auth.error) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }
        if (!canAccessProposal(auth.user, existingProposal)) {
            return NextResponse.json({ error: 'Not found' }, { status: 404 });
        }

        const formData = await request.formData();
        const proposalDataString = formData.get('proposalData');
        
        if (!proposalDataString) {
            return NextResponse.json(
                { error: 'Proposal data is required' },
                { status: 400 }
            );
        }

        const proposalData = JSON.parse(proposalDataString);

        const uploadedFiles = {
            ethicsDocuments: [],
            dataManagementPlan: [],
            otherRelatedFiles: [],
            budgetDocuments: []
        };

        const fileGroups = [
            { key: 'ethicsDocuments', formField: 'ethicsDocuments', prefix: 'ethics' },
            { key: 'dataManagementPlan', formField: 'dataManagementPlan', prefix: 'dmp' },
            { key: 'otherRelatedFiles', formField: 'otherRelatedFiles', prefix: 'other' },
            { key: 'budgetDocuments', formField: 'budgetDocuments', prefix: 'budget' },
        ];

        const entityTenantId = await resolveProposalTenantId(existingProposal);

        for (const { key, formField, prefix } of fileGroups) {
            for (const file of formData.getAll(formField)) {
                if (!file || !file.size) continue;
                try {
                    uploadedFiles[key].push(await saveProposalDocument(prefix, file, {
                        user: auth.user,
                        proposalId: id,
                        entityTenantId,
                    }));
                } catch (err) {
                    return NextResponse.json({ error: err.message || 'Invalid file' }, { status: 400 });
                }
            }
        }

        // Prepare update data with proper validation
        const updateData = {
            title: proposalData.title,
            principalInvestigator: proposalData.principalInvestigator,
            principalInvestigatorOrcid: proposalData.principalInvestigatorOrcid,
            coInvestigators: proposalData.coInvestigators || [],
            departments: proposalData.departments || [],
            startDate: proposalData.startDate ? new Date(proposalData.startDate) : null,
            endDate: proposalData.endDate ? new Date(proposalData.endDate) : null,
            researchAreas: proposalData.researchAreas || [],
            researchObjectives: proposalData.researchObjectives,
            methodology: proposalData.methodology,
            abstract: proposalData.abstract,
            milestones: proposalData.milestones || [],
            deliverables: proposalData.deliverables || [],
            fundingSource: proposalData.fundingSource,
            grantNumber: proposalData.grantNumber,
            fundingInstitution: proposalData.fundingInstitution,
            grantStartDate: proposalData.grantStartDate ? new Date(proposalData.grantStartDate) : null,
            grantEndDate: proposalData.grantEndDate ? new Date(proposalData.grantEndDate) : null,
            totalBudgetAmount: proposalData.totalBudgetAmount ? parseFloat(proposalData.totalBudgetAmount) : null,
            ethicalConsiderationsOverview: proposalData.ethicalConsiderationsOverview,
            consentProcedures: proposalData.consentProcedures,
            dataSecurityMeasures: proposalData.dataSecurityMeasures,
            ethicsApprovalStatus: proposalData.ethicsApprovalStatus,
            ethicsApprovalReference: proposalData.ethicsApprovalReference,
            ethicsCommittee: proposalData.ethicsCommittee,
            approvalDate: proposalData.approvalDate ? new Date(proposalData.approvalDate) : null,
            publicationRelevance: proposalData.publicationRelevance,
            status: (isProposalInReview(existingProposal.status) || ['APPROVED', 'REJECTED'].includes(existingProposal.status))
              && proposalData.status === 'DRAFT'
                ? existingProposal.status
                : (proposalData.status || 'DRAFT'),
            updatedAt: new Date()
        };

        // Add file data only if there are files to add
        if (uploadedFiles.ethicsDocuments.length > 0) {
            updateData.ethicsDocuments = uploadedFiles.ethicsDocuments;
        }
        if (uploadedFiles.dataManagementPlan.length > 0) {
            updateData.dataManagementPlan = uploadedFiles.dataManagementPlan;
        }
        if (uploadedFiles.otherRelatedFiles.length > 0) {
            updateData.otherRelatedFiles = uploadedFiles.otherRelatedFiles;
        }

        // Add summary fields
        updateData.impactStatement = proposalData.impactStatement;
        updateData.disseminationPlan = proposalData.disseminationPlan;

        // Update the proposal
        const updatedProposal = await prisma.proposal.update({
            where: { id },
            data: updateData
        });

        try {
            await persistProposalBudgetFields(prisma, id, {
                budgetCurrency: proposalData.budgetCurrency || null,
                budgetDocuments: collectBudgetDocuments(
                    proposalData,
                    uploadedFiles.budgetDocuments,
                    existingProposal.budgetDocuments || []
                ),
            });
        } catch (err) {
            console.error('Failed to persist proposal budget fields:', err);
        }

        if (isProposalInReview(updateData.status)) {
            try {
                await ensureProposalInReviewPipeline(prisma, id, { status: updateData.status });
            } catch (err) {
                console.error('Failed to assign review pipeline:', err);
            }
        }

        if (proposalData.linkedEthicsApplicationId) {
            try {
                await prisma.proposalEthicsLink.upsert({
                    where: {
                        proposalId_ethicsApplicationId: {
                            proposalId: id,
                            ethicsApplicationId: proposalData.linkedEthicsApplicationId,
                        },
                    },
                    create: {
                        proposalId: id,
                        ethicsApplicationId: proposalData.linkedEthicsApplicationId,
                        linkedBy: auth.user.id,
                    },
                    update: {},
                });
            } catch (err) {
                console.error('Failed to link ethics application to proposal:', err);
            }
        }

        await logDatabaseActivity('UPDATE', 'Proposal', { success: true, count: 1 }, {
            ...requestMetadata,
            operation: 'Update proposal',
            proposalId: id
        });

        return NextResponse.json({
            success: true,
            proposal: {
                id: updatedProposal.id,
                title: updatedProposal.title,
                status: updatedProposal.status,
                updatedAt: updatedProposal.updatedAt
            },
            message: 'Proposal updated successfully'
        });

    } catch (error) {
        console.error('Error updating proposal:', error);
        
        await logApiActivity('PUT', `/api/proposals/${id}`, 500, {
            ...requestMetadata,
            error: error.message
        });
        
        return NextResponse.json(
            { error: 'Failed to update proposal. Please try again.' },
            { status: 500 }
        );
    } finally {
        await prisma.$disconnect();
    }
}

export async function PATCH(request, { params }) {
    const requestMetadata = getRequestMetadata(request);

    try {
        const { id } = await params;

        if (!id) {
            return NextResponse.json({ error: 'Proposal ID is required' }, { status: 400 });
        }

        const body = await request.json();
        const { status, awardedAmount, notes } = body;

        const existing = await prisma.proposal.findUnique({ where: { id } });
        if (!existing) {
            return NextResponse.json({ error: 'Proposal not found' }, { status: 404 });
        }

        const updateData = { updatedAt: new Date() };
        if (status) updateData.status = status;
        if (awardedAmount !== undefined && awardedAmount !== null) {
            updateData.totalBudgetAmount = parseFloat(awardedAmount);
        }

        const updated = await prisma.proposal.update({ where: { id }, data: updateData });

        if (status === 'APPROVED') {
            await prisma.proposalReview.create({
                data: {
                    proposalId: id,
                    reviewerId: requestMetadata.userId || 'system',
                    reviewerName: 'Research Administrator',
                    decision: 'APPROVED',
                    overallComments: notes || 'Proposal approved and grant awarded.',
                    sectionReviews: {},
                    complianceScore: { total: 0, compliant: 0, nonCompliant: 0 },
                    reviewDate: new Date(),
                    status: 'COMPLETED'
                }
            });
        }

        await logApiActivity('PATCH', `/api/proposals/${id}`, 200, {
            ...requestMetadata,
            action: 'PROPOSAL_STATUS_UPDATED',
            proposalId: id,
            newStatus: status,
            awardedAmount
        });

        return NextResponse.json({
            success: true,
            proposal: { id: updated.id, status: updated.status, totalBudgetAmount: updated.totalBudgetAmount },
            message: 'Proposal updated successfully'
        });

    } catch (error) {
        console.error('Error patching proposal:', error);
        await logApiActivity('PATCH', `/api/proposals/${(await params)?.id}`, 500, {
            ...requestMetadata,
            error: error.message
        });
        return NextResponse.json({ error: 'Failed to update proposal' }, { status: 500 });
    } finally {
        await prisma.$disconnect();
    }
}

export async function DELETE(request, { params }) {
    try {
        const { id } = await params;
        
        if (!id) {
            return NextResponse.json(
                { error: 'Proposal ID is required' },
                { status: 400 }
            );
        }

        // Check if proposal exists
        const existingProposal = await prisma.proposal.findUnique({
            where: { id }
        });

        if (!existingProposal) {
            return NextResponse.json(
                { error: 'Proposal not found' },
                { status: 404 }
            );
        }

        // Delete related records first (due to foreign key constraints)
        await prisma.proposalPublication.deleteMany({
            where: { proposalId: id }
        });

        await prisma.proposalManuscript.deleteMany({
            where: { proposalId: id }
        });

        // Delete the proposal
        await prisma.proposal.delete({
            where: { id }
        });

        return NextResponse.json({
            success: true,
            message: 'Proposal deleted successfully'
        });

    } catch (error) {
        console.error('Error deleting proposal:', error);
        
        return NextResponse.json(
            { error: 'Failed to delete proposal. Please try again.' },
            { status: 500 }
        );
    } finally {
        await prisma.$disconnect();
    }
}