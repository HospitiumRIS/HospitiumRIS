import { NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/auth-server';
import DatabaseService from '@/lib/database-service';

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

    // Get all tables
    const tables = await DatabaseService.getAllTables();

    return NextResponse.json({
      success: true,
      tables,
      count: tables.length
    });

  } catch (error) {
    console.error('Error fetching database tables:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}
