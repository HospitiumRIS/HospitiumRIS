import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { getUserId } from '@/lib/auth-server';

const prisma = new PrismaClient();

// GET /api/publications/preprints - List all preprint submissions
export async function GET(request) {
    try {
        const userId = await getUserId(request);

        if (!userId) {
            return NextResponse.json(
                { success: false, error: 'Unauthorized. Please log in.' },
                { status: 401 }
            );
        }

        const { searchParams } = new URL(request.url);
        const server = searchParams.get('server');
        const status = searchParams.get('status');
        const search = searchParams.get('search');
        const page = parseInt(searchParams.get('page') || '1');
        const limit = parseInt(searchParams.get('limit') || '25');
        const sortBy = searchParams.get('sortBy') || 'submittedAt';
        const sortOrder = searchParams.get('sortOrder') || 'desc';

        // Build filter
        const where = { userId };
        if (server) where.server = server;
        if (status) where.status = status;
        
        // Add search filter - search across title, authors, and DOI
        if (search) {
            where.OR = [
                { title: { contains: search, mode: 'insensitive' } },
                { authors: { contains: search, mode: 'insensitive' } },
                { doi: { contains: search, mode: 'insensitive' } },
            ];
        }

        const [submissions, total] = await Promise.all([
            prisma.preprintSubmission.findMany({
                where,
                orderBy: { [sortBy]: sortOrder },
                skip: (page - 1) * limit,
                take: limit,
                select: {
                    id: true,
                    title: true,
                    authors: true,
                    articleType: true,
                    subject: true,
                    server: true,
                    serverName: true,
                    status: true,
                    doi: true,
                    serverUrl: true,
                    manuscriptFileName: true,
                    submittedAt: true,
                    publishedAt: true,
                    keywords: true,
                    license: true,
                },
            }),
            prisma.preprintSubmission.count({ where }),
        ]);

        return NextResponse.json({
            success: true,
            submissions,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit),
            },
        });
    } catch (error) {
        console.error('Error fetching preprint submissions:', error);
        return NextResponse.json(
            { success: false, error: error.message || 'Failed to fetch submissions' },
            { status: 500 }
        );
    }
}

// POST /api/publications/preprints - Save a new preprint submission
export async function POST(request) {
    try {
        const userId = await getUserId(request);

        if (!userId) {
            return NextResponse.json(
                { success: false, error: 'Unauthorized. Please log in.' },
                { status: 401 }
            );
        }

        const body = await request.json();
        const {
            title,
            authors,
            abstract,
            articleType,
            subject,
            keywords,
            license,
            server,
            serverName,
            manuscriptFileName,
            manuscriptFileSize,
            doi,
            serverUrl,
            osfNodeId,
            osfPreprintId,
            osfReviewsState,
            osfDateCreated,
            osfDateModified,
            osfDatePublished,
            osfDateLastTransitioned,
            osfIsPublished,
            osfIsPreprintOrphan,
            osfLicenseRecord,
            osfHasCoi,
            osfCoiStatement,
            osfHasDoi,
            osfArticleDoi,
            osfPreprintDoiCreated,
            osfPreprintDoiUrl,
            osfDownloadUrl,
            ethicsStatement,
            fundingStatement,
            status,
        } = body;

        if (!title || !authors || !server || !serverName) {
            return NextResponse.json(
                { success: false, error: 'Title, authors, server, and serverName are required.' },
                { status: 400 }
            );
        }

        const submission = await prisma.preprintSubmission.create({
            data: {
                userId,
                title,
                authors,
                abstract: abstract || '',
                articleType: articleType || null,
                subject: subject || null,
                keywords: keywords || [],
                license: license || null,
                server,
                serverName,
                manuscriptFileName: manuscriptFileName || null,
                manuscriptFileSize: manuscriptFileSize || null,
                doi: doi || null,
                serverUrl: serverUrl || null,
                osfNodeId: osfNodeId || null,
                osfPreprintId: osfPreprintId || null,
                osfReviewsState: osfReviewsState || null,
                osfDateCreated: osfDateCreated || null,
                osfDateModified: osfDateModified || null,
                osfDatePublished: osfDatePublished || null,
                osfDateLastTransitioned: osfDateLastTransitioned || null,
                osfIsPublished: osfIsPublished || null,
                osfIsPreprintOrphan: osfIsPreprintOrphan || null,
                osfLicenseRecord: osfLicenseRecord || null,
                osfHasCoi: osfHasCoi || null,
                osfCoiStatement: osfCoiStatement || null,
                osfHasDoi: osfHasDoi || null,
                osfArticleDoi: osfArticleDoi || null,
                osfPreprintDoiCreated: osfPreprintDoiCreated || null,
                osfPreprintDoiUrl: osfPreprintDoiUrl || null,
                osfDownloadUrl: osfDownloadUrl || null,
                ethicsStatement: ethicsStatement || null,
                fundingStatement: fundingStatement || null,
                status: status || 'PENDING',
            },
        });

        return NextResponse.json({ success: true, submission }, { status: 201 });
    } catch (error) {
        console.error('Error saving preprint submission:', error);
        return NextResponse.json(
            { success: false, error: error.message || 'Failed to save submission' },
            { status: 500 }
        );
    }
}
