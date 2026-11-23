import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getAuthenticatedUser } from '@/lib/auth-server';
import { FACILITATOR_ROLE_LABELS, coversSession } from '@/lib/training-facilitators';

/**
 * GET /api/training/facilitating
 * The sessions the signed-in person facilitates (#104), grouped by training, with
 * attendance counts. Only their own assignments are read.
 */
export async function GET(request) {
  try {
    const user = await getAuthenticatedUser(request);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const mine = await prisma.trainingFacilitator.findMany({
      where: { userId: user.id, training: { status: { not: 'CANCELLED' } } },
      select: { trainingId: true, sessionId: true, role: true },
    });
    const trainingIds = [...new Set(mine.map((f) => f.trainingId))];
    if (!trainingIds.length) return NextResponse.json({ success: true, trainings: [] });

    const trainings = await prisma.training.findMany({
      where: { id: { in: trainingIds } },
      select: {
        id: true,
        title: true,
        code: true,
        startDate: true,
        endDate: true,
        status: true,
        _count: { select: { registrations: { where: { status: { in: ['REGISTERED', 'COMPLETED', 'NOT_COMPLETED'] } } } } },
        sessions: {
          orderBy: { startsAt: 'asc' },
          select: {
            id: true,
            title: true,
            startsAt: true,
            endsAt: true,
            status: true,
            deliveryMode: true,
            venue: true,
            _count: { select: { attendance: { where: { status: { in: ['PRESENT', 'LATE'] } } } } },
          },
        },
      },
      orderBy: { startDate: 'desc' },
    });

    const shaped = trainings.map((t) => {
      const rows = mine.filter((f) => f.trainingId === t.id);
      const sessions = t.sessions
        .filter((s) => rows.some((f) => coversSession(f, s.id)))
        .map((s) => ({
          id: s.id,
          title: s.title,
          startsAt: s.startsAt,
          endsAt: s.endsAt,
          status: s.status,
          deliveryMode: s.deliveryMode,
          venue: s.venue,
          present: s._count.attendance,
          role: FACILITATOR_ROLE_LABELS[(rows.find((f) => f.sessionId === s.id) || rows.find((f) => !f.sessionId))?.role] || null,
        }));
      return {
        id: t.id,
        title: t.title,
        code: t.code,
        startDate: t.startDate,
        endDate: t.endDate,
        status: t.status,
        participants: t._count.registrations,
        wholeTraining: rows.some((f) => !f.sessionId),
        sessions,
      };
    });
    return NextResponse.json({ success: true, trainings: shaped });
  } catch (error) {
    console.error('Loading facilitated sessions failed:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
