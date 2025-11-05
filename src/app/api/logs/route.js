import { NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';
import { getRequestMetadata, logApiActivity, logError } from '@/utils/activityLogger';
import { getAuthenticatedUser } from '@/lib/auth-server';

const LOG_FILE = path.join(process.cwd(), 'logs', 'activity.log');

// Helper function to check if user is admin
const isAdminUser = async (request) => {
  try {
    // Try to get user from our auth system
    let user = null;
    
    try {
      user = await getAuthenticatedUser(request);
    } catch (authError) {
      // Fallback: check session cookie directly
      const sessionCookie = request.cookies.get('hospitium_session')?.value;
      if (sessionCookie) {
        const { default: prisma } = await import('@/lib/prisma');
        user = await prisma.user.findUnique({
          where: { id: sessionCookie },
          include: {
            institution: true,
            foundation: true,
          }
        });
        
        // Check if user is active and verified
        if (user && (user.status !== 'ACTIVE' || !user.emailVerified)) {
          user = null;
        }
      }
    }
    
    if (!user) {
      return { isAdmin: false, user: null };
    }

    // Allow RESEARCH_ADMIN, FOUNDATION_ADMIN, and SUPER_ADMIN to access logs
    const isAdmin = user.accountType === 'RESEARCH_ADMIN' || 
                   user.accountType === 'FOUNDATION_ADMIN' || 
                   user.accountType === 'SUPER_ADMIN';
    
    return { isAdmin, user };
  } catch (error) {
    console.error('Error checking admin status:', error);
    return { isAdmin: false, user: null };
  }
};

export async function GET(request) {
  const requestMetadata = getRequestMetadata(request);

  try {
    // Check if user is authorized to view logs
    const { isAdmin, user } = await isAdminUser(request);
    
    if (!isAdmin) {
      // Log unauthorized access attempt
      await logError('Unauthorized logs access attempt', {
        ...requestMetadata,
        userId: user?.id,
        email: user?.email,
        accountType: user?.accountType,
        reason: 'insufficient_privileges'
      });
      
      await logApiActivity('GET', '/api/logs', 403, {
        ...requestMetadata,
        userId: user?.id,
        error: 'unauthorized_access'
      });
      
      return NextResponse.json(
        { 
          success: false, 
          message: 'Unauthorized. Admin access required.' 
        },
        { status: 403 }
      );
    }

    // Log successful logs access
    await logApiActivity('GET', '/api/logs', 200, {
      ...requestMetadata,
      userId: user.id,
      email: user.email,
      accountType: user.accountType,
      action: 'view_logs'
    });

    const { searchParams } = new URL(request.url);
    
    // Parse query parameters
    const level = searchParams.get('level'); // Filter by log level
    const search = searchParams.get('search'); // Search in messages
    const startDate = searchParams.get('startDate'); // Date range start
    const endDate = searchParams.get('endDate'); // Date range end
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');
    const sortOrder = searchParams.get('sort') || 'desc'; // 'asc' or 'desc'

    // Check if log file exists
    try {
      await fs.access(LOG_FILE);
    } catch {
      return NextResponse.json({
        success: true,
        logs: [],
        total: 0,
        page,
        limit,
        totalPages: 0,
        message: 'No log file found yet'
      });
    }

    // Read log file
    const logContent = await fs.readFile(LOG_FILE, 'utf-8');
    const logLines = logContent.trim().split('\n').filter(line => line.trim());

    // Parse and filter logs
    let logs = [];
    
    for (const line of logLines) {
      try {
        const logEntry = JSON.parse(line);
        
        // Apply filters
        let include = true;
        
        // Level filter
        if (level && logEntry.level !== level) {
          include = false;
        }
        
        // Date range filter
        if (startDate) {
          const logDate = new Date(logEntry.timestamp);
          const filterStartDate = new Date(startDate);
          if (logDate < filterStartDate) {
            include = false;
          }
        }
        
        if (endDate) {
          const logDate = new Date(logEntry.timestamp);
          const filterEndDate = new Date(endDate + 'T23:59:59.999Z'); // End of day
          if (logDate > filterEndDate) {
            include = false;
          }
        }
        
        // Search filter (in message and metadata)
        if (search) {
          const searchLower = search.toLowerCase();
          const messageMatch = logEntry.message?.toLowerCase().includes(searchLower);
          const metadataMatch = JSON.stringify(logEntry.metadata || {}).toLowerCase().includes(searchLower);
          
          if (!messageMatch && !metadataMatch) {
            include = false;
          }
        }
        
        if (include) {
          logs.push(logEntry);
        }
      } catch (parseError) {
        // Skip invalid JSON lines
        console.warn('Failed to parse log line:', line);
      }
    }

    // Sort logs
    logs.sort((a, b) => {
      const dateA = new Date(a.timestamp);
      const dateB = new Date(b.timestamp);
      
      return sortOrder === 'desc' 
        ? dateB.getTime() - dateA.getTime()
        : dateA.getTime() - dateB.getTime();
    });

    // Calculate pagination
    const total = logs.length;
    const totalPages = Math.ceil(total / limit);
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedLogs = logs.slice(startIndex, endIndex);

    // Get log statistics
    const stats = {
      total,
      levels: {},
      timeRange: {
        earliest: logs.length > 0 ? logs[logs.length - 1].timestamp : null,
        latest: logs.length > 0 ? logs[0].timestamp : null
      }
    };

    // Count log levels
    logs.forEach(log => {
      stats.levels[log.level] = (stats.levels[log.level] || 0) + 1;
    });

    return NextResponse.json({
      success: true,
      logs: paginatedLogs,
      total,
      page,
      limit,
      totalPages,
      stats,
      filters: {
        level,
        search,
        startDate,
        endDate,
        sortOrder
      }
    });

  } catch (error) {
    console.error('Error fetching logs:', error);
    
    return NextResponse.json(
      {
        success: false,
        message: 'Failed to fetch logs',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { status: 500 }
    );
  }
}

// DELETE endpoint to clear logs (admin only)
export async function DELETE(request) {
  const requestMetadata = getRequestMetadata(request);

  try {
    // Check if user is authorized
    const { isAdmin, user } = await isAdminUser(request);
    
    if (!isAdmin) {
      // Log unauthorized clear attempt
      await logError('Unauthorized logs clear attempt', {
        ...requestMetadata,
        userId: user?.id,
        email: user?.email,
        accountType: user?.accountType,
        reason: 'insufficient_privileges'
      });
      
      await logApiActivity('DELETE', '/api/logs', 403, {
        ...requestMetadata,
        userId: user?.id,
        error: 'unauthorized_access'
      });
      
      return NextResponse.json(
        { 
          success: false, 
          message: 'Unauthorized. Admin access required.' 
        },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const confirm = searchParams.get('confirm');

    if (confirm !== 'true') {
      return NextResponse.json(
        { 
          success: false, 
          message: 'Confirmation required. Add ?confirm=true to clear logs.' 
        },
        { status: 400 }
      );
    }

    // Create backup before clearing
    const backupFile = path.join(
      process.cwd(), 
      'logs', 
      `activity-backup-${new Date().toISOString().replace(/[:.]/g, '-')}.log`
    );

    try {
      await fs.copyFile(LOG_FILE, backupFile);
      console.log(`Log backup created: ${backupFile}`);
    } catch (backupError) {
      console.warn('Failed to create backup:', backupError);
    }

    // Clear the log file
    await fs.writeFile(LOG_FILE, '');

    // Log the clear operation
    await logApiActivity('DELETE', '/api/logs', 200, {
      ...requestMetadata,
      userId: user.id,
      email: user.email,
      accountType: user.accountType,
      action: 'clear_logs',
      backup: backupFile
    });

    return NextResponse.json({
      success: true,
      message: 'Logs cleared successfully',
      backup: backupFile
    });

  } catch (error) {
    console.error('Error clearing logs:', error);
    
    return NextResponse.json(
      {
        success: false,
        message: 'Failed to clear logs',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { status: 500 }
    );
  }
}
