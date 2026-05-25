import { NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/auth-server';
import fs from 'fs/promises';
import path from 'path';

const LOG_FILE = path.join(process.cwd(), 'logs', 'activity.log');

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

    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit')) || 100;
    const level = searchParams.get('level');
    const action = searchParams.get('action');
    const userId = searchParams.get('userId');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    // Check if log file exists
    try {
      await fs.access(LOG_FILE);
    } catch {
      return NextResponse.json({
        success: true,
        data: {
          logs: [],
          stats: {
            total: 0,
            byLevel: {},
            byAction: {},
            recentErrors: 0,
            uniqueUsers: 0
          }
        }
      });
    }

    // Read log file
    const logContent = await fs.readFile(LOG_FILE, 'utf-8');
    const logLines = logContent.trim().split('\n').filter(line => line);
    
    // Parse logs
    let logs = logLines
      .map(line => {
        try {
          return JSON.parse(line);
        } catch {
          return null;
        }
      })
      .filter(log => log !== null)
      .reverse(); // Most recent first

    // Apply filters
    if (level) {
      logs = logs.filter(log => log.level === level);
    }
    if (action) {
      logs = logs.filter(log => log.metadata?.action === action);
    }
    if (userId) {
      logs = logs.filter(log => log.metadata?.user?.id === userId || log.metadata?.userId === userId);
    }
    if (startDate) {
      const start = new Date(startDate);
      logs = logs.filter(log => new Date(log.timestamp) >= start);
    }
    if (endDate) {
      const end = new Date(endDate);
      logs = logs.filter(log => new Date(log.timestamp) <= end);
    }

    // Calculate statistics
    const stats = {
      total: logs.length,
      byLevel: {},
      byAction: {},
      recentErrors: 0,
      uniqueUsers: new Set()
    };

    const last24Hours = new Date(Date.now() - 24 * 60 * 60 * 1000);

    logs.forEach(log => {
      // Count by level
      stats.byLevel[log.level] = (stats.byLevel[log.level] || 0) + 1;
      
      // Count by action
      if (log.metadata?.action) {
        stats.byAction[log.metadata.action] = (stats.byAction[log.metadata.action] || 0) + 1;
      }
      
      // Count recent errors
      if (log.level === 'ERROR' && new Date(log.timestamp) >= last24Hours) {
        stats.recentErrors++;
      }
      
      // Track unique users
      if (log.metadata?.user?.id) {
        stats.uniqueUsers.add(log.metadata.user.id);
      } else if (log.metadata?.userId) {
        stats.uniqueUsers.add(log.metadata.userId);
      }
    });

    stats.uniqueUsers = stats.uniqueUsers.size;

    // Limit results
    const limitedLogs = logs.slice(0, limit);

    return NextResponse.json({
      success: true,
      data: {
        logs: limitedLogs,
        stats,
        hasMore: logs.length > limit
      }
    });

  } catch (error) {
    console.error('Error fetching logs:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}
