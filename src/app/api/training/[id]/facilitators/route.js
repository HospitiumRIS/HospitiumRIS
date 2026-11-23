import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { auditTraining } from '@/lib/training-audit';
import { notifyTraining } from '@/lib/training-notify';
import { requireSessionAdmin } from '@/lib/training-sessions-server';
import { institutionMembersWhere } from '@/lib/training-assignment-server';
import { shapeFacilitator, sortFacilitators, validateFacilitator } from '@/lib/training-facilitators';

const INCLUDE = { user: { select: { givenName: true, familyName: true, email: true } } };

/** GET /api/training/[id]/facilitators: everyone facilitating the training or its sessions (#104). Admin only. */
export async function GET(request, { params }) {
  try {
    const { id } = await params;
    const access = await requireSessionAdmin(request, id);
    if (access.error) return access.error;
    const rows = await prisma.trainingFacilitator.findMany({ where: { trainingId: id }, include: INCLUDE });
    return NextResponse.json({ success: true, facilitators: sortFacilitators(rows).map(shapeFacilitator) });
  } catch (error) {
    console.error('Loading facilitators failed:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * POST /api/training/[id]/facilitators
 * Body: { userId? | name, email?, title?, role, sessionId?, showOnCertificate? }
 * Internal facilitators must be members of the training's institution.
 */
export async function POST(request, { params }) {
  try {
    const { id } = await params;
    const access = await requireSessionAdmin(request, id);
    if (access.error) return access.error;

    const sessions = await prisma.trainingSession.findMany({ where: { trainingId: id }, select: { id: true } });
    const input = validateFacilitator(await request.json().catch(() => ({})), { sessionIds: sessions.map((s) => s.id) });
    if (!input.ok) return NextResponse.json({ error: input.error }, { status: 400 });
    const data = input.data;

    if (data.userId) {
      const member = await prisma.user.findFirst({
        where: { id: data.userId, ...institutionMembersWhere(access.training.institutionId) },
        select: { id: true },
      });
      if (!member) return NextResponse.json({ error: 'Facilitators from your staff must be members of your institution' }, { status: 400 });
      const duplicate = await prisma.trainingFacilitator.findFirst({ where: { trainingId: id, userId: data.userId, sessionId: data.sessionId } });
      if (duplicate) return NextResponse.json({ error: 'Already a facilitator here' }, { status: 400 });
    }

    const row = await prisma.trainingFacilitator.create({
      data: { ...data, trainingId: id, createdBy: access.user.id },
      include: INCLUDE,
    });

    if (row.userId) {
      await notifyTraining('FACILITATOR_ASSIGNED', {
        userId: row.userId,
        trainingId: id,
        sessionId: row.sessionId,
        dedupeKey: `facilitator:${row.id}`,
        extra: { role: row.role },
      });
    }
    await auditTraining({
      trainingId: id,
      actorId: access.user.id,
      action: 'FACILITATOR_ADDED',
      entityType: 'TrainingFacilitator',
      entityId: row.id,
      after: shapeFacilitator(row),
    });
    return NextResponse.json({ success: true, facilitator: shapeFacilitator(row) }, { status: 201 });
  } catch (error) {
    console.error('Adding facilitator failed:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
