import { NextResponse } from 'next/server';
import { requireInstitutionImageIntegrityAccess } from '@/lib/image-integrity-institution';
import { getIntegrityDb, institutionIdForLabUnits } from '@/lib/image-integrity-lab-units';

async function getScopedLabUnit(db, user, id) {
  const institutionId = await institutionIdForLabUnits(user);
  if (!institutionId) return null;
  return db.imageIntegrityLabUnit.findFirst({
    where: { id, institutionId },
  });
}

/**
 * PUT /api/institution/image-integrity/lab-units/[id]
 */
export async function PUT(request, { params }) {
  try {
    const auth = await requireInstitutionImageIntegrityAccess(request);
    if (auth.errorResponse) return auth.errorResponse;

    const { id } = await params;
    const db = await getIntegrityDb();
    const existing = await getScopedLabUnit(db, auth.user, id);
    if (!existing) {
      return NextResponse.json({ error: 'Lab/unit not found.' }, { status: 404 });
    }

    const body = await request.json().catch(() => ({}));
    const name = body.name !== undefined ? String(body.name || '').trim() : existing.name;
    const description =
      body.description !== undefined ? String(body.description || '').trim() || null : existing.description;
    const isActive = body.isActive !== undefined ? Boolean(body.isActive) : existing.isActive;
    const sortOrder =
      body.sortOrder !== undefined && Number.isFinite(Number(body.sortOrder))
        ? Number(body.sortOrder)
        : existing.sortOrder;

    if (!name) {
      return NextResponse.json({ error: 'Name is required.' }, { status: 400 });
    }

    if (name.toLowerCase() !== existing.name.toLowerCase()) {
      const duplicate = await db.imageIntegrityLabUnit.findFirst({
        where: {
          institutionId: existing.institutionId,
          name: { equals: name, mode: 'insensitive' },
          NOT: { id: existing.id },
        },
      });
      if (duplicate) {
        return NextResponse.json({ error: 'A lab/unit with this name already exists.' }, { status: 409 });
      }
    }

    const labUnit = await db.imageIntegrityLabUnit.update({
      where: { id: existing.id },
      data: { name, description, isActive, sortOrder },
    });

    return NextResponse.json({ success: true, labUnit });
  } catch (error) {
    console.error('Lab unit update error:', error);
    return NextResponse.json({ error: 'Failed to update lab/unit' }, { status: 500 });
  }
}

/**
 * DELETE /api/institution/image-integrity/lab-units/[id]
 * Soft-deactivates if submissions exist; hard-deletes when unused.
 */
export async function DELETE(request, { params }) {
  try {
    const auth = await requireInstitutionImageIntegrityAccess(request);
    if (auth.errorResponse) return auth.errorResponse;

    const { id } = await params;
    const db = await getIntegrityDb();
    const existing = await getScopedLabUnit(db, auth.user, id);
    if (!existing) {
      return NextResponse.json({ error: 'Lab/unit not found.' }, { status: 404 });
    }

    const caseCount = await db.imageIntegrityCase.count({ where: { labUnitId: existing.id } });
    if (caseCount > 0) {
      const labUnit = await db.imageIntegrityLabUnit.update({
        where: { id: existing.id },
        data: { isActive: false },
      });
      return NextResponse.json({
        success: true,
        deactivated: true,
        message: 'Lab/unit deactivated because submissions are still linked to it.',
        labUnit,
      });
    }

    await db.imageIntegrityLabUnit.delete({ where: { id: existing.id } });
    return NextResponse.json({ success: true, deleted: true });
  } catch (error) {
    console.error('Lab unit delete error:', error);
    return NextResponse.json({ error: 'Failed to delete lab/unit' }, { status: 500 });
  }
}
