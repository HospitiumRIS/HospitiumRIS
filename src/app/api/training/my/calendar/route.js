import { NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/auth-server';
import { calendarEventsForUser, feedUrl, getOrCreateFeed } from '@/lib/training-calendar-server';

/** GET /api/training/my/calendar: the caller's training events and private feed link (#108). */
export async function GET(request) {
  try {
    const user = await getAuthenticatedUser(request);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const [events, feed] = await Promise.all([calendarEventsForUser(user.id), getOrCreateFeed(user.id)]);
    return NextResponse.json({
      success: true,
      events,
      feed: { url: feedUrl(feed.token), rotatedAt: feed.rotatedAt, lastUsedAt: feed.lastUsedAt },
    });
  } catch (error) {
    console.error('Loading training calendar failed:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
