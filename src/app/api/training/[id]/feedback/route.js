import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getAuthenticatedUser } from '@/lib/auth-server';
import { auditTraining } from '@/lib/training-audit';
import { feedbackUnlocked, validateResponse } from '@/lib/training-feedback';
import { loadEffectiveForm } from '@/lib/training-feedback-server';
import { refreshTrainingProgress } from '@/lib/training-progress-server';

async function participant(request, trainingId) {
  const user = await getAuthenticatedUser(request);
  if (!user) return { error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) };
  const training = await prisma.training.findUnique({
    where: { id: trainingId },
    select: { id: true, title: true, institutionId: true, endDate: true, minAttendancePercent: true },
  });
  if (!training) return { error: NextResponse.json({ error: 'Training not found' }, { status: 404 }) };
  const registration = await prisma.trainingRegistration.findUnique({
    where: { trainingId_userId: { trainingId, userId: user.id } },
    select: { id: true, status: true, attendancePercent: true, feedbackResponse: { select: { id: true, answers: true, submittedAt: true } } },
  });
  if (!registration) return { error: NextResponse.json({ error: 'Register for this training to give feedback' }, { status: 403 }) };
  return { user, training, registration };
}

/** GET: the feedback form for the caller, whether it's open, and their answers if sent (#106). */
export async function GET(request, { params }) {
  try {
    const { id } = await params;
    const ctx = await participant(request, id);
    if (ctx.error) return ctx.error;
    const { form } = await loadEffectiveForm(ctx.training);
    const gate = feedbackUnlocked(ctx.training, ctx.registration);
    return NextResponse.json({
      success: true,
      training: { id: ctx.training.id, title: ctx.training.title },
      form: form ? { title: form.title, intro: form.intro, questions: form.questions, anonymousToFacilitators: form.anonymousToFacilitators } : null,
      unlocked: gate.unlocked,
      reason: form ? gate.reason : 'No feedback form for this training',
      response: ctx.registration.feedbackResponse,
    });
  } catch (error) {
    console.error('Loading feedback failed:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/** POST: send feedback, once per registration. Body: { answers } */
export async function POST(request, { params }) {
  try {
    const { id } = await params;
    const ctx = await participant(request, id);
    if (ctx.error) return ctx.error;
    if (ctx.registration.feedbackResponse) return NextResponse.json({ error: 'You have already sent feedback for this training' }, { status: 400 });
    const { form } = await loadEffectiveForm(ctx.training);
    if (!form) return NextResponse.json({ error: 'No feedback form for this training' }, { status: 400 });
    const gate = feedbackUnlocked(ctx.training, ctx.registration);
    if (!gate.unlocked) return NextResponse.json({ error: gate.reason }, { status: 400 });
    const body = await request.json().catch(() => ({}));
    const input = validateResponse(form, body.answers);
    if (!input.ok) return NextResponse.json({ error: input.error, missing: input.missing }, { status: 400 });
    try {
      await prisma.trainingFeedbackResponse.create({
        data: { trainingId: id, formId: form.id, registrationId: ctx.registration.id, userId: ctx.user.id, answers: input.answers },
      });
    } catch (err) {
      if (err?.code === 'P2002') return NextResponse.json({ error: 'You have already sent feedback for this training' }, { status: 400 });
      throw err;
    }
    // The answers themselves are not copied into the activity log.
    await auditTraining({ trainingId: id, actorId: ctx.user.id, action: 'FEEDBACK_SUBMITTED', entityType: 'TrainingRegistration', entityId: ctx.registration.id });
    await refreshTrainingProgress(id, [ctx.registration.id], { actorId: ctx.user.id });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Sending feedback failed:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
