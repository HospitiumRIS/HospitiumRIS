import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getAuthenticatedUser } from '@/lib/auth-server';
import { isTrainingAdmin, resolveTrainingScopeContext } from '@/lib/training-admin-server';
import { DEFAULT_FEEDBACK_QUESTIONS, validateFeedbackForm } from '@/lib/training-feedback';
import { institutionDefaultForm } from '@/lib/training-feedback-server';

async function adminInstitution(request) {
  const user = await getAuthenticatedUser(request);
  if (!user) return { error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) };
  if (!isTrainingAdmin(user)) return { error: NextResponse.json({ error: 'Unauthorized - Admin access required' }, { status: 403 }) };
  const { institutionId } = await resolveTrainingScopeContext(user);
  if (!institutionId) return { error: NextResponse.json({ error: 'No institution linked to your account' }, { status: 400 }) };
  return { user, institutionId };
}

/** GET /api/training/feedback-form: the institution's default feedback form (#106), or a suggested starting form. */
export async function GET(request) {
  try {
    const ctx = await adminInstitution(request);
    if (ctx.error) return ctx.error;
    const form = await institutionDefaultForm(ctx.institutionId);
    return NextResponse.json({
      success: true,
      form,
      template: { title: 'Training feedback', intro: 'Thank you for taking part. Your answers help us improve.', questions: DEFAULT_FEEDBACK_QUESTIONS, anonymousToFacilitators: true },
    });
  } catch (error) {
    console.error('Loading feedback form failed:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/** PUT: create or update the default. Body: { title, intro, questions, anonymousToFacilitators, isActive } */
export async function PUT(request) {
  try {
    const ctx = await adminInstitution(request);
    if (ctx.error) return ctx.error;
    const body = await request.json().catch(() => ({}));
    const input = validateFeedbackForm(body);
    if (!input.ok) return NextResponse.json({ error: input.error }, { status: 400 });
    const data = { ...input.data, isActive: body.isActive !== false };
    const existing = await institutionDefaultForm(ctx.institutionId);
    const form = existing
      ? await prisma.trainingFeedbackForm.update({ where: { id: existing.id }, data })
      : await prisma.trainingFeedbackForm.create({ data: { ...data, institutionId: ctx.institutionId, createdBy: ctx.user.id } });
    return NextResponse.json({ success: true, form });
  } catch (error) {
    console.error('Saving feedback form failed:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
