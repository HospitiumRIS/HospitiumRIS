import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { auditTraining } from '@/lib/training-audit';
import { requireSessionAdmin } from '@/lib/training-sessions-server';
import { FACILITATOR_ROLES, shapeFacilitator } from '@/lib/training-facilitators';

const INCLUDE = { user: { select: { givenName: true, familyName: true, email: true } } };

async function load(request, params) {
  const { id, fid } = await params;
  const access = await requireSessionAdmin(request, id);
  if (access.error) return access;
  const row = await prisma.trainingFacilitator.findUnique({ where: { id: fid }, include: INCLUDE });
  if (!row || row.trainingId !== id) return { error: NextResponse.json({ error: 'Facilitator not found' }, { status: 404 }) };
  return { ...access, row, id };
}

/** PUT /api/training/[id]/facilitators/[fid]: change role, title or certificate flag (#104). */
export async function PUT(request, { params }) {
  try {
    const ctx = await load(request, params);
    if (ctx.error) return ctx.error;
    const body = await request.json().catch(() => ({}));
    const data = {};
    if (body.role !== undefined) {
      if (!FACILITATOR_ROLES.includes(body.role)) return NextResponse.json({ error: 'Unknown role' }, { status: 400 });
      data.role = body.role;
    }
    if (body.title !== undefined) data.title = typeof body.title === 'string' && body.title.trim() ? body.title.trim().slice(0, 200) : null;
    if (body.showOnCertificate !== undefined) data.showOnCertificate = body.showOnCertificate === true;
    const row = await prisma.trainingFacilitator.update({ where: { id: ctx.row.id }, data, include: INCLUDE });
    await auditTraining({
      trainingId: ctx.id,
      actorId: ctx.user.id,
      action: 'FACILITATOR_UPDATED',
      entityType: 'TrainingFacilitator',
      entityId: row.id,
      before: shapeFacilitator(ctx.row),
      after: shapeFacilitator(row),
    });
    return NextResponse.json({ success: true, facilitator: shapeFacilitator(row) });
  } catch (error) {
    console.error('Updating facilitator failed:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/** DELETE /api/training/[id]/facilitators/[fid] */
export async function DELETE(request, { params }) {
  try {
    const ctx = await load(request, params);
    if (ctx.error) return ctx.error;
    await prisma.trainingFacilitator.delete({ where: { id: ctx.row.id } });
    await auditTraining({
      trainingId: ctx.id,
      actorId: ctx.user.id,
      action: 'FACILITATOR_REMOVED',
      entityType: 'TrainingFacilitator',
      entityId: ctx.row.id,
      before: shapeFacilitator(ctx.row),
    });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Removing facilitator failed:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
