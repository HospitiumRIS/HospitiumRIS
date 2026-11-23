import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireSessionAdmin } from '@/lib/training-sessions-server';
import { itemAnalysis } from '@/lib/training-assessment';
import {
  attemptForParticipant,
  loadAssessment,
  requireParticipant,
  startOrResumeAttempt,
} from '@/lib/training-assessment-server';

/** GET: every attempt with the participant, plus item analysis (admin, #105). */
export async function GET(request, { params }) {
  try {
    const { id, aid } = await params;
    const access = await requireSessionAdmin(request, id);
    if (access.error) return access.error;
    const loaded = await loadAssessment(id, aid, { withQuestions: true });
    if (loaded.error) return loaded.error;
    const attempts = await prisma.trainingAssessmentAttempt.findMany({
      where: { assessmentId: aid },
      include: { registration: { select: { user: { select: { givenName: true, familyName: true, email: true } } } } },
      orderBy: [{ startedAt: 'desc' }],
    });
    return NextResponse.json({
      success: true,
      attempts: attempts.map(({ registration, ...a }) => ({
        ...a,
        participant: { name: `${registration.user.givenName} ${registration.user.familyName}`.trim(), email: registration.user.email },
      })),
      analysis: itemAnalysis(loaded.assessment.questions, attempts),
    });
  } catch (error) {
    console.error('Loading attempts failed:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/** POST: start a new attempt or resume the open one (registered participant). */
export async function POST(request, { params }) {
  try {
    const { id, aid } = await params;
    const access = await requireParticipant(request, id);
    if (access.error) return access.error;
    const loaded = await loadAssessment(id, aid, { withQuestions: true });
    if (loaded.error) return loaded.error;
    if (!loaded.assessment.isPublished) return NextResponse.json({ error: 'Assessment not found' }, { status: 404 });
    const started = await startOrResumeAttempt(loaded.assessment, access.registration);
    if (started.error) return NextResponse.json({ error: started.error }, { status: 400 });
    return NextResponse.json({ success: true, attempt: attemptForParticipant(started.attempt, loaded.assessment, loaded.assessment.questions) });
  } catch (error) {
    console.error('Starting attempt failed:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
