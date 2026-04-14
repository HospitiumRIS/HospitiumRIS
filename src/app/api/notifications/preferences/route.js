import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { getUserId } from '../../../../lib/auth-server.js';

const prisma = new PrismaClient();

/**
 * Get user notification preferences
 * GET /api/notifications/preferences
 */
export async function GET(request) {
  try {
    const userId = await getUserId();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    let preferences = await prisma.notificationPreference.findUnique({
      where: { userId }
    });

    // Create default preferences if they don't exist
    if (!preferences) {
      preferences = await prisma.notificationPreference.create({
        data: {
          userId,
          emailEnabled: true,
          inAppEnabled: true,
          pushEnabled: false,
          emailDigest: 'IMMEDIATE',
          categoryPreferences: {},
          quietHoursEnabled: false,
          doNotDisturb: false
        }
      });
    }

    return NextResponse.json({ success: true, preferences });
  } catch (error) {
    console.error('Error fetching preferences:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * Update user notification preferences
 * PATCH /api/notifications/preferences
 */
export async function PATCH(request) {
  try {
    const userId = await getUserId();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    
    // Remove userId from body if present (security)
    delete body.userId;
    delete body.id;
    
    const preferences = await prisma.notificationPreference.upsert({
      where: { userId },
      update: body,
      create: { userId, ...body }
    });

    return NextResponse.json({ 
      success: true, 
      message: 'Preferences updated successfully',
      preferences 
    });
  } catch (error) {
    console.error('Error updating preferences:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
