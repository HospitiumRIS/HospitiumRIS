import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(request) {
    try {
        // TODO: Add proper authentication when auth is set up
        const session = { user: { id: 'dev-user-id', orcidId: null } };

        const { searchParams } = new URL(request.url);
        const search = searchParams.get('search');
        const type = searchParams.get('type');
        const limit = parseInt(searchParams.get('limit')) || 50;
        const offset = parseInt(searchParams.get('offset')) || 0;

        // Build the where clause for filtering
        const where = {};

        if (search) {
            where.OR = [
                {
                    title: {
                        contains: search,
                        mode: 'insensitive'
                    }
                },
                {
                    abstract: {
                        contains: search,
                        mode: 'insensitive'
                    }
                },
                {
                    journal: {
                        contains: search,
                        mode: 'insensitive'
                    }
                },
                {
                    authors: {
                        hasSome: [search] // Search in authors array
                    }
                }
            ];
        }

        if (type) {
            where.type = type;
        }

        // Get publications with filtering and pagination
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
                authors: true,
                journal: true,
                year: true,
                doi: true,
                abstract: true,
                type: true,
                publicationDate: true,
                keywords: true,
                url: true,
                pages: true,
                volume: true,
                isbn: true
            }
        });

        // Get total count for pagination
        const totalCount = await prisma.publication.count({ where });

        // Transform the data to match the expected format
        const transformedPublications = publications.map(pub => ({
            ...pub,
            publicationType: pub.type, // Map type to publicationType for consistency
            authors: Array.isArray(pub.authors) ? pub.authors.join(', ') : pub.authors || ''
        }));

        return NextResponse.json({
            success: true,
            publications: transformedPublications,
            pagination: {
                total: totalCount,
                limit,
                offset,
                hasMore: offset + limit < totalCount
            }
        });

    } catch (error) {
        console.error('Error fetching publications:', error);
        return NextResponse.json(
            { error: 'Failed to fetch publications' },
            { status: 500 }
        );
    } finally {
        await prisma.$disconnect();
    }
}
