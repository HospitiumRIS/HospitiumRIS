import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(request) {
    try {
        // TODO: Add proper authentication when auth is set up
        // For now, we'll fetch all publications for development
        const session = { user: { id: 'dev-user-id', orcidId: null } };

        const { searchParams } = new URL(request.url);
        const search = searchParams.get('search') || '';
        const type = searchParams.get('type') || '';
        const limit = parseInt(searchParams.get('limit')) || 100;
        const offset = parseInt(searchParams.get('offset')) || 0;

        // Build where clause for filtering
        const where = {};
        
        if (search) {
            where.OR = [
                { title: { contains: search, mode: 'insensitive' } },
                { authors: { hasSome: [search] } },
                { journal: { contains: search, mode: 'insensitive' } },
                { keywords: { hasSome: [search] } },
                { abstract: { contains: search, mode: 'insensitive' } }
            ];
        }

        if (type && type !== 'all') {
            where.type = { equals: type, mode: 'insensitive' };
        }

        // Fetch publications with filtering and pagination
        const publications = await prisma.publication.findMany({
            where,
            orderBy: {
                createdAt: 'desc'
            },
            take: limit,
            skip: offset,
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
        });

        // Get total count for pagination
        const totalCount = await prisma.publication.count({ where });

        // Transform data for citation library format
        const citations = publications.map(pub => ({
            id: pub.id,
            type: mapPublicationType(pub.type),
            title: pub.title,
            authors: pub.authors || [],
            journal: pub.journal,
            year: pub.year,
            volume: pub.volume,
            issue: null, // Not in current schema
            pages: pub.pages,
            doi: pub.doi,
            publisher: pub.type === 'book' ? 'Academic Press' : null, // Default for books
            conference: pub.type === 'conference' ? pub.journal : null,
            book: pub.type === 'book_chapter' ? pub.journal : null,
            editors: [], // Not in current schema
            chapter: null, // Not in current schema
            location: null, // Not in current schema
            isbn: pub.isbn,
            url: pub.url,
            abstract: pub.abstract,
            keywords: pub.keywords || [],
            source: pub.source || 'manual',
            dateAdded: pub.createdAt.toISOString().split('T')[0],
            tags: generateTags(pub)
        }));

        return NextResponse.json({
            success: true,
            citations,
            pagination: {
                total: totalCount,
                limit,
                offset,
                hasMore: offset + publications.length < totalCount
            }
        });

    } catch (error) {
        console.error('Error fetching citations:', error);
        return NextResponse.json(
            { error: 'Failed to fetch citations' },
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
    
    // Add journal-based tags for journal articles
    if (pub.journal && pub.type === 'journal') {
        const journalTag = pub.journal.toLowerCase()
            .replace(/journal of /i, '')
            .replace(/\s+/g, '-')
            .substring(0, 15); // Limit length
        tags.push(journalTag);
    }
    
    return [...new Set(tags)]; // Remove duplicates
}
