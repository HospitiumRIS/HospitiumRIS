import prisma from '@/lib/prisma';
import { renderBrandedEmail } from '@/lib/email-layout';
import { sendBrandedEmail } from '@/lib/email';
import { appBaseUrl } from '@/lib/training-certificates-server';
import { institutionDefaultForm } from '@/lib/training-feedback-server';
import { computeAnalytics, computeAnalyticsV2, monthlyReportDue, previousPeriod } from '@/lib/training-analytics';
import { renderAnalyticsPdf } from '@/lib/training-analytics-pdf';

const TRAINING_SELECT = {
  id: true, title: true, code: true, department: true, targetGroup: true, category: true, status: true,
  startDate: true, endDate: true, cpdHours: true, maxParticipants: true, deliveryMode: true, completionGraceDays: true,
  feedbackForm: { select: { isActive: true } },
  sessions: { select: { id: true, status: true, startsAt: true } },
  facilitators: { select: { userId: true, name: true, sessionId: true, user: { select: { givenName: true, familyName: true } } } },
  registrations: {
    select: {
      id: true, status: true, source: true, dueDate: true,
      certificate: { select: { status: true, expiresAt: true } },
      attendance: { select: { sessionId: true, status: true } },
    },
  },
};

/**
 * Training analytics for one institution (#109, #138): current period, previous period of
 * the same length, and the v2 measures. Aggregates only; facilitator names are staff or
 * guest names, never participant data.
 * @param {{ institutionId, from: Date, to: Date, department?, targetGroup?, category?, deliveryMode? }} args
 */
export async function loadTrainingAnalytics({ institutionId, from, to, department = null, targetGroup = null, category = null, deliveryMode = null, now = new Date() }) {
  const prev = previousPeriod(from, to);
  const filters = { from, to, department, targetGroup, category, deliveryMode };

  const [trainings, optionsSource, defaultForm] = await Promise.all([
    prisma.training.findMany({
      where: { institutionId, startDate: { gte: prev.from, lte: to }, status: { notIn: ['DRAFT', 'CANCELLED'] } },
      select: TRAINING_SELECT,
    }),
    prisma.training.findMany({ where: { institutionId }, select: { department: true, targetGroup: true, category: true } }),
    institutionDefaultForm(institutionId),
  ]);
  const ids = trainings.map((t) => t.id);
  const [forms, responses, assessments] = ids.length
    ? await Promise.all([
        prisma.trainingFeedbackForm.findMany({ where: { institutionId }, select: { id: true, questions: true } }),
        prisma.trainingFeedbackResponse.findMany({ where: { trainingId: { in: ids } }, select: { trainingId: true, formId: true, answers: true } }),
        prisma.trainingAssessment.findMany({
          where: { trainingId: { in: ids }, isPublished: true },
          select: {
            id: true, title: true, type: true, trainingId: true, training: { select: { title: true } },
            attempts: { select: { registrationId: true, status: true, passed: true, percent: true } },
          },
        }),
      ])
    : [[], [], []];

  const shaped = trainings.map(({ facilitators, feedbackForm, ...t }) => ({
    ...t,
    hasFeedbackForm: Boolean((feedbackForm && feedbackForm.isActive !== false) || (defaultForm && defaultForm.isActive !== false)),
    facilitators: facilitators.map((f) => ({
      key: f.userId || `guest:${f.name}`,
      name: f.userId ? `${f.user?.givenName || ''} ${f.user?.familyName || ''}`.trim() || 'Staff member' : f.name || 'Guest',
      sessionId: f.sessionId,
    })),
  }));

  const report = computeAnalyticsV2({
    trainings: shaped,
    forms,
    responses,
    assessments: assessments.map((a) => ({ ...a, trainingTitle: a.training.title })),
    filters,
    now,
  });
  report.options = computeAnalytics({
    trainings: optionsSource.map((t, i) => ({ ...t, id: `o${i}`, status: 'PUBLISHED', startDate: from })),
  }).options;
  report.period = { from: from.toISOString().slice(0, 10), to: to.toISOString().slice(0, 10) };
  report.previousPeriod.from = prev.from.toISOString().slice(0, 10);
  report.previousPeriod.to = prev.to.toISOString().slice(0, 10);
  return report;
}

export function filtersLabel({ department, targetGroup, category, deliveryMode }) {
  return [department, targetGroup, category, deliveryMode].filter((x) => x && x !== 'all').join(' · ') || 'All trainings';
}

/**
 * Send the monthly analytics email (#138) to every admin who opted in and hasn't had
 * last month's report yet. The month is claimed before sending, so a parallel run can't
 * send twice; if the send fails (or email isn't configured) the claim is released and a
 * later run tries again.
 */
export async function sendMonthlyAnalyticsReports({ now = new Date() } = {}) {
  const subs = await prisma.trainingReportSubscription.findMany({
    include: { user: { select: { email: true, givenName: true, status: true } } },
  });
  let sent = 0;
  const cache = new Map();
  for (const sub of subs) {
    const due = monthlyReportDue(sub.lastSentPeriod, now);
    if (!due.due || sub.user?.status !== 'ACTIVE' || !sub.user.email) continue;
    // Claim this month first: only one run can move lastSentPeriod forward.
    const claimed = await prisma.trainingReportSubscription.updateMany({
      where: { id: sub.id, OR: [{ lastSentPeriod: null }, { lastSentPeriod: { not: due.period } }] },
      data: { lastSentPeriod: due.period },
    });
    if (!claimed.count) continue;

    const key = `${sub.institutionId}|${due.period}`;
    if (!cache.has(key)) {
      const [report, institution] = await Promise.all([
        loadTrainingAnalytics({ institutionId: sub.institutionId, from: due.from, to: due.to, now }),
        prisma.institution.findUnique({ where: { id: sub.institutionId }, select: { name: true } }),
      ]);
      const pdf = renderAnalyticsPdf({ report, institution: institution?.name, filtersLabel: 'All trainings', generatedAt: now });
      // Compliance as of now (#140); a failure here must not stop the analytics report.
      let compliance = null;
      try {
        const { loadCompliance } = await import('@/lib/training-compliance-server');
        const { renderCompliancePdf } = await import('@/lib/training-compliance-pdf');
        const data = await loadCompliance(sub.institutionId, now);
        compliance = { data, pdf: renderCompliancePdf({ data, institution: institution?.name, generatedAt: now }) };
      } catch (error) {
        console.error('Monthly compliance section failed:', error);
      }
      cache.set(key, { report, pdf, institution: institution?.name, compliance });
    }
    const { report, pdf, institution, compliance } = cache.get(key);
    const ct = compliance?.data.matrix.totals;
    const assignedOverdue = compliance?.data.assigned?.totals?.overdue || 0;
    const k = report.kpis;
    const monthName = due.from.toLocaleDateString('en-GB', { month: 'long', year: 'numeric', timeZone: 'UTC' });
    const base = appBaseUrl().replace(/\/$/, '');
    const { html, text } = renderBrandedEmail({
      title: `Training report: ${monthName}`,
      preheader: `${k.trainings} trainings, ${k.enrolments} enrolments, ${k.completionRate ?? '-'}% completion`,
      greeting: `Hello ${sub.user.givenName || ''}`.trim(),
      paragraphs: [`Here is the training summary for ${institution || 'your institution'} for ${monthName}. The full report${compliance ? ' and the compliance report are' : ' is'} attached as PDF.`],
      details: [
        ['Trainings run', String(k.trainings)],
        ['Enrolments', String(k.enrolments)],
        ['Attendance', k.attendanceRate === null ? '-' : `${k.attendanceRate}%`],
        ['Completion', k.completionRate === null ? '-' : `${k.completionRate}%`],
        ['Certificates issued', String(k.certificates)],
        ['Needs attention', String(report.attention.length)],
        ...(compliance ? [
          ['Compliant (requirements)', ct.percent === null ? '-' : `${ct.percent}%`],
          ['Overdue', String(ct.OVERDUE + assignedOverdue)],
          ['Not done or expired', String(ct.MISSING + ct.EXPIRED)],
          ['Expiring within 30 days', String(ct.EXPIRING)],
        ] : []),
      ],
      action: { url: `${base}/institution/training/analytics`, label: 'Open training analytics' },
      note: 'You get this because you turned on the monthly report on the training analytics page. Turn it off there at any time.',
      baseUrl: base,
    });
    const result = await sendBrandedEmail({
      to: sub.user.email,
      subject: `Training report: ${monthName}`,
      html,
      text,
      attachments: [
        { filename: `training-report-${due.period}.pdf`, content: pdf, contentType: 'application/pdf' },
        ...(compliance ? [{ filename: `training-compliance-${now.toISOString().slice(0, 10)}.pdf`, content: compliance.pdf, contentType: 'application/pdf' }] : []),
      ],
    });
    if (result.success) sent += 1;
    else {
      // Not sent: release the claim so a later run tries again.
      await prisma.trainingReportSubscription.update({ where: { id: sub.id }, data: { lastSentPeriod: sub.lastSentPeriod } });
    }
  }
  return { subscribers: subs.length, sent };
}
