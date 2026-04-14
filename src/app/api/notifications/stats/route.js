import { NextResponse } from 'next/server';
import { getUserId } from '../../../../lib/auth-server.js';
import { notificationService } from '../../../../services/notificationService.js';

/**
 * Get notification statistics for the current user
 * GET /api/notifications/stats
 */
export async function GET(request) {
  try {
    const userId = await getUserId();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const stats = await notificationService.getStatistics(userId);
    
    return NextResponse.json({ success: true, stats });
  } catch (error) {
    console.error('Error fetching stats:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
