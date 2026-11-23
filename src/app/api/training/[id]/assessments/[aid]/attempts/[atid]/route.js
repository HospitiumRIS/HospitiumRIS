import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { attemptExpired, resultView, sanitizeAnswers } from '@/lib/training-assessment';
import {
  attemptForParticipant,
  finaliseAttempt,
  loadAssessment,
  requireParticipant,
} from '@/lib/training-assessment-server';

async function loadOwn(request, params) {
  const { id, aid, atid } = await params;
  const access = await requireParticipant(request, id);
  if (access.error) return access;
  const loaded = await loadAssessment(id, aid, { withQuestions: true });
  if (loaded.error) return loaded;
  const attempt = await prisma.trainingAssessmentAttempt.findUnique({ where: { id: atid } });
  // Only the participant's own attempt; anything else looks like it doesn't exist.
  if (!attempt || attempt.assessmentId !== aid || attempt.registrationId !== access.registration.id) {
    return { error: NextResponse.json({ error: 'Attempt not found' }, { status: 404 }) };
  }
  return { ...access, assessment: loaded.assessment, attempt };
}

/**
 * GET: the participant's own attempt. In progress: questions without answers. Finished:
 * the result, with correct answers only if the assessment shows them (#105).
 */
export async function GET(request, { params }) {
  try {
    const ctx = await loadOwn(request, params);
    if (ctx.error) return ctx.error;
    let { attempt } = ctx;
    const { assessment } = ctx;
    if (attempt.status === 'IN_PROGRESS' && attemptExpired(attempt)) {
      attempt = await finaliseAttempt(attempt, assessment, assessment.questions);
    }
    if (attempt.status === 'IN_PROGRESS') {
      return NextResponse.json({ success: true, attempt: attemptForParticipant(attempt, assessment, assessment.questions) });
    }
    return NextResponse.json({ success: true, result: resultView(assessment, attempt, assessment.questions), passMark: assessment.passMark, title: assessment.title });
  } catch (error) {
    console.error('Loading attempt failed:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/** PUT: autosave answers while in progress. Body: { answers } */
export async function PUT(request, { params }) {
  try {
    const ctx = await loadOwn(request, params);
    if (ctx.error) return ctx.error;
    const { attempt, assessment } = ctx;
    if (attempt.status !== 'IN_PROGRESS') return NextResponse.json({ error: 'This attempt has been submitted' }, { status: 400 });
    if (attemptExpired(attempt)) {
      await finaliseAttempt(attempt, assessment, assessment.questions);
      return NextResponse.json({ error: 'Time is up: your saved answers were submitted', expired: true }, { status: 400 });
    }
    const body = await request.json().catch(() => ({}));
    const answers = sanitizeAnswers(assessment.questions, body.answers);
    await prisma.trainingAssessmentAttempt.updateMany({ where: { id: attempt.id, status: 'IN_PROGRESS' }, data: { answers } });
    return NextResponse.json({ success: true, savedAt: new Date().toISOString() });
  } catch (error) {
    console.error('Saving answers failed:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
