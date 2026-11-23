import { NextResponse } from 'next/server';
import { requireSessionAdmin } from '@/lib/training-sessions-server';
import { loadCompletionReport, refreshTrainingProgress } from '@/lib/training-progress-server';
import { auditTraining } from '@/lib/training-audit';

/**
 * GET /api/training/[id]/completion
 * Completion rules and every active participant's checklist (#96). Training admin only.
 */
export async function GET(request, { params }) {
  try {
    const { id } = await params;
    const access = await requireSessionAdmin(request, id);
    if (access.error) return access.error;
    // Finalise ended trainings when an admin looks, so completion doesn't depend on
    // the scheduled job being set up.
    const ended = access.training.endDate && new Date(access.training.endDate) <= new Date();
    if (ended) await refreshTrainingProgress(id, null, { actorId: null });
    const report = await loadCompletionReport(id);
    return NextResponse.json({ success: true, ...report });
  } catch (error) {
    console.error('Error loading completion report:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * POST /api/training/[id]/completion
 * Re-evaluate completion now (all participants, or { registrationIds }). Training admin only.
 */
export async function POST(request, { params }) {
  try {
    const { id } = await params;
    const access = await requireSessionAdmin(request, id);
    if (access.error) return access.error;

    const body = await request.json().catch(() => ({}));
    const ids = Array.isArray(body?.registrationIds) && body.registrationIds.length
      ? body.registrationIds.filter((x) => typeof x === 'string').slice(0, 5000)
      : null;
    const summary = await refreshTrainingProgress(id, ids, { actorId: access.user.id });

    await auditTraining({
      trainingId: id,
      actorId: access.user.id,
      action: 'COMPLETION_REEVALUATED',
      entityType: 'Training',
      entityId: id,
      after: summary,
    });

    const report = await loadCompletionReport(id);
    return NextResponse.json({ success: true, summary, ...report });
  } catch (error) {
    console.error('Error re-evaluating completion:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
