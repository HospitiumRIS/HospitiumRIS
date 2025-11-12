import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { getCitationCount } from '../../../../services/citationService.js';

const prisma = new PrismaClient();

/**
 * Fetch and cache citation data for publications
 */
export async function POST(request) {
    try {
        const { publicationIds } = await request.json();
        
        if (!publicationIds || !Array.isArray(publicationIds)) {
            return NextResponse.json(
                { error: 'publicationIds array is required' },
                { status: 400 }
            );
        }

        // Fetch publications from database
        const publications = await prisma.publication.findMany({
            where: {
                id: { in: publicationIds }
            },
            select: {
                id: true,
                doi: true,
                title: true,
                year: true
            }
        });

        const citationData = {};

        // Fetch citations for each publication
        for (const pub of publications) {
            const citationCount = await getCitationCount(pub);
            citationData[pub.id] = citationCount;
        }

        return NextResponse.json({
            success: true,
            citations: citationData
        });

    } catch (error) {
        console.error('Error fetching citations:', error);
        return NextResponse.json(
            { error: 'Failed to fetch citations', details: error.message },
            { status: 500 }
        );
    } finally {
        await prisma.$disconnect();
    }
}

/**
 * Get citation count for a single publication
 */
export async function GET(request) {
    try {
        const { searchParams } = new URL(request.url);
        const publicationId = searchParams.get('id');
        const doi = searchParams.get('doi');

        if (!publicationId && !doi) {
            return NextResponse.json(
                { error: 'Publication ID or DOI is required' },
                { status: 400 }
            );
        }

        let publication;

        if (publicationId) {
            publication = await prisma.publication.findUnique({
                where: { id: publicationId },
                select: {
                    id: true,
                    doi: true,
                    title: true,
                    year: true
                }
            });
        } else if (doi) {
            publication = await prisma.publication.findFirst({
                where: { doi: doi },
                select: {
                    id: true,
                    doi: true,
                    title: true,
                    year: true
                }
            });
        }

        if (!publication) {
            return NextResponse.json(
                { error: 'Publication not found' },
                { status: 404 }
            );
        }

        const citationCount = await getCitationCount(publication);

        return NextResponse.json({
            success: true,
            publicationId: publication.id,
            citationCount
        });

    } catch (error) {
        console.error('Error fetching citation:', error);
        return NextResponse.json(
            { error: 'Failed to fetch citation', details: error.message },
            { status: 500 }
        );
    } finally {
        await prisma.$disconnect();
    }
}

