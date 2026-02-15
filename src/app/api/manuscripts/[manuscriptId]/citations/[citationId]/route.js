import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// DELETE - Remove or decrement citation from manuscript
export async function DELETE(request, { params }) {
    try {
        const resolvedParams = await params;
        const { manuscriptId, citationId } = resolvedParams;
        
        if (!manuscriptId || !citationId) {
            return NextResponse.json(
                { error: 'Manuscript ID and Citation ID are required' },
                { status: 400 }
            );
        }

        // Find the manuscript citation
        const manuscriptCitation = await prisma.manuscriptCitation.findFirst({
            where: {
                manuscriptId: manuscriptId,
                publicationId: citationId
            }
        });

        if (!manuscriptCitation) {
            return NextResponse.json(
                { error: 'Citation not found in manuscript' },
                { status: 404 }
            );
        }

        // If citation count is 1, delete the record
        if (manuscriptCitation.citationCount <= 1) {
            await prisma.manuscriptCitation.delete({
                where: {
                    id: manuscriptCitation.id
                }
            });

            return NextResponse.json({
                success: true,
                message: 'Citation removed from manuscript',
                deleted: true
            });
        } else {
            // Otherwise, decrement the count
            const updated = await prisma.manuscriptCitation.update({
                where: {
                    id: manuscriptCitation.id
                },
                data: {
                    citationCount: {
                        decrement: 1
                    }
                }
            });

            return NextResponse.json({
                success: true,
                message: 'Citation count decremented',
                deleted: false,
                citationCount: updated.citationCount
            });
        }

    } catch (error) {
        console.error('Error deleting citation:', error);
        return NextResponse.json(
            { error: 'Failed to delete citation' },
            { status: 500 }
        );
    } finally {
        await prisma.$disconnect();
    }
}
