import { maybeRunTrainingAutomation } from '@/lib/training-automation-server';
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getAuthenticatedUser } from '@/lib/auth-server';
import { effectiveSessionDelivery } from '@/lib/training-sessions';
import { buildTodos, cpdForYear, upcomingSessions } from '@/lib/training-hub';
import { loadEffectiveForm } from '@/lib/training-feedback-server';

const SEAT = ['REGISTERED', 'COMPLETED', 'NOT_COMPLETED'];

/**
 * GET /api/training/my/dashboard
 * The learning hub overview (#107): next sessions, to-do list and CPD this year.
 * Only the caller's own registrations are read.
 */
export async function GET(request) {
  try {
    const user = await getAuthenticatedUser(request);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    // Keeps reminders and status changes going without a scheduler (#110): at most
    // every 15 minutes per server, in the background.
    maybeRunTrainingAutomation();
    const now = new Date();

    const registrations = await prisma.trainingRegistration.findMany({
      where: { userId: user.id, status: { in: [...SEAT, 'PENDING_APPROVAL', 'WAITLISTED'] } },
      select: {
        id: true,
        status: true,
        source: true,
        dueDate: true,
        completedAt: true,
        attendancePercent: true,
        certificate: { select: { id: true, status: true, expiresAt: true } },
        feedbackResponse: { select: { id: true } },
        attendance: { select: { sessionId: true, status: true } },
        training: {
          select: {
            id: true,
            title: true,
            institutionId: true,
            status: true,
            startDate: true,
            endDate: true,
            minAttendancePercent: true,
            cpdHours: true,
            cpdPoints: true,
            deliveryMode: true,
            venue: true,
            onlineLink: true,
            location: true,
            sessions: {
              where: { status: 'SCHEDULED', endsAt: { gte: new Date(now.getTime() - 60 * 60 * 1000) } },
              orderBy: { startsAt: 'asc' },
              take: 20,
            },
          },
        },
      },
    });
    const active = registrations.filter((r) => r.training.status !== 'CANCELLED');
    const seated = active.filter((r) => r.status === 'REGISTERED');

    // Sessions with the delivery they inherit from the training; never the link itself.
    const sessionItems = seated.map((r) => ({
      training: r.training,
      attendance: r.attendance,
      sessions: r.training.sessions.map((s) => {
        const eff = effectiveSessionDelivery(s, r.training);
        return { ...s, deliveryMode: eff.deliveryMode, venue: eff.venue, hasOnlineLink: Boolean(eff.onlineLink) };
      }),
    }));
    const allSessions = upcomingSessions(sessionItems, now, 100);

    // Feedback: which trainings have a form (ended in the last 60 days, or attendance met).
    const feedbackCandidates = active.filter((r) => SEAT.includes(r.status) && !r.feedbackResponse
      && ((r.training.endDate && new Date(r.training.endDate) <= now && now - new Date(r.training.endDate) <= 60 * 86400000)
        || (r.training.minAttendancePercent && r.attendancePercent >= r.training.minAttendancePercent)));
    const hasForm = new Map();
    for (const r of feedbackCandidates) {
      hasForm.set(r.training.id, Boolean((await loadEffectiveForm(r.training)).form));
    }

    const trainingIds = active.filter((r) => SEAT.includes(r.status)).map((r) => r.training.id);
    const assessments = trainingIds.length
      ? await prisma.trainingAssessment.findMany({
          where: { trainingId: { in: trainingIds }, isPublished: true },
          select: {
            id: true, trainingId: true, title: true, type: true, isPublished: true, isRequiredForCompletion: true,
            maxAttempts: true, availableFrom: true, availableUntil: true,
            attempts: {
              where: { registrationId: { in: active.map((r) => r.id) } },
              select: { status: true, passed: true, deadlineAt: true },
            },
          },
        })
      : [];

    const todos = buildTodos({
      registrations: active.map((r) => ({
        ...r,
        hasFeedbackForm: hasForm.get(r.training.id) === true,
        feedbackSubmitted: Boolean(r.feedbackResponse),
      })),
      sessions: allSessions,
      assessments,
    }, now);

    return NextResponse.json({
      success: true,
      nextSessions: allSessions.slice(0, 5),
      todos,
      cpd: cpdForYear(registrations, now.getFullYear()),
      counts: {
        active: seated.length,
        completed: registrations.filter((r) => r.status === 'COMPLETED').length,
        waiting: active.filter((r) => r.status === 'PENDING_APPROVAL' || r.status === 'WAITLISTED').length,
      },
    });
  } catch (error) {
    console.error('Loading training dashboard failed:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
