import { NextResponse } from 'next/server';
import { getAuthenticatedUser } from '../../../../../lib/auth-server';
import { getCollectionDb } from '../../../../../lib/image-integrity-lab-units';

/**
 * GET /api/researcher/image-integrity/collections
 */
export async function GET(request) {
  try {
    const user = await getAuthenticatedUser(request);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    if (user.accountType !== 'RESEARCHER') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const db = await getCollectionDb();
    const collections = await db.imageIntegrityCollection.findMany({
      where: { userId: user.id },
      orderBy: { name: 'asc' },
      include: { _count: { select: { cases: true } } },
    });

    return NextResponse.json({
      success: true,
      collections: collections.map((c) => ({
        id: c.id,
        name: c.name,
        description: c.description,
        color: c.color,
        submissionCount: c._count?.cases ?? c.submissionCount ?? 0,
        createdAt: c.createdAt,
        updatedAt: c.updatedAt,
      })),
    });
  } catch (error) {
    console.error('Collections list error:', error);
    return NextResponse.json({ error: 'Failed to load collections' }, { status: 500 });
  }
}

/**
 * POST /api/researcher/image-integrity/collections
 */
export async function POST(request) {
  try {
    const user = await getAuthenticatedUser(request);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    if (user.accountType !== 'RESEARCHER') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json().catch(() => ({}));
    const name = String(body.name || '').trim();
    const description = String(body.description || '').trim() || null;
    const color = String(body.color || '').trim() || null;

    if (!name) {
      return NextResponse.json({ error: 'Collection name is required.' }, { status: 400 });
    }

    const db = await getCollectionDb();
    const existing = await db.imageIntegrityCollection.findFirst({
      where: { userId: user.id, name: { equals: name, mode: 'insensitive' } },
    });
    if (existing) {
      return NextResponse.json(
        { error: 'You already have a collection with this name.', collection: existing },
        { status: 409 }
      );
    }

    const collection = await db.imageIntegrityCollection.create({
      data: { userId: user.id, name, description, color },
    });

    return NextResponse.json({ success: true, collection });
  } catch (error) {
    console.error('Collection create error:', error);
    return NextResponse.json({ error: 'Failed to create collection' }, { status: 500 });
  }
}
