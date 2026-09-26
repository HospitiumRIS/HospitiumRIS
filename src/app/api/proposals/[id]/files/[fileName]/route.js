import { NextResponse } from 'next/server';
import prisma from '../../../../../../lib/prisma';
import { requireAuth } from '../../../../../../lib/auth-server';
import {
  canAccessProposal,
  readProposalDocument,
} from '../../../../../../lib/proposal-files';
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

        if (fileInfo.fileId) {
            const target = new URL(`/api/files/${fileInfo.fileId}`, request.url);
            if (request.nextUrl.searchParams.get('download') === '1') {
                target.searchParams.set('download', '1');
            }
            return NextResponse.redirect(target, {
                status: 302,
                headers: { 'Cache-Control': 'private, no-store' },
            });
        }

        const file = await readProposalDocument(fileInfo, auth.user);
        if (!file) {
            return NextResponse.json({ error: 'Not found' }, { status: 404 });
        }

        const safeOriginalName = String(fileInfo.originalName || fileName).replace(/"/g, '');
        const headers = new Headers();
        headers.set('Content-Type', file.mimeType || fileInfo.mimeType || 'application/octet-stream');
        headers.set('Content-Disposition', `attachment; filename="${safeOriginalName}"`);
        headers.set('Content-Length', String(file.buffer.length));
        headers.set('Cache-Control', 'private, no-store');

        return new NextResponse(file.buffer, { status: 200, headers });
    } catch (error) {
        console.error('Error downloading file:', error);
        return NextResponse.json({ error: 'Failed to download file' }, { status: 500 });
    }
}
