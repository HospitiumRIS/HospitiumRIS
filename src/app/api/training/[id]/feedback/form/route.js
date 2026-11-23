import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { auditTraining } from '@/lib/training-audit';
import { requireSessionAdmin } from '@/lib/training-sessions-server';
import { DEFAULT_FEEDBACK_QUESTIONS, validateFeedbackForm } from '@/lib/training-feedback';
import { loadEffectiveForm } from '@/lib/training-feedback-server';
import { refreshTrainingProgress } from '@/lib/training-progress-server';

/** GET: the form that applies (own or institution default), for the training's admins (#106). */
export async function GET(request, { params }) {
  try {
    const { id } = await params;
    const access = await requireSessionAdmin(request, id);
    if (access.error) return access.error;
    const { form, source, own, fallback } = await loadEffectiveForm(access.training);
    return NextResponse.json({ success: true, form, source, own, hasInstitutionDefault: Boolean(fallback), template: { title: 'Training feedback', questions: DEFAULT_FEEDBACK_QUESTIONS, anonymousToFacilitators: true } });
  } catch (error) {
    console.error('Loading training feedback form failed:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/** PUT: give this training its own form (or update it). */
export async function PUT(request, { params }) {
  try {
    const { id } = await params;
    const access = await requireSessionAdmin(request, id);
    if (access.error) return access.error;
    const input = validateFeedbackForm(await request.json().catch(() => ({})));
    if (!input.ok) return NextResponse.json({ error: input.error }, { status: 400 });
    const form = await prisma.trainingFeedbackForm.upsert({
      where: { trainingId: id },
      update: { ...input.data, isActive: true },
      create: { ...input.data, trainingId: id, institutionId: access.training.institutionId, createdBy: access.user.id },
    });
    await auditTraining({ trainingId: id, actorId: access.user.id, action: 'FEEDBACK_FORM_SAVED', entityType: 'TrainingFeedbackForm', entityId: form.id, after: { questions: input.data.questions.length, anonymous: input.data.anonymousToFacilitators } });
    await refreshTrainingProgress(id, null, { actorId: access.user.id });
    return NextResponse.json({ success: true, form });
  } catch (error) {
    console.error('Saving training feedback form failed:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/** DELETE: go back to the institution default. Keeps the form if people already answered it. */
export async function DELETE(request, { params }) {
  try {
    const { id } = await params;
    const access = await requireSessionAdmin(request, id);
    if (access.error) return access.error;
    const own = await prisma.trainingFeedbackForm.findUnique({ where: { trainingId: id }, include: { _count: { select: { responses: true } } } });
    if (!own) return NextResponse.json({ success: true });
    if (own._count.responses) await prisma.trainingFeedbackForm.update({ where: { id: own.id }, data: { isActive: false } });
    else await prisma.trainingFeedbackForm.delete({ where: { id: own.id } });
    await auditTraining({ trainingId: id, actorId: access.user.id, action: 'FEEDBACK_FORM_REMOVED', entityType: 'TrainingFeedbackForm', entityId: own.id });
    await refreshTrainingProgress(id, null, { actorId: access.user.id });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Removing training feedback form failed:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
