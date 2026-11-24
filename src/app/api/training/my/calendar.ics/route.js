import { NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/auth-server';
import { rateLimit } from '@/lib/simple-rate-limit';
import { buildIcs } from '@/lib/training-calendar';
import { calendarEventsForUser, userForFeedToken } from '@/lib/training-calendar-server';

/**
 * GET /api/training/my/calendar.ics[?token=…]
 * The person's training sessions as an iCalendar feed (#108). Calendar apps use the
 * private token (no sign-in); a signed-in person can also download it without one.
 */
export async function GET(request) {
  try {
    const token = new URL(request.url).searchParams.get('token');
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
    const limited = rateLimit(`training-ics:${token ? token.slice(0, 12) : ip}`, { limit: 60, windowMs: 60 * 60 * 1000 });
    if (!limited.allowed) {
      return new NextResponse('Too many requests', { status: 429, headers: { 'Retry-After': String(Math.ceil(limited.retryAfterMs / 1000)) } });
    }

    let userId = null;
    if (token) {
      userId = await userForFeedToken(token);
      if (!userId) return new NextResponse('Calendar link not found. Copy a fresh link from HospitiumRIS.', { status: 404 });
    } else {
      const user = await getAuthenticatedUser(request);
      if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      userId = user.id;
    }

    const ics = buildIcs(await calendarEventsForUser(userId), { name: 'HospitiumRIS training' });
    return new NextResponse(ics, {
      headers: {
        'Content-Type': 'text/calendar; charset=utf-8',
        'Content-Disposition': `${token ? 'inline' : 'attachment'}; filename="hospitiumris-training.ics"`,
        'Cache-Control': 'private, no-store',
        'X-Robots-Tag': 'noindex',
      },
    });
  } catch (error) {
    console.error('Training calendar feed failed:', error);
    return new NextResponse('Internal server error', { status: 500 });
  }
}
