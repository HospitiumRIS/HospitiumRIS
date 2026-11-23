import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireSessionAdmin } from '@/lib/training-sessions-server';
import { issueCertificates } from '@/lib/training-certificates-server';

const MAX_PER_REQUEST = 200;

/**
 * POST /api/training/[id]/certificates/generate
 * Body: { registrationIds: string[] } or { all: true } (everyone completed without a
 * certificate). Generates the PDFs, numbers them and notifies participants (#99).
 * Training admin only. At most 200 per request; the response says how many remain.
 */
export async function POST(request, { params }) {
  try {
    const { id } = await params;
    const access = await requireSessionAdmin(request, id);
    if (access.error) return access.error;

    const body = await request.json().catch(() => ({}));
    let ids;
    if (body?.all === true) {
      const ready = await prisma.trainingRegistration.findMany({
        where: {
          trainingId: id,
          status: 'COMPLETED',
          OR: [{ certificate: null }, { certificate: { certificateUrl: '' } }],
        },
        select: { id: true },
        orderBy: { registeredAt: 'asc' },
      });
      ids = ready.map((r) => r.id);
    } else if (Array.isArray(body?.registrationIds)) {
      const requested = [...new Set(body.registrationIds.filter((x) => typeof x === 'string'))];
      const own = await prisma.trainingRegistration.findMany({
        where: { id: { in: requested }, trainingId: id },
        select: { id: true },
      });
      ids = own.map((r) => r.id);
    } else {
      return NextResponse.json({ error: 'Pass registrationIds or all: true' }, { status: 400 });
    }

    const batch = ids.slice(0, MAX_PER_REQUEST);
    const results = await issueCertificates(batch, { actor: access.user });
    return NextResponse.json({ success: true, ...results, remaining: Math.max(0, ids.length - batch.length) });
  } catch (error) {
    console.error('Error generating certificates:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
