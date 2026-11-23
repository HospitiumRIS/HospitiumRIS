import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { ACTIVE_REGISTRATION_STATUSES } from '@/lib/training-scope';
import { requireSessionStaff } from '@/lib/training-sessions-server';

/**
 * GET /api/training/[id]/sessions/[sid]/roster
 * Participants of one session with their mark for it (#104). For the training's admins
 * and for facilitators of this session only; nothing about other sessions is returned.
 */
export async function GET(request, { params }) {
  try {
    const { id, sid } = await params;
    const access = await requireSessionStaff(request, id, sid);
    if (access.error) return access.error;

    const registrations = await prisma.trainingRegistration.findMany({
      where: { trainingId: id, status: { in: ACTIVE_REGISTRATION_STATUSES } },
      select: {
        id: true,
        user: { select: { givenName: true, familyName: true, email: true, researchProfile: { select: { department: true } } } },
        attendance: {
          where: { sessionId: sid },
          select: { status: true, method: true, checkedInAt: true, note: true },
        },
      },
      orderBy: [{ user: { givenName: 'asc' } }, { user: { familyName: 'asc' } }],
    });

    const { session, training } = access;
    return NextResponse.json({
      success: true,
      role: access.role,
      training: { id: training.id, title: training.title },
      session: {
        id: session.id,
        title: session.title,
        startsAt: session.startsAt,
        endsAt: session.endsAt,
        status: session.status,
        deliveryMode: session.deliveryMode,
        venue: session.venue,
      },
      participants: registrations.map((r) => ({
        registrationId: r.id,
        name: `${r.user.givenName} ${r.user.familyName}`.trim(),
        email: r.user.email,
        department: r.user.researchProfile?.department || null,
        attendance: r.attendance[0] || null,
      })),
    });
  } catch (error) {
    console.error('Loading session roster failed:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
