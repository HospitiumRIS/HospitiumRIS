import { NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import prisma from '../../../../../../lib/prisma';
import { requireAuth } from '../../../../../../lib/auth-server';
import { canAccessProposal, resolveProposalFilePath } from '../../../../../../lib/proposal-files';
import { sanitizeFileName } from '../../../../../../lib/sanitize-file-name';

export async function GET(request, { params }) {
    try {
        const auth = await requireAuth(request);
        if (auth.error) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { id, fileName: rawFileName } = await params;
        const fileName = sanitizeFileName(rawFileName);

        const proposal = await prisma.proposal.findUnique({
            where: { id }
        });

        if (!proposal || !canAccessProposal(auth.user, proposal)) {
            return NextResponse.json({ error: 'Not found' }, { status: 404 });
        }

        let fileInfo = null;

        for (const arr of [proposal.ethicsDocuments, proposal.dataManagementPlan, proposal.otherRelatedFiles]) {
            if (!arr) continue;
            fileInfo = arr.find((file) => sanitizeFileName(file.fileName) === fileName);
            if (fileInfo) break;
        }

        if (!fileInfo) {
            return NextResponse.json({ error: 'Not found' }, { status: 404 });
        }

        const filePath = resolveProposalFilePath(fileInfo);
        if (!filePath) {
            return NextResponse.json({ error: 'Not found' }, { status: 404 });
        }

        try {
            await fs.access(filePath);
        } catch {
            return NextResponse.json({ error: 'Not found' }, { status: 404 });
        }

        const fileBuffer = await fs.readFile(filePath);
        const safeOriginalName = String(fileInfo.originalName || fileName).replace(/"/g, '');

        const headers = new Headers();
        headers.set('Content-Type', fileInfo.mimeType || 'application/octet-stream');
        headers.set('Content-Disposition', `attachment; filename="${safeOriginalName}"`);
        headers.set('Content-Length', String(fileBuffer.length));
        headers.set('Cache-Control', 'private, no-store');

        return new NextResponse(fileBuffer, { status: 200, headers });
    } catch (error) {
        console.error('Error downloading file:', error);
        return NextResponse.json({ error: 'Failed to download file' }, { status: 500 });
    }
}
