import { NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/auth-server';
import DatabaseService from '@/lib/database-service';

export async function POST(request) {
  try {
    // Check authentication and authorization
    const currentUser = await getAuthenticatedUser();
    
    if (!currentUser) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    if (currentUser.accountType !== 'GLOBAL_ADMIN') {
      return NextResponse.json(
        { error: 'Forbidden - Global Admin access required' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { format = 'sql', outputPath = null } = body;

    // Validate format
    const validFormats = ['sql', 'tar', 'custom', 'dump'];
    if (!validFormats.includes(format.toLowerCase())) {
      return NextResponse.json(
        { error: `Invalid format. Must be one of: ${validFormats.join(', ')}` },
        { status: 400 }
      );
    }

    // Create backup
    const result = await DatabaseService.createBackup(format, outputPath);

    return NextResponse.json({
      success: true,
      message: 'Backup created successfully',
      backup: result
    });

  } catch (error) {
    console.error('Error creating backup:', error);
    return NextResponse.json(
      { error: 'Failed to create backup', details: error.message },
      { status: 500 }
    );
  }
}

export async function GET(request) {
  try {
    // Check authentication and authorization
    const currentUser = await getAuthenticatedUser();
    
    if (!currentUser) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    if (currentUser.accountType !== 'GLOBAL_ADMIN') {
      return NextResponse.json(
        { error: 'Forbidden - Global Admin access required' },
        { status: 403 }
      );
    }

    // List all backups
    const backups = await DatabaseService.listBackups();

    return NextResponse.json({
      success: true,
      backups,
      count: backups.length
    });

  } catch (error) {
    console.error('Error listing backups:', error);
    return NextResponse.json(
      { error: 'Failed to list backups', details: error.message },
      { status: 500 }
    );
  }
}
