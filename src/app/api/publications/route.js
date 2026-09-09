import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getAuthenticatedUser } from '@/lib/auth-server';
import { userLibraryWhere, removePublicationFromUserLibrary } from '@/lib/publication-library';

export async function GET(request) {
  try {
    const user = await getAuthenticatedUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search');
    const type = searchParams.get('type');
    const limitParam = searchParams.get('limit');
    const take = limitParam ? Math.min(500, parseInt(limitParam, 10) || 50) : undefined;
    const offset = parseInt(searchParams.get('offset'), 10) || 0;

    const where = {
      ...userLibraryWhere(user.id),
    };

    if (search) {
      where.AND = [
        {
          OR: [
            { title: { contains: search, mode: 'insensitive' } },
            { abstract: { contains: search, mode: 'insensitive' } },
            { journal: { contains: search, mode: 'insensitive' } },
            { authors: { hasSome: [search] } },
          ],
        },
      ];
    }

    if (type) {
      where.type = type;
    }

    const [publications, totalCount] = await Promise.all([
      prisma.publication.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        ...(take ? { take, skip: offset } : {}),
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
          isbn: true,
        },
      }),
      prisma.publication.count({ where }),
    ]);

    const transformedPublications = publications.map((pub) => ({
      ...pub,
      publicationType: pub.type,
      authors: Array.isArray(pub.authors) ? pub.authors.join(', ') : pub.authors || '',
    }));

    return NextResponse.json({
      success: true,
      publications: transformedPublications,
      pagination: {
        total: totalCount,
        limit: take || totalCount,
        offset,
        hasMore: take ? offset + take < totalCount : false,
      },
    });
  } catch (error) {
    console.error('Error fetching publications:', error);
    return NextResponse.json(
      { error: 'Failed to fetch publications' },
      { status: 500 }
    );
  }
}

export async function DELETE(request) {
  try {
    const user = await getAuthenticatedUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: 'Publication ID is required' },
        { status: 400 }
      );
    }

    const removed = await removePublicationFromUserLibrary(user.id, id);
    if (!removed) {
      return NextResponse.json(
        { error: 'Publication not found in your library' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Publication removed from your library',
    });
  } catch (error) {
    console.error('Error deleting publication:', error);
    return NextResponse.json(
      { error: 'Failed to delete publication' },
      { status: 500 }
    );
  }
}
