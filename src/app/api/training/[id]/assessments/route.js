import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { auditTraining } from '@/lib/training-audit';
import { requireSessionAdmin } from '@/lib/training-sessions-server';
import { validateAssessment } from '@/lib/training-assessment';

/** GET /api/training/[id]/assessments: all assessments with counts (admin, #105). */
export async function GET(request, { params }) {
  try {
    const { id } = await params;
    const access = await requireSessionAdmin(request, id);
    if (access.error) return access.error;
    const assessments = await prisma.trainingAssessment.findMany({
      where: { trainingId: id },
      include: {
        module: { select: { id: true, title: true } },
        _count: { select: { questions: true } },
        attempts: { select: { status: true, passed: true, registrationId: true } },
      },
      orderBy: [{ order: 'asc' }, { createdAt: 'asc' }],
    });
    return NextResponse.json({
      success: true,
      assessments: assessments.map(({ attempts, _count, ...a }) => ({
        ...a,
        questionCount: _count.questions,
        stats: {
          attempts: attempts.length,
          participants: new Set(attempts.map((t) => t.registrationId)).size,
          passed: new Set(attempts.filter((t) => t.passed).map((t) => t.registrationId)).size,
          needsGrading: attempts.filter((t) => t.status === 'NEEDS_GRADING').length,
          inProgress: attempts.filter((t) => t.status === 'IN_PROGRESS').length,
        },
      })),
    });
  } catch (error) {
    console.error('Loading assessments failed:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/** POST /api/training/[id]/assessments: create one (unpublished until questions are ready). */
export async function POST(request, { params }) {
  try {
    const { id } = await params;
    const access = await requireSessionAdmin(request, id);
    if (access.error) return access.error;
    const modules = await prisma.trainingModule.findMany({ where: { trainingId: id }, select: { id: true } });
    const input = validateAssessment(await request.json().catch(() => ({})), { moduleIds: modules.map((m) => m.id) });
    if (!input.ok) return NextResponse.json({ error: input.error }, { status: 400 });
    const count = await prisma.trainingAssessment.count({ where: { trainingId: id } });
    const assessment = await prisma.trainingAssessment.create({
      data: { ...input.data, isPublished: false, trainingId: id, order: count, createdBy: access.user.id },
    });
    await auditTraining({ trainingId: id, actorId: access.user.id, action: 'ASSESSMENT_CREATED', entityType: 'TrainingAssessment', entityId: assessment.id, after: { title: assessment.title, type: assessment.type } });
    return NextResponse.json({ success: true, assessment }, { status: 201 });
  } catch (error) {
    console.error('Creating assessment failed:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
