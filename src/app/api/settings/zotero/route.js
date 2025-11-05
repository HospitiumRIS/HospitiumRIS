import { NextResponse } from 'next/server';
import { getUserId } from '../../../../lib/auth-server';
import { prisma } from '../../../../lib/prisma';

export async function GET(request) {
  try {
    const userId = await getUserId(request);

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Find user settings
    let settings;
    try {
      settings = await prisma.userSettings.findFirst({
        where: {
          userId: userId,
          type: 'ZOTERO'
        }
      });
    } catch (dbError) {
      // If the table doesn't exist yet (migration not run), return default settings
      if (dbError.code === 'P2021' || dbError.message.includes('does not exist')) {
        console.log('UserSettings table not found, returning default settings');
        return NextResponse.json({
          userID: '',
          apiKey: '',
          isConfigured: false,
          lastTested: null
        });
      }
      throw dbError; // Re-throw other database errors
    }

    if (!settings) {
      return NextResponse.json({
        userID: '',
        apiKey: '',
        isConfigured: false,
        lastTested: null
      });
    }

    return NextResponse.json({
      userID: settings.settings.userID || '',
      apiKey: settings.settings.apiKey || '',
      isConfigured: settings.settings.isConfigured || false,
      lastTested: settings.settings.lastTested || null
    });

  } catch (error) {
    console.error('Error fetching Zotero settings:', error);
    return NextResponse.json(
      { error: 'Failed to fetch settings' },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  try {
    const userId = await getUserId(request);

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { userID, apiKey, isConfigured } = body;

    if (!userID || !apiKey) {
      return NextResponse.json(
        { error: 'User ID and API Key are required' },
        { status: 400 }
      );
    }

    const settingsData = {
      userID,
      apiKey,
      isConfigured: Boolean(isConfigured),
      lastTested: new Date().toISOString()
    };

    // Upsert user settings
    let settings;
    try {
      settings = await prisma.userSettings.upsert({
        where: {
          userId_type: {
            userId: userId,
            type: 'ZOTERO'
          }
        },
        update: {
          settings: settingsData,
          updatedAt: new Date()
        },
        create: {
          userId: userId,
          type: 'ZOTERO',
          settings: settingsData
        }
      });
    } catch (dbError) {
      // If the table doesn't exist yet (migration not run), return error with instructions
      if (dbError.code === 'P2021' || dbError.message.includes('does not exist')) {
        console.log('UserSettings table not found, migration needed');
        return NextResponse.json(
          { 
            error: 'Database not ready. Please run: npx prisma migrate dev --name add-user-settings',
            code: 'TABLE_NOT_FOUND'
          },
          { status: 503 }
        );
      }
      throw dbError; // Re-throw other database errors
    }

    return NextResponse.json({
      message: 'Settings saved successfully',
      settings: settingsData
    });

  } catch (error) {
    console.error('Error saving Zotero settings:', error);
    return NextResponse.json(
      { error: 'Failed to save settings' },
      { status: 500 }
    );
  }
}

export async function DELETE(request) {
  try {
    const userId = await getUserId(request);

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Delete user settings
    try {
      await prisma.userSettings.deleteMany({
        where: {
          userId: userId,
          type: 'ZOTERO'
        }
      });
    } catch (dbError) {
      // If the table doesn't exist yet (migration not run), consider it "cleared"
      if (dbError.code === 'P2021' || dbError.message.includes('does not exist')) {
        console.log('UserSettings table not found, considering settings cleared');
        return NextResponse.json({
          message: 'Settings cleared successfully'
        });
      }
      throw dbError; // Re-throw other database errors
    }

    return NextResponse.json({
      message: 'Settings cleared successfully'
    });

  } catch (error) {
    console.error('Error clearing Zotero settings:', error);
    return NextResponse.json(
      { error: 'Failed to clear settings' },
      { status: 500 }
    );
  }
}
