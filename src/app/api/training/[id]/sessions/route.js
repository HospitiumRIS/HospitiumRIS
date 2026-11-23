import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getAuthenticatedUser } from '@/lib/auth-server';
import { auditTraining } from '@/lib/training-audit';
import { validateSessionInput } from '@/lib/training-sessions';
import {
  listSessionsForViewer,
  requireSessionAdmin,
  sessionAuditSnapshot,
  serializeSession,
  trainingModuleIds,
} from '@/lib/training-sessions-server';

/**
 * GET /api/training/[id]/sessions
 * Sessions of a training. Admins of the owning institution see cancelled sessions too;
 * meeting links are only returned to admins and active registrants (#91).
 */
export async function GET(request, { params }) {
  try {
    const user = await getAuthenticatedUser(request);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id } = await params;
    const training = await prisma.training.findUnique({ where: { id } });
    if (!training) return NextResponse.json({ error: 'Training not found' }, { status: 404 });

    const result = await listSessionsForViewer(user, training);
    if (result.error) return NextResponse.json({ error: 'Training not found' }, { status: 404 });

    return NextResponse.json({ success: true, sessions: result.sessions });
  } catch (error) {
    console.error('Error listing training sessions:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * POST /api/training/[id]/sessions
 * Add a session (training admin of the owning institution only).
 */
export async function POST(request, { params }) {
  try {
    const { id } = await params;
    const access = await requireSessionAdmin(request, id);
    if (access.error) return access.error;
    const { user, training } = access;

    const body = await request.json().catch(() => null);
    const moduleIds = await trainingModuleIds(id);
    const validation = validateSessionInput(body, training, { moduleIds });
    if (!validation.ok) {
      return NextResponse.json({ error: validation.errors[0], errors: validation.errors }, { status: 400 });
    }

    const count = await prisma.trainingSession.count({ where: { trainingId: id } });
    const session = await prisma.trainingSession.create({
      data: { ...validation.data, trainingId: id, order: count, createdBy: user.id },
      include: { module: { select: { id: true, title: true } } },
    });

    await auditTraining({
      trainingId: id,
      actorId: user.id,
      action: 'SESSION_CREATED',
      entityType: 'TrainingSession',
      entityId: session.id,
      after: sessionAuditSnapshot(session),
    });

    return NextResponse.json(
      { success: true, session: serializeSession(session, training, { canSeeLink: true }) },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating training session:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
