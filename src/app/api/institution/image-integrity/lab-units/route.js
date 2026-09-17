import { NextResponse } from 'next/server';
import {
  requireInstitutionImageIntegrityAccess,
} from '@/lib/image-integrity-institution';
import { getIntegrityDb, institutionIdForLabUnits } from '@/lib/image-integrity-lab-units';

/**
 * GET /api/institution/image-integrity/lab-units
 */
export async function GET(request) {
  try {
    const auth = await requireInstitutionImageIntegrityAccess(request);
    if (auth.errorResponse) return auth.errorResponse;

    const institutionId = await institutionIdForLabUnits(auth.user);
    if (!institutionId) {
      return NextResponse.json({ error: 'No institution linked to this account.' }, { status: 403 });
    }

    const db = await getIntegrityDb();
    const labUnits = await db.imageIntegrityLabUnit.findMany({
      where: { institutionId },
      orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
      include: {
        _count: { select: { cases: true } },
      },
    });

    return NextResponse.json({
      success: true,
      labUnits: labUnits.map((unit) => ({
        id: unit.id,
        name: unit.name,
        description: unit.description,
        isActive: unit.isActive,
        sortOrder: unit.sortOrder,
        submissionCount: unit._count?.cases ?? 0,
        createdAt: unit.createdAt,
        updatedAt: unit.updatedAt,
      })),
    });
  } catch (error) {
    console.error('Lab units list error:', error);
    return NextResponse.json({ error: 'Failed to load lab/units' }, { status: 500 });
  }
}

/**
 * POST /api/institution/image-integrity/lab-units
 */
export async function POST(request) {
  try {
    const auth = await requireInstitutionImageIntegrityAccess(request);
    if (auth.errorResponse) return auth.errorResponse;

    const institutionId = await institutionIdForLabUnits(auth.user);
    if (!institutionId) {
      return NextResponse.json({ error: 'No institution linked to this account.' }, { status: 403 });
    }

    const db = await getIntegrityDb();
    const body = await request.json().catch(() => ({}));
    const name = String(body.name || '').trim();
    const description = String(body.description || '').trim() || null;
    const isActive = body.isActive !== false;
    const sortOrder = Number.isFinite(Number(body.sortOrder)) ? Number(body.sortOrder) : 0;

    if (!name) {
      return NextResponse.json({ error: 'Name is required.' }, { status: 400 });
    }

    const existing = await db.imageIntegrityLabUnit.findFirst({
      where: { institutionId, name: { equals: name, mode: 'insensitive' } },
    });
    if (existing) {
      return NextResponse.json({ error: 'A lab/unit with this name already exists.' }, { status: 409 });
    }

    const labUnit = await db.imageIntegrityLabUnit.create({
      data: { institutionId, name, description, isActive, sortOrder },
    });

    return NextResponse.json({ success: true, labUnit });
  } catch (error) {
    console.error('Lab unit create error:', error);
    return NextResponse.json({ error: 'Failed to create lab/unit' }, { status: 500 });
  }
}
