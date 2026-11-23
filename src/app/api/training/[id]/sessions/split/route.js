import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { auditTraining } from '@/lib/training-audit';
import { buildDailySessions } from '@/lib/training-sessions';
import { requireSessionAdmin, serializeSession } from '@/lib/training-sessions-server';

/**
 * POST /api/training/[id]/sessions/split
 * Replace the training's sessions with one session per day of the training.
 * Body: { confirm: true } (required, because existing sessions are replaced).
 * Training admin only.
 */
export async function POST(request, { params }) {
  try {
    const { id } = await params;
    const access = await requireSessionAdmin(request, id);
    if (access.error) return access.error;
    const { user, training } = access;

    const body = await request.json().catch(() => null);
    if (body?.confirm !== true) {
      return NextResponse.json({ error: 'Confirm replacing the existing sessions' }, { status: 400 });
    }

    const daily = buildDailySessions(training);
    if (daily.length === 0) {
      return NextResponse.json({ error: 'The training dates are not valid' }, { status: 400 });
    }

    const existing = await prisma.trainingSession.findMany({
      where: { trainingId: id },
      select: { id: true, title: true },
    });

    const created = await prisma.$transaction(async (tx) => {
      await tx.trainingSession.deleteMany({ where: { trainingId: id } });
      const rows = [];
      for (const session of daily) {
        rows.push(await tx.trainingSession.create({
          data: { ...session, trainingId: id, createdBy: user.id },
          include: { module: { select: { id: true, title: true } } },
        }));
      }
      return rows;
    });

    await auditTraining({
      trainingId: id,
      actorId: user.id,
      action: 'SESSIONS_SPLIT_DAILY',
      entityType: 'Training',
      entityId: id,
      before: { sessions: existing.length },
      after: { sessions: created.length },
    });

    return NextResponse.json({
      success: true,
      sessions: created.map((s) => serializeSession(s, training, { canSeeLink: true })),
    });
  } catch (error) {
    console.error('Error splitting training sessions:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
