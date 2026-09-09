import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getAuthenticatedUser } from '@/lib/auth-server';
import {
  findExistingPublication,
  userOwnsPublication,
  addPublicationToUserLibrary,
  userLibraryWhere,
} from '@/lib/publication-library';

export async function POST(request) {
  try {
    const user = await getAuthenticatedUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { publication, publications } = body;
    const publicationsToImport = publications || (publication ? [publication] : []);

    if (!publicationsToImport.length) {
      return NextResponse.json(
        { error: 'Publication data is required' },
        { status: 400 }
      );
    }

    const createdPublications = [];
    const errors = [];
    const isSingle = publicationsToImport.length === 1;

    for (let i = 0; i < publicationsToImport.length; i++) {
      const pub = publicationsToImport[i];

      try {
        if (!pub.title) {
          errors.push(`Publication ${i + 1}: Missing title`);
          continue;
        }

        const existingPublication = await findExistingPublication(pub);

        if (existingPublication) {
          const alreadyOwned = await userOwnsPublication(user.id, existingPublication.id);
          if (alreadyOwned) {
            if (isSingle) {
              return NextResponse.json(
                {
                  error: 'DUPLICATE_PUBLICATION',
                  message: 'This publication already exists in your library',
                  existingPublication,
                  duplicate: true,
                },
                { status: 409 }
              );
            }
            errors.push(`Publication ${i + 1}: Already in your library`);
            continue;
          }

          await addPublicationToUserLibrary(user.id, existingPublication.id);
          createdPublications.push(existingPublication);
          continue;
        }

        const createdPublication = await prisma.publication.create({
          data: {
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
            year: pub.year ? parseInt(pub.year, 10) : null,
            publicationDate: pub.publicationDate ? new Date(pub.publicationDate) : null,
            status: 'PUBLISHED',
            source: pub.source || 'Unknown',
            authorId: pub.authorId || null,
          },
        });

        await addPublicationToUserLibrary(user.id, createdPublication.id);
        createdPublications.push(createdPublication);
      } catch (pubError) {
        console.error(`Error importing publication ${i + 1}:`, pubError);
        if (pubError.code === 'P2002') {
          errors.push(`Publication ${i + 1}: Already exists in database`);
        } else {
          errors.push(`Publication ${i + 1}: ${pubError.message}`);
        }
      }
    }

    const response = {
      success: createdPublications.length > 0,
      imported: createdPublications.length,
      total: publicationsToImport.length,
      publications: createdPublications,
      errors,
      message: `Successfully imported ${createdPublications.length} of ${publicationsToImport.length} publications`,
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
  }
}

export async function GET(request) {
  try {
    const user = await getAuthenticatedUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const checkDuplicate = searchParams.get('checkDuplicate');

    if (checkDuplicate === 'true') {
      const doi = searchParams.get('doi');
      const pubmedId = searchParams.get('pubmedId');
      const title = searchParams.get('title');
      const year = searchParams.get('year');

      const existingPublication = await findExistingPublication({
        doi,
        pubmedId,
        title,
        year,
      });

      const owned = existingPublication
        ? await userOwnsPublication(user.id, existingPublication.id)
        : false;

      return NextResponse.json({
        exists: owned,
        publication: owned ? existingPublication : null,
      });
    }

    const publications = await prisma.publication.findMany({
      where: userLibraryWhere(user.id),
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({
      success: true,
      publications,
    });
  } catch (error) {
    console.error('Error fetching publications:', error);
    return NextResponse.json(
      { error: 'Failed to fetch publications' },
      { status: 500 }
    );
  }
}
