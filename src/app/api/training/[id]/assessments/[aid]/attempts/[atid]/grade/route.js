import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { auditTraining } from '@/lib/training-audit';
import { notifyTraining } from '@/lib/training-notify';
import { requireSessionAdmin } from '@/lib/training-sessions-server';
import { gradeAttempt, isPass } from '@/lib/training-assessment';
import { loadAssessment } from '@/lib/training-assessment-server';
import { refreshTrainingProgress } from '@/lib/training-progress-server';

/**
 * PUT: grade short-text answers by hand (admin, #105).
 * Body: { scores: { [questionId]: number }, comments?: { [questionId]: string } }
 * Regrades the whole attempt with the manual scores, then decides pass/fail.
 */
export async function PUT(request, { params }) {
  try {
    const { id, aid, atid } = await params;
    const access = await requireSessionAdmin(request, id);
    if (access.error) return access.error;
    const loaded = await loadAssessment(id, aid, { withQuestions: true });
    if (loaded.error) return loaded.error;
    const { assessment } = loaded;
    const attempt = await prisma.trainingAssessmentAttempt.findUnique({ where: { id: atid } });
    if (!attempt || attempt.assessmentId !== aid) return NextResponse.json({ error: 'Attempt not found' }, { status: 404 });
    if (attempt.status === 'IN_PROGRESS') return NextResponse.json({ error: 'This attempt has not been submitted yet' }, { status: 400 });

    const body = await request.json().catch(() => ({}));
    const textIds = new Set(assessment.questions.filter((q) => q.type === 'SHORT_TEXT').map((q) => q.id));
    const manualScores = { ...(attempt.feedback?.manualScores || {}) };
    for (const [qid, value] of Object.entries(body.scores || {})) {
      if (!textIds.has(qid)) continue;
      const n = Number(value);
      if (!Number.isFinite(n) || n < 0) return NextResponse.json({ error: 'Scores must be 0 or more' }, { status: 400 });
      manualScores[qid] = n;
    }
    const comments = { ...(attempt.feedback?.comments || {}) };
    for (const [qid, text] of Object.entries(body.comments || {})) {
      if (typeof text === 'string') comments[qid] = text.slice(0, 2000);
    }

    const grade = gradeAttempt(assessment.questions, attempt.answers || {}, manualScores);
    const status = grade.needsGrading ? 'NEEDS_GRADING' : 'GRADED';
    const passed = grade.needsGrading ? null : isPass(grade.percent, assessment.passMark);
    const now = new Date();
    const updated = await prisma.trainingAssessmentAttempt.update({
      where: { id: atid },
      data: {
        status,
        score: grade.score,
        maxScore: grade.maxScore,
        percent: grade.percent,
        passed,
        feedback: { perQuestion: grade.perQuestion, manualScores, comments },
        gradedBy: access.user.id,
        gradedAt: now,
      },
    });
    await auditTraining({
      trainingId: id,
      actorId: access.user.id,
      action: 'ASSESSMENT_GRADED',
      entityType: 'TrainingAssessmentAttempt',
      entityId: atid,
      before: { status: attempt.status, percent: attempt.percent, passed: attempt.passed },
      after: { status, percent: grade.percent, passed },
    });
    if (status === 'GRADED' && attempt.status !== 'GRADED') {
      await notifyTraining('ASSESSMENT_GRADED', {
        userId: attempt.userId,
        trainingId: id,
        dedupeKey: `assessment-graded:${atid}`,
        extra: { assessment: { title: assessment.title, percent: grade.percent, passed } },
      });
    }
    if (passed !== attempt.passed) await refreshTrainingProgress(id, [attempt.registrationId], { actorId: access.user.id });
    return NextResponse.json({ success: true, attempt: updated });
  } catch (error) {
    console.error('Grading attempt failed:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
