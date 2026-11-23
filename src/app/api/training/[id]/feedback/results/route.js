import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { feedbackCsv, responsesForViewer, summarizeFeedback } from '@/lib/training-feedback';
import { loadEffectiveForm, requireFeedbackViewer, sendFeedbackRequests } from '@/lib/training-feedback-server';
import { requireSessionAdmin } from '@/lib/training-sessions-server';
import { ACTIVE_REGISTRATION_STATUSES } from '@/lib/training-scope';

/**
 * GET /api/training/[id]/feedback/results[?format=csv]
 * Summary and responses (#106). Admins see who answered; facilitators see names only
 * if the form is not anonymous to facilitators.
 */
export async function GET(request, { params }) {
  try {
    const { id } = await params;
    const access = await requireFeedbackViewer(request, id);
    if (access.error) return access.error;
    const { form, source } = await loadEffectiveForm(access.training);
    const anonymous = form ? form.anonymousToFacilitators !== false : true;
    const showNames = access.role === 'admin' || !anonymous;

    const [rows, participants] = await Promise.all([
      prisma.trainingFeedbackResponse.findMany({
        where: { trainingId: id },
        select: {
          id: true,
          formId: true,
          answers: true,
          submittedAt: true,
          // Identities are only read for viewers allowed to see them.
          ...(showNames ? { registration: { select: { user: { select: { givenName: true, familyName: true, email: true } } } } } : {}),
        },
        orderBy: { submittedAt: 'asc' },
      }),
      prisma.trainingRegistration.count({ where: { trainingId: id, status: { in: ACTIVE_REGISTRATION_STATUSES } } }),
    ]);
    const responses = rows.map((r) => ({
      id: r.id,
      submittedAt: r.submittedAt,
      answers: r.answers,
      respondent: r.registration ? { name: `${r.registration.user.givenName} ${r.registration.user.familyName}`.trim(), email: r.registration.user.email } : null,
    }));
    const visible = responsesForViewer(responses, { role: access.role, anonymous });

    if (new URL(request.url).searchParams.get('format') === 'csv') {
      const csv = feedbackCsv(form, visible, { includeIdentity: showNames });
      return new NextResponse(`﻿${csv}`, {
        headers: {
          'Content-Type': 'text/csv; charset=utf-8',
          'Content-Disposition': `attachment; filename="training-feedback-${id}.csv"`,
          'Cache-Control': 'no-store',
        },
      });
    }

    return NextResponse.json({
      success: true,
      role: access.role,
      anonymous,
      showNames,
      source,
      form: form ? { title: form.title, questions: form.questions } : null,
      participants,
      summary: summarizeFeedback(form, visible),
      responses: visible,
    });
  } catch (error) {
    console.error('Loading feedback results failed:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/** POST: ask participants who haven't answered yet (admin). Each person is asked once. */
export async function POST(request, { params }) {
  try {
    const { id } = await params;
    const access = await requireSessionAdmin(request, id);
    if (access.error) return access.error;
    const result = await sendFeedbackRequests({ trainingId: id });
    return NextResponse.json({ success: true, ...result });
  } catch (error) {
    console.error('Sending feedback requests failed:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
