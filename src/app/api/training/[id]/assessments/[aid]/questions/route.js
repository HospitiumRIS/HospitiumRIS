import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireSessionAdmin } from '@/lib/training-sessions-server';
import { validateQuestion } from '@/lib/training-assessment';
import { loadAssessment } from '@/lib/training-assessment-server';

/** POST: add a question (admin, #105). */
export async function POST(request, { params }) {
  try {
    const { id, aid } = await params;
    const access = await requireSessionAdmin(request, id);
    if (access.error) return access.error;
    const loaded = await loadAssessment(id, aid);
    if (loaded.error) return loaded.error;
    const input = validateQuestion(await request.json().catch(() => ({})));
    if (!input.ok) return NextResponse.json({ error: input.error }, { status: 400 });
    const count = await prisma.trainingAssessmentQuestion.count({ where: { assessmentId: aid } });
    if (count >= 200) return NextResponse.json({ error: 'At most 200 questions' }, { status: 400 });
    const question = await prisma.trainingAssessmentQuestion.create({ data: { ...input.data, assessmentId: aid, order: count } });
    return NextResponse.json({ success: true, question }, { status: 201 });
  } catch (error) {
    console.error('Adding question failed:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/** PUT: reorder. Body: { ids: string[] } in the new order. */
export async function PUT(request, { params }) {
  try {
    const { id, aid } = await params;
    const access = await requireSessionAdmin(request, id);
    if (access.error) return access.error;
    const loaded = await loadAssessment(id, aid, { withQuestions: true });
    if (loaded.error) return loaded.error;
    const body = await request.json().catch(() => ({}));
    const ids = Array.isArray(body.ids) ? body.ids : [];
    const existing = loaded.assessment.questions.map((q) => q.id);
    if (ids.length !== existing.length || !existing.every((q) => ids.includes(q))) {
      return NextResponse.json({ error: 'Send every question id once' }, { status: 400 });
    }
    await prisma.$transaction(ids.map((qid, order) => prisma.trainingAssessmentQuestion.update({ where: { id: qid }, data: { order } })));
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Reordering questions failed:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
