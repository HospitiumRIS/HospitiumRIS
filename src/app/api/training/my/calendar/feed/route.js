import { NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/auth-server';
import { feedUrl, rotateFeed } from '@/lib/training-calendar-server';

/** POST /api/training/my/calendar/feed: a new private feed link; the old one stops working (#108). */
export async function POST(request) {
  try {
    const user = await getAuthenticatedUser(request);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const feed = await rotateFeed(user.id);
    return NextResponse.json({ success: true, feed: { url: feedUrl(feed.token), rotatedAt: feed.rotatedAt, lastUsedAt: null } });
  } catch (error) {
    console.error('Rotating calendar feed failed:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
