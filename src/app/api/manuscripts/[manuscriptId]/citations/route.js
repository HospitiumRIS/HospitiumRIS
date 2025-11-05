import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// GET - Fetch all citations for a specific manuscript
export async function GET(request, { params }) {
    try {
        const { manuscriptId } = params;
        
        if (!manuscriptId) {
            return NextResponse.json(
                { error: 'Manuscript ID is required' },
                { status: 400 }
            );
        }

        // TODO: Add proper authentication and check if user has access to this manuscript
        const session = { user: { id: 'dev-user-id' } };

        // Fetch manuscript citations with publication details
        const manuscriptCitations = await prisma.manuscriptCitation.findMany({
            where: {
                manuscriptId: manuscriptId
            },
            include: {
                publication: {
                    select: {
                        id: true,
                        title: true,
                        type: true,
                        field: true,
                        journal: true,
                        abstract: true,
                        authors: true,
                        doi: true,
                        isbn: true,
                        url: true,
                        keywords: true,
                        pages: true,
                        volume: true,
                        year: true,
                        publicationDate: true,
                        status: true,
                        source: true,
                        createdAt: true,
                        updatedAt: true
                    }
                }
            },
            orderBy: {
                createdAt: 'desc'
            }
        });

        // Transform data for citation library format
        const citations = manuscriptCitations.map(mc => {
            const pub = mc.publication;
            return {
                id: pub.id,
                manuscriptCitationId: mc.id,
                type: mapPublicationType(pub.type),
                title: pub.title,
                authors: pub.authors || [],
                journal: pub.journal,
                year: pub.year,
                volume: pub.volume,
                issue: null,
                pages: pub.pages,
                doi: pub.doi,
                publisher: pub.type === 'book' ? 'Academic Press' : null,
                conference: pub.type === 'conference' ? pub.journal : null,
                book: pub.type === 'book_chapter' ? pub.journal : null,
                editors: [],
                chapter: null,
                location: null,
                isbn: pub.isbn,
                url: pub.url,
                abstract: pub.abstract,
                keywords: pub.keywords || [],
                source: pub.source || 'manual',
                dateAdded: mc.createdAt.toISOString().split('T')[0],
                citationCount: mc.citationCount,
                lastCited: mc.updatedAt.toISOString().split('T')[0],
                tags: generateTags(pub)
            };
        });

        return NextResponse.json({
            success: true,
            citations,
            manuscriptId,
            totalCount: citations.length
        });

    } catch (error) {
        console.error('Error fetching manuscript citations:', error);
        return NextResponse.json(
            { error: 'Failed to fetch manuscript citations' },
            { status: 500 }
        );
    } finally {
        await prisma.$disconnect();
    }
}

// POST - Add a citation to the manuscript library
export async function POST(request, { params }) {
    try {
        const { manuscriptId } = params;
        const body = await request.json();
        const { publicationId } = body;
        
        if (!manuscriptId || !publicationId) {
            return NextResponse.json(
                { error: 'Manuscript ID and Publication ID are required' },
                { status: 400 }
            );
        }

        // TODO: Add proper authentication and check if user has access to this manuscript
        const session = { user: { id: 'dev-user-id' } };

        // Check if citation already exists
        const existingCitation = await prisma.manuscriptCitation.findUnique({
            where: {
                manuscriptId_publicationId: {
                    manuscriptId: manuscriptId,
                    publicationId: publicationId
                }
            }
        });

        if (existingCitation) {
            // Update citation count and last cited date
            const updatedCitation = await prisma.manuscriptCitation.update({
                where: {
                    id: existingCitation.id
                },
                data: {
                    citationCount: existingCitation.citationCount + 1,
                    updatedAt: new Date()
                }
            });

            return NextResponse.json({
                success: true,
                message: 'Citation count updated',
                citation: updatedCitation,
                isNew: false
            });
        } else {
            // Create new manuscript citation
            const newCitation = await prisma.manuscriptCitation.create({
                data: {
                    manuscriptId: manuscriptId,
                    publicationId: publicationId,
                    citationCount: 1
                }
            });

            return NextResponse.json({
                success: true,
                message: 'Citation added to manuscript library',
                citation: newCitation,
                isNew: true
            });
        }

    } catch (error) {
        console.error('Error adding manuscript citation:', error);
        console.error('Full error details:', {
            message: error.message,
            code: error.code,
            stack: error.stack,
            manuscriptId,
            publicationId
        });
        return NextResponse.json(
            { 
                error: 'Failed to add citation to manuscript library',
                details: error.message,
                code: error.code 
            },
            { status: 500 }
        );
    } finally {
        await prisma.$disconnect();
    }
}

// DELETE - Remove a citation from the manuscript library
export async function DELETE(request, { params }) {
    try {
        const { manuscriptId } = params;
        const { searchParams } = new URL(request.url);
        const publicationId = searchParams.get('publicationId');
        
        if (!manuscriptId || !publicationId) {
            return NextResponse.json(
                { error: 'Manuscript ID and Publication ID are required' },
                { status: 400 }
            );
        }

        // TODO: Add proper authentication and check if user has access to this manuscript
        const session = { user: { id: 'dev-user-id' } };

        // Delete manuscript citation
        await prisma.manuscriptCitation.delete({
            where: {
                manuscriptId_publicationId: {
                    manuscriptId: manuscriptId,
                    publicationId: publicationId
                }
            }
        });

        return NextResponse.json({
            success: true,
            message: 'Citation removed from manuscript library'
        });

    } catch (error) {
        console.error('Error removing manuscript citation:', error);
        return NextResponse.json(
            { error: 'Failed to remove citation from manuscript library' },
            { status: 500 }
        );
    } finally {
        await prisma.$disconnect();
    }
}

// Helper function to map database publication types to citation types
function mapPublicationType(dbType) {
    if (!dbType) return 'journal';
    
    const type = dbType.toLowerCase();
    if (type.includes('journal') || type.includes('article')) return 'journal';
    if (type.includes('book') && type.includes('chapter')) return 'book_chapter';
    if (type.includes('book')) return 'book';
    if (type.includes('conference') || type.includes('proceeding')) return 'conference';
    
    return 'journal'; // Default fallback
}

// Helper function to generate tags based on publication data
function generateTags(pub) {
    const tags = [];
    
    // Add source tag
    if (pub.source) {
        tags.push(pub.source.toLowerCase());
    }
    
    // Add field-based tags
    if (pub.field) {
        tags.push(pub.field.toLowerCase().replace(/\s+/g, '-'));
    }
    
    // Add keyword tags (first 3 keywords)
    if (pub.keywords && pub.keywords.length > 0) {
        tags.push(...pub.keywords.slice(0, 3).map(k => k.toLowerCase()));
    }
    
    // Add type-based tags
    if (pub.type) {
        tags.push(pub.type.toLowerCase());
    }
    
    return [...new Set(tags)]; // Remove duplicates
}
