import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { logApiActivity, logDatabaseActivity, getRequestMetadata } from '../../../../utils/activityLogger.js';

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
                }
            }
        });

        if (!proposal) {
            return NextResponse.json(
                { error: 'Proposal not found' },
                { status: 404 }
            );
        }

        // Transform dates to ISO strings for frontend
        const transformedProposal = {
            ...proposal,
            startDate: proposal.startDate?.toISOString(),
            endDate: proposal.endDate?.toISOString(),
            grantStartDate: proposal.grantStartDate?.toISOString(),
            grantEndDate: proposal.grantEndDate?.toISOString(),
            approvalDate: proposal.approvalDate?.toISOString(),
            createdAt: proposal.createdAt.toISOString(),
            updatedAt: proposal.updatedAt.toISOString()
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

        const formData = await request.formData();
        const proposalDataString = formData.get('proposalData');
        
        if (!proposalDataString) {
            return NextResponse.json(
                { error: 'Proposal data is required' },
                { status: 400 }
            );
        }

        const proposalData = JSON.parse(proposalDataString);

        // Create uploads directory if it doesn't exist
        const uploadsDir = join(process.cwd(), 'uploads', 'proposals');
        await mkdir(uploadsDir, { recursive: true });

        // Handle file uploads (similar to POST but for updates)
        const uploadedFiles = {
            ethicsDocuments: [],
            dataManagementPlan: [],
            otherRelatedFiles: []
        };

        // Process ethics documents
        const ethicsFiles = formData.getAll('ethicsDocuments');
        for (const file of ethicsFiles) {
            if (file && file.size > 0) {
                const fileName = `ethics_${Date.now()}_${file.name}`;
                const filePath = join(uploadsDir, fileName);
                const bytes = await file.arrayBuffer();
                await writeFile(filePath, Buffer.from(bytes));
                uploadedFiles.ethicsDocuments.push({
                    originalName: file.name,
                    fileName: fileName,
                    filePath: filePath,
                    size: file.size,
                    mimeType: file.type
                });
            }
        }

        // Process data management plan files
        const dmpFiles = formData.getAll('dataManagementPlan');
        for (const file of dmpFiles) {
            if (file && file.size > 0) {
                const fileName = `dmp_${Date.now()}_${file.name}`;
                const filePath = join(uploadsDir, fileName);
                const bytes = await file.arrayBuffer();
                await writeFile(filePath, Buffer.from(bytes));
                uploadedFiles.dataManagementPlan.push({
                    originalName: file.name,
                    fileName: fileName,
                    filePath: filePath,
                    size: file.size,
                    mimeType: file.type
                });
            }
        }

        // Process other related files
        const otherFiles = formData.getAll('otherRelatedFiles');
        for (const file of otherFiles) {
            if (file && file.size > 0) {
                const fileName = `other_${Date.now()}_${file.name}`;
                const filePath = join(uploadsDir, fileName);
                const bytes = await file.arrayBuffer();
                await writeFile(filePath, Buffer.from(bytes));
                uploadedFiles.otherRelatedFiles.push({
                    originalName: file.name,
                    fileName: fileName,
                    filePath: filePath,
                    size: file.size,
                    mimeType: file.type
                });
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
            status: proposalData.status || 'DRAFT',
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