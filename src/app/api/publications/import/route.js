import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function POST(request) {
    try {
        // TODO: Add proper authentication when auth is set up
        // For now, we'll create publications without user association
        
        // Mock session for development - replace with real auth
        const session = { user: { id: 'dev-user-id', orcidId: null } };

        const body = await request.json();
        const { publication, publications } = body;

        // Handle both single publication and multiple publications
        const publicationsToImport = publications || (publication ? [publication] : []);

        if (!publicationsToImport || publicationsToImport.length === 0) {
            return NextResponse.json(
                { error: 'Publication data is required' },
                { status: 400 }
            );
        }

        const createdPublications = [];
        const errors = [];

        // Process each publication
        for (let i = 0; i < publicationsToImport.length; i++) {
            const pub = publicationsToImport[i];
            
            try {
                // Validate required fields
                if (!pub.title) {
                    errors.push(`Publication ${i + 1}: Missing title`);
                    continue;
                }

                // Check for duplicates before attempting to create
                let existingPublication = null;
                
                // First, try to find by DOI if available (most reliable)
                if (pub.doi) {
                    existingPublication = await prisma.publication.findFirst({
                        where: { doi: pub.doi }
                    });
                }
                
                // If no DOI match, try PubMed ID if available
                if (!existingPublication && pub.pubmedId) {
                    existingPublication = await prisma.publication.findFirst({
                        where: { 
                            url: {
                                contains: pub.pubmedId
                            }
                        }
                    });
                }
                
                // If still no match, check by title and year (less reliable but catches most duplicates)
                if (!existingPublication && pub.year) {
                    existingPublication = await prisma.publication.findFirst({
                        where: {
                            title: pub.title,
                            year: parseInt(pub.year)
                        }
                    });
                }
                
                // If publication already exists, return error response
                if (existingPublication) {
                    return NextResponse.json(
                        { 
                            error: 'DUPLICATE_PUBLICATION',
                            message: `This publication already exists in your library`,
                            existingPublication: existingPublication,
                            duplicate: true
                        },
                        { status: 409 } // 409 Conflict status code
                    );
                }

                // Transform the publication data for database storage
                const publicationData = {
                    title: pub.title,
                    type: pub.type || 'article',
                    field: pub.field || null,
                    journal: pub.journal || null,
                    abstract: pub.abstract || '',
                    authors: Array.isArray(pub.authors) ? pub.authors : [],
                    doi: pub.doi || null,
                    isbn: pub.isbn || null,
                    url: pub.url || null,
                    keywords: Array.isArray(pub.keywords) ? pub.keywords : [],
                    pages: pub.pages || null,
                    volume: pub.volume || null,
                    year: pub.year ? parseInt(pub.year) : null,
                    publicationDate: pub.publicationDate ? new Date(pub.publicationDate) : null,
                    status: 'PUBLISHED', // Default status for imported publications
                    source: pub.source || 'Unknown',
                    authorId: pub.authorId || null, // ORCID if available
                };

                // Create the publication in the database
                const createdPublication = await prisma.publication.create({
                    data: publicationData
                });

                createdPublications.push(createdPublication);

            } catch (pubError) {
                console.error(`Error importing publication ${i + 1}:`, pubError);
                
                // Handle specific database errors
                if (pubError.code === 'P2002') {
                    errors.push(`Publication ${i + 1}: Already exists in database`);
                } else {
                    errors.push(`Publication ${i + 1}: ${pubError.message}`);
                }
            }
        }

        // Skip user relation creation for now - to be implemented with proper auth
        // TODO: Add user-publication relations when authentication is properly set up

        const response = {
            success: createdPublications.length > 0,
            imported: createdPublications.length,
            total: publicationsToImport.length,
            publications: createdPublications,
            errors: errors,
            message: `Successfully imported ${createdPublications.length} of ${publicationsToImport.length} publications`
        };

        if (errors.length > 0) {
            response.warnings = errors;
        }

        return NextResponse.json(response);

    } catch (error) {
        console.error('Publication import error:', error);
        
        return NextResponse.json(
            { error: 'Failed to import publications. Please try again.' },
            { status: 500 }
        );
    } finally {
        await prisma.$disconnect();
    }
}

export async function GET(request) {
    try {
        // TODO: Add proper authentication when auth is set up
        const session = { user: { id: 'dev-user-id', orcidId: null } };

        // Check if this is a duplicate check request
        const { searchParams } = new URL(request.url);
        const checkDuplicate = searchParams.get('checkDuplicate');
        
        if (checkDuplicate === 'true') {
            // Extract publication identifiers from query params
            const doi = searchParams.get('doi');
            const pubmedId = searchParams.get('pubmedId');
            const title = searchParams.get('title');
            const year = searchParams.get('year');
            
            let existingPublication = null;
            
            // Check by DOI first (most reliable)
            if (doi) {
                existingPublication = await prisma.publication.findFirst({
                    where: { doi: doi }
                });
            }
            
            // Check by PubMed ID if no DOI match
            if (!existingPublication && pubmedId) {
                existingPublication = await prisma.publication.findFirst({
                    where: { 
                        url: {
                            contains: pubmedId
                        }
                    }
                });
            }
            
            // Check by title and year as fallback
            if (!existingPublication && title && year) {
                existingPublication = await prisma.publication.findFirst({
                    where: {
                        title: title,
                        year: parseInt(year)
                    }
                });
            }
            
            return NextResponse.json({
                exists: !!existingPublication,
                publication: existingPublication
            });
        }

        // Get all publications for now - to be filtered by user when auth is implemented
        const publications = await prisma.publication.findMany({
            orderBy: {
                createdAt: 'desc'
            }
        });

        return NextResponse.json({
            success: true,
            publications
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
