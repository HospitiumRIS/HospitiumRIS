import { NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';
import prisma from '../../../../../../lib/prisma';

export async function GET(request, { params }) {
    try {
        const { id, fileName } = params;

        // Fetch the proposal to verify it exists and get file information
        const proposal = await prisma.proposal.findUnique({
            where: { id }
        });

        if (!proposal) {
            return NextResponse.json(
                { error: 'Proposal not found' },
                { status: 404 }
            );
        }

        // Find the file in the proposal's file arrays
        let fileInfo = null;
        let fileArray = null;

        // Check ethics documents
        if (proposal.ethicsDocuments) {
            fileInfo = proposal.ethicsDocuments.find(file => file.fileName === fileName);
            if (fileInfo) fileArray = 'ethicsDocuments';
        }

        // Check data management plan
        if (!fileInfo && proposal.dataManagementPlan) {
            fileInfo = proposal.dataManagementPlan.find(file => file.fileName === fileName);
            if (fileInfo) fileArray = 'dataManagementPlan';
        }

        // Check other related files
        if (!fileInfo && proposal.otherRelatedFiles) {
            fileInfo = proposal.otherRelatedFiles.find(file => file.fileName === fileName);
            if (fileInfo) fileArray = 'otherRelatedFiles';
        }

        if (!fileInfo) {
            return NextResponse.json(
                { error: 'File not found' },
                { status: 404 }
            );
        }

        // Check if file exists on disk
        const filePath = fileInfo.filePath;
        
        try {
            await fs.access(filePath);
        } catch (error) {
            console.error('File not found on disk:', filePath);
            return NextResponse.json(
                { error: 'File not found on disk' },
                { status: 404 }
            );
        }

        // Read the file
        const fileBuffer = await fs.readFile(filePath);

        // Set appropriate headers for file download
        const headers = new Headers();
        headers.set('Content-Type', fileInfo.mimeType || 'application/octet-stream');
        headers.set('Content-Disposition', `attachment; filename="${fileInfo.originalName}"`);
        headers.set('Content-Length', fileInfo.size.toString());

        return new NextResponse(fileBuffer, {
            status: 200,
            headers
        });

    } catch (error) {
        console.error('Error downloading file:', error);
        return NextResponse.json(
            { error: 'Failed to download file' },
            { status: 500 }
        );
    } finally {
        await prisma.$disconnect();
    }
}
