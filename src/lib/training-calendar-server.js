import { randomBytes } from 'crypto';
import prisma from '@/lib/prisma';
import { appBaseUrl } from '@/lib/training-certificates-server';
import { calendarEvents } from '@/lib/training-calendar';

const SEAT = ['REGISTERED', 'COMPLETED', 'NOT_COMPLETED'];
const newToken = () => randomBytes(24).toString('base64url');

const TRAINING_SELECT = {
  id: true,
  title: true,
  description: true,
  status: true,
  startDate: true,
  endDate: true,
  deliveryMode: true,
  venue: true,
  onlineLink: true,
  sessions: {
    select: { id: true, title: true, status: true, startsAt: true, endsAt: true, deliveryMode: true, venue: true, onlineLink: true },
    orderBy: { startsAt: 'asc' },
  },
};

export function feedUrl(token) {
  return `${appBaseUrl().replace(/\/$/, '')}/api/training/my/calendar.ics?token=${encodeURIComponent(token)}`;
}

/** The person's feed (created on first use). */
export async function getOrCreateFeed(userId) {
  const existing = await prisma.trainingCalendarFeed.findUnique({ where: { userId } });
  if (existing) return existing;
  try {
    return await prisma.trainingCalendarFeed.create({ data: { userId, token: newToken() } });
  } catch (err) {
    if (err?.code === 'P2002') return prisma.trainingCalendarFeed.findUnique({ where: { userId } });
    throw err;
  }
}

/** New token: the old feed URL stops working at once. */
export function rotateFeed(userId) {
  const token = newToken();
  return prisma.trainingCalendarFeed.upsert({
    where: { userId },
    update: { token, rotatedAt: new Date(), lastUsedAt: null },
    create: { userId, token },
  });
}

/** Who a feed token belongs to, or null. */
export async function userForFeedToken(token) {
  if (typeof token !== 'string' || token.length < 20 || token.length > 100) return null;
  const feed = await prisma.trainingCalendarFeed.findUnique({ where: { token }, select: { id: true, userId: true, lastUsedAt: true } });
  if (!feed) return null;
  // Note use at most hourly, to keep calendar polling cheap.
  if (!feed.lastUsedAt || Date.now() - new Date(feed.lastUsedAt).getTime() > 60 * 60 * 1000) {
    await prisma.trainingCalendarFeed.update({ where: { id: feed.id }, data: { lastUsedAt: new Date() } }).catch(() => {});
  }
  return feed.userId;
}

/**
 * Calendar events for a person (#108): sessions of trainings they hold a place in,
 * and the sessions they facilitate. Past events older than a year are left out.
 */
export async function calendarEventsForUser(userId) {
  const since = new Date(Date.now() - 365 * 24 * 60 * 60 * 1000);
  const [registrations, facilitations] = await Promise.all([
    prisma.trainingRegistration.findMany({
      where: { userId, status: { in: SEAT }, training: { endDate: { gte: since } } },
      select: { training: { select: TRAINING_SELECT } },
    }),
    prisma.trainingFacilitator.findMany({
      where: { userId, training: { endDate: { gte: since } } },
      select: { sessionId: true, training: { select: TRAINING_SELECT } },
    }),
  ]);
  const items = registrations.map((r) => ({ training: r.training, role: 'participant' }));
  const byTraining = new Map();
  for (const f of facilitations) {
    const cur = byTraining.get(f.training.id) || { training: f.training, role: 'facilitator', sessionIds: [] };
    if (!f.sessionId) cur.sessionIds = null; // whole training
    else if (cur.sessionIds) cur.sessionIds.push(f.sessionId);
    byTraining.set(f.training.id, cur);
  }
  // A session someone both attends and facilitates appears once (as participant first).
  items.push(...byTraining.values());
  return calendarEvents(items, { baseUrl: appBaseUrl().replace(/\/$/, '') });
}
