import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { auditTraining } from '@/lib/training-audit';
import { requireSessionAdmin } from '@/lib/training-sessions-server';
import { validateAssessment } from '@/lib/training-assessment';
import { QUESTION_ORDER, loadAssessment } from '@/lib/training-assessment-server';
import { refreshTrainingProgress } from '@/lib/training-progress-server';

/** GET: the assessment with its questions and answers (admin only, #105). */
export async function GET(request, { params }) {
  try {
    const { id, aid } = await params;
    const access = await requireSessionAdmin(request, id);
    if (access.error) return access.error;
    const loaded = await loadAssessment(id, aid, { withQuestions: true });
    if (loaded.error) return loaded.error;
    return NextResponse.json({ success: true, assessment: loaded.assessment });
  } catch (error) {
    console.error('Loading assessment failed:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/** PUT: settings, publish / unpublish. */
export async function PUT(request, { params }) {
  try {
    const { id, aid } = await params;
    const access = await requireSessionAdmin(request, id);
    if (access.error) return access.error;
    const loaded = await loadAssessment(id, aid, { withQuestions: true });
    if (loaded.error) return loaded.error;
    const modules = await prisma.trainingModule.findMany({ where: { trainingId: id }, select: { id: true } });
    const input = validateAssessment(await request.json().catch(() => ({})), { partial: true, moduleIds: modules.map((m) => m.id) });
    if (!input.ok) return NextResponse.json({ error: input.error }, { status: 400 });
    const before = loaded.assessment;
    if (input.data.isPublished && !before.questions.length) {
      return NextResponse.json({ error: 'Add at least one question before publishing' }, { status: 400 });
    }
    const opens = input.data.availableFrom !== undefined ? input.data.availableFrom : before.availableFrom;
    const closes = input.data.availableUntil !== undefined ? input.data.availableUntil : before.availableUntil;
    if (opens && closes && new Date(closes) <= new Date(opens)) {
      return NextResponse.json({ error: 'The assessment must close after it opens' }, { status: 400 });
    }
    const assessment = await prisma.trainingAssessment.update({ where: { id: aid }, data: input.data, include: { questions: QUESTION_ORDER } });
    await auditTraining({ trainingId: id, actorId: access.user.id, action: 'ASSESSMENT_UPDATED', entityType: 'TrainingAssessment', entityId: aid, after: input.data });
    // Required / published / module link changes alter everyone's progress.
    if (['isPublished', 'isRequiredForCompletion', 'moduleId'].some((k) => k in input.data)) {
      await refreshTrainingProgress(id, null, { actorId: access.user.id });
    }
    return NextResponse.json({ success: true, assessment });
  } catch (error) {
    console.error('Updating assessment failed:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/** DELETE: only when nobody has attempted it; otherwise unpublish it instead. */
export async function DELETE(request, { params }) {
  try {
    const { id, aid } = await params;
    const access = await requireSessionAdmin(request, id);
    if (access.error) return access.error;
    const loaded = await loadAssessment(id, aid);
    if (loaded.error) return loaded.error;
    const attempts = await prisma.trainingAssessmentAttempt.count({ where: { assessmentId: aid } });
    if (attempts) return NextResponse.json({ error: `${attempts} attempt(s) exist. Unpublish it instead, to keep the results.` }, { status: 400 });
    await prisma.trainingAssessment.delete({ where: { id: aid } });
    await auditTraining({ trainingId: id, actorId: access.user.id, action: 'ASSESSMENT_DELETED', entityType: 'TrainingAssessment', entityId: aid, before: { title: loaded.assessment.title } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Deleting assessment failed:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
