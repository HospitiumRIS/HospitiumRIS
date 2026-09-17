import { NextResponse } from 'next/server';
import { getAuthenticatedUser } from '../../../../../../lib/auth-server';
import { getCollectionDb } from '../../../../../../lib/image-integrity-lab-units';

/**
 * PUT /api/researcher/image-integrity/collections/[id]
 */
export async function PUT(request, { params }) {
  try {
    const user = await getAuthenticatedUser(request);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    if (user.accountType !== 'RESEARCHER') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { id } = await params;
    const db = await getCollectionDb();
    const existing = await db.imageIntegrityCollection.findFirst({
      where: { id, userId: user.id },
    });
    if (!existing) {
      return NextResponse.json({ error: 'Collection not found.' }, { status: 404 });
    }

    const body = await request.json().catch(() => ({}));
    const name = body.name !== undefined ? String(body.name || '').trim() : existing.name;
    const description =
      body.description !== undefined ? String(body.description || '').trim() || null : existing.description;
    const color = body.color !== undefined ? String(body.color || '').trim() || null : existing.color;

    if (!name) {
      return NextResponse.json({ error: 'Collection name is required.' }, { status: 400 });
    }

    if (name.toLowerCase() !== existing.name.toLowerCase()) {
      const duplicate = await db.imageIntegrityCollection.findFirst({
        where: {
          userId: user.id,
          name: { equals: name, mode: 'insensitive' },
          NOT: { id: existing.id },
        },
      });
      if (duplicate) {
        return NextResponse.json({ error: 'You already have a collection with this name.' }, { status: 409 });
      }
    }

    const collection = await db.imageIntegrityCollection.update({
      where: { id: existing.id },
      data: { name, description, color },
    });

    return NextResponse.json({ success: true, collection });
  } catch (error) {
    console.error('Collection update error:', error);
    return NextResponse.json({ error: 'Failed to update collection' }, { status: 500 });
  }
}

/**
 * DELETE /api/researcher/image-integrity/collections/[id]
 * Unlinks cases; does not delete submissions.
 */
export async function DELETE(request, { params }) {
  try {
    const user = await getAuthenticatedUser(request);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    if (user.accountType !== 'RESEARCHER') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { id } = await params;
    const db = await getCollectionDb();
    const existing = await db.imageIntegrityCollection.findFirst({
      where: { id, userId: user.id },
    });
    if (!existing) {
      return NextResponse.json({ error: 'Collection not found.' }, { status: 404 });
    }

    if (typeof db.$transaction === 'function') {
      await db.$transaction([
        db.imageIntegrityCase.updateMany({
          where: { collectionId: existing.id },
          data: { collectionId: null },
        }),
        db.imageIntegrityCollection.delete({ where: { id: existing.id } }),
      ]);
    } else {
      await db.imageIntegrityCollection.delete({ where: { id: existing.id } });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Collection delete error:', error);
    return NextResponse.json({ error: 'Failed to delete collection' }, { status: 500 });
  }
}
