import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireSessionAdmin } from '@/lib/training-sessions-server';
import { validateQuestion } from '@/lib/training-assessment';
import { loadAssessment } from '@/lib/training-assessment-server';

async function load(request, params) {
  const { id, aid, qid } = await params;
  const access = await requireSessionAdmin(request, id);
  if (access.error) return access;
  const loaded = await loadAssessment(id, aid);
  if (loaded.error) return loaded;
  const question = await prisma.trainingAssessmentQuestion.findUnique({ where: { id: qid } });
  if (!question || question.assessmentId !== aid) return { error: NextResponse.json({ error: 'Question not found' }, { status: 404 }) };
  return { ...access, question, aid };
}

/** PUT: edit a question (admin, #105). Past attempts keep the grades they got. */
export async function PUT(request, { params }) {
  try {
    const ctx = await load(request, params);
    if (ctx.error) return ctx.error;
    const input = validateQuestion(await request.json().catch(() => ({})));
    if (!input.ok) return NextResponse.json({ error: input.error }, { status: 400 });
    const question = await prisma.trainingAssessmentQuestion.update({ where: { id: ctx.question.id }, data: input.data });
    return NextResponse.json({ success: true, question });
  } catch (error) {
    console.error('Editing question failed:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/** POST: duplicate the question, placed right after it. */
export async function POST(request, { params }) {
  try {
    const ctx = await load(request, params);
    if (ctx.error) return ctx.error;
    const { id: _id, createdAt: _c, updatedAt: _u, ...rest } = ctx.question;
    await prisma.trainingAssessmentQuestion.updateMany({ where: { assessmentId: ctx.aid, order: { gt: ctx.question.order } }, data: { order: { increment: 1 } } });
    const question = await prisma.trainingAssessmentQuestion.create({ data: { ...rest, prompt: `${rest.prompt} (copy)`.slice(0, 4000), order: ctx.question.order + 1 } });
    return NextResponse.json({ success: true, question }, { status: 201 });
  } catch (error) {
    console.error('Duplicating question failed:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/** DELETE */
export async function DELETE(request, { params }) {
  try {
    const ctx = await load(request, params);
    if (ctx.error) return ctx.error;
    await prisma.trainingAssessmentQuestion.delete({ where: { id: ctx.question.id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Deleting question failed:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
