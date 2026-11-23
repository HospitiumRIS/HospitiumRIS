import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { attemptExpired, resultView } from '@/lib/training-assessment';
import { finaliseAttempt, loadAssessment, requireParticipant } from '@/lib/training-assessment-server';

/**
 * POST: submit the participant's own attempt. Body: { answers }. After the time limit
 * only the answers saved in time count (#105).
 */
export async function POST(request, { params }) {
  try {
    const { id, aid, atid } = await params;
    const access = await requireParticipant(request, id);
    if (access.error) return access.error;
    const loaded = await loadAssessment(id, aid, { withQuestions: true });
    if (loaded.error) return loaded.error;
    const { assessment } = loaded;
    let attempt = await prisma.trainingAssessmentAttempt.findUnique({ where: { id: atid } });
    if (!attempt || attempt.assessmentId !== aid || attempt.registrationId !== access.registration.id) {
      return NextResponse.json({ error: 'Attempt not found' }, { status: 404 });
    }
    if (attempt.status === 'IN_PROGRESS') {
      const body = await request.json().catch(() => ({}));
      const late = attemptExpired(attempt);
      attempt = await finaliseAttempt(attempt, assessment, assessment.questions, { answers: late ? null : body.answers, actorId: access.user.id });
    }
    return NextResponse.json({ success: true, result: resultView(assessment, attempt, assessment.questions), passMark: assessment.passMark, title: assessment.title });
  } catch (error) {
    console.error('Submitting attempt failed:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
