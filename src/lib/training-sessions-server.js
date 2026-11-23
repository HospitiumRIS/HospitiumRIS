import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getAuthenticatedUser } from '@/lib/auth-server';
import { isTrainingAdmin, requireTrainingAdminAccess, resolveTrainingViewer } from '@/lib/training-admin-server';
import { facilitatesSession } from '@/lib/training-facilitators';
import { isActiveRegistration } from '@/lib/training-scope';
import { effectiveSessionDelivery } from '@/lib/training-sessions';

/**
 * Load a training and check the caller administers it (#91).
 * @returns {{ user, training } | { error: NextResponse }}
 */
export async function requireSessionAdmin(request, trainingId) {
  const user = await getAuthenticatedUser(request);
  if (!user) {
    return { error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) };
  }
  const training = await prisma.training.findUnique({ where: { id: trainingId } });
  if (!training) {
    return { error: NextResponse.json({ error: 'Training not found' }, { status: 404 }) };
  }
  const access = await requireTrainingAdminAccess(user, training);
  if (access.error) return { error: access.error };
  return { user, training };
}

/**
 * Load a training and check the caller may run one of its sessions (#104): its admins,
 * or an internal facilitator assigned to that session (or to the whole training).
 * Anyone else gets a 404, so unassigned sessions don't reveal themselves.
 * @returns {{ user, training, session, role: 'admin'|'facilitator' } | { error: NextResponse }}
 */
export async function requireSessionStaff(request, trainingId, sessionId) {
  const user = await getAuthenticatedUser(request);
  if (!user) {
    return { error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) };
  }
  const notFound = { error: NextResponse.json({ error: 'Session not found' }, { status: 404 }) };
  const [training, session] = await Promise.all([
    prisma.training.findUnique({ where: { id: trainingId } }),
    prisma.trainingSession.findUnique({ where: { id: sessionId } }),
  ]);
  if (!training || !session || session.trainingId !== trainingId) return notFound;

  if (isTrainingAdmin(user)) {
    const access = await requireTrainingAdminAccess(user, training);
    if (!access.error) return { user, training, session, role: 'admin' };
  }
  const facilitators = await prisma.trainingFacilitator.findMany({
    where: { trainingId, userId: user.id },
    select: { userId: true, sessionId: true },
  });
  if (facilitatesSession(facilitators, user.id, sessionId)) return { user, training, session, role: 'facilitator' };
  return notFound;
}

/**
 * Shape a session for the viewer. The meeting link is only shown to the training's
 * admins and to people with an active registration.
 */
export function serializeSession(session, training, { canSeeLink }) {
  const effective = effectiveSessionDelivery(session, training);
  return {
    ...session,
    onlineLink: canSeeLink ? session.onlineLink : null,
    effective: {
      deliveryMode: effective.deliveryMode,
      venue: effective.venue,
      onlineLink: canSeeLink ? effective.onlineLink : null,
      hasOnlineLink: Boolean(effective.onlineLink),
    },
  };
}

export async function listSessionsForViewer(user, training) {
  const viewer = await resolveTrainingViewer(user, training);
  if (!viewer.canView) return { error: 'not_found' };

  const sessions = await prisma.trainingSession.findMany({
    where: viewer.isAdmin ? { trainingId: training.id } : { trainingId: training.id, status: 'SCHEDULED' },
    orderBy: [{ startsAt: 'asc' }, { order: 'asc' }],
    include: { module: { select: { id: true, title: true } } },
  });
  const canSeeLink = viewer.isAdmin || isActiveRegistration(viewer.registration);
  return {
    viewer,
    sessions: sessions.map((s) => serializeSession(s, training, { canSeeLink })),
  };
}

export async function trainingModuleIds(trainingId) {
  const modules = await prisma.trainingModule.findMany({ where: { trainingId }, select: { id: true } });
  return modules.map((m) => m.id);
}

/** Fields worth recording in the activity log. */
export function sessionAuditSnapshot(session) {
  if (!session) return null;
  return {
    title: session.title,
    startsAt: session.startsAt,
    endsAt: session.endsAt,
    deliveryMode: session.deliveryMode,
    venue: session.venue,
    status: session.status,
    moduleId: session.moduleId,
  };
}
