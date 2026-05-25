import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { getAuthenticatedUser } from '@/lib/auth-server';
import fs from 'fs/promises';
import path from 'path';

const prisma = new PrismaClient();
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

    // Get security metrics
    const now = new Date();
    const last24Hours = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const last7Days = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const last30Days = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    // User security metrics
    const [
      totalUsers,
      activeUsers,
      unverifiedUsers,
      suspendedUsers,
      recentLogins,
      failedLogins
    ] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({
        where: {
          status: 'ACTIVE'
        }
      }),
      prisma.user.count({
        where: {
          emailVerified: false
        }
      }),
      prisma.user.count({
        where: {
          status: 'SUSPENDED'
        }
      }),
      prisma.user.count({
        where: {
          updatedAt: {
            gte: last24Hours
          }
        }
      }),
      // This would come from a failed login attempts table if implemented
      0
    ]);

    // Parse security events from logs
    let securityEvents = {
      unauthorized: 0,
      forbidden: 0,
      errors: 0,
      suspiciousActivity: 0
    };

    let recentSecurityEvents = [];
    let topIPs = {};

    try {
      await fs.access(LOG_FILE);
      const logContent = await fs.readFile(LOG_FILE, 'utf-8');
      const logLines = logContent.trim().split('\n').filter(line => line);
      
      logLines.forEach(line => {
        try {
          const log = JSON.parse(line);
          const logDate = new Date(log.timestamp);
          
          if (logDate >= last7Days) {
            // Count security events
            if (log.metadata?.statusCode === 401) {
              securityEvents.unauthorized++;
              if (logDate >= last24Hours) {
                recentSecurityEvents.push({
                  type: 'UNAUTHORIZED',
                  timestamp: log.timestamp,
                  ip: log.metadata?.ip || 'Unknown',
                  message: log.message,
                  user: log.metadata?.user?.email || 'Anonymous'
                });
              }
            }
            if (log.metadata?.statusCode === 403) {
              securityEvents.forbidden++;
              if (logDate >= last24Hours) {
                recentSecurityEvents.push({
                  type: 'FORBIDDEN',
                  timestamp: log.timestamp,
                  ip: log.metadata?.ip || 'Unknown',
                  message: log.message,
                  user: log.metadata?.user?.email || 'Anonymous'
                });
              }
            }
            if (log.level === 'ERROR') {
              securityEvents.errors++;
            }

            // Track IPs
            const ip = log.metadata?.ip;
            if (ip && ip !== 'Unknown' && ip !== '127.0.0.1') {
              topIPs[ip] = (topIPs[ip] || 0) + 1;
            }
          }
        } catch (e) {
          // Skip invalid log lines
        }
      });
    } catch (error) {
      // Log file doesn't exist or can't be read
    }

    // Sort and limit recent events
    recentSecurityEvents.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    recentSecurityEvents = recentSecurityEvents.slice(0, 10);

    // Get top IPs
    const topIPsList = Object.entries(topIPs)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([ip, count]) => ({ ip, requests: count }));

    // Get user account types distribution
    const usersByType = await prisma.user.groupBy({
      by: ['accountType'],
      _count: true
    });

    // Get users by status
    const usersByStatus = await prisma.user.groupBy({
      by: ['status'],
      _count: true
    });

    // Calculate security score (0-100)
    const verificationRate = totalUsers > 0 ? ((totalUsers - unverifiedUsers) / totalUsers) * 100 : 100;
    const activeRate = totalUsers > 0 ? (activeUsers / totalUsers) * 100 : 100;
    const suspensionRate = totalUsers > 0 ? (suspendedUsers / totalUsers) * 100 : 0;
    const errorRate = securityEvents.errors > 0 ? Math.min((securityEvents.errors / 100) * 100, 100) : 0;
    
    const securityScore = Math.round(
      (verificationRate * 0.3) + 
      (activeRate * 0.2) + 
      ((100 - suspensionRate) * 0.2) + 
      ((100 - errorRate) * 0.3)
    );

    return NextResponse.json({
      success: true,
      data: {
        overview: {
          totalUsers,
          activeUsers,
          unverifiedUsers,
          suspendedUsers,
          recentLogins,
          failedLogins,
          securityScore
        },
        securityEvents,
        recentSecurityEvents,
        topIPs: topIPsList,
        usersByType: usersByType.map(item => ({
          type: item.accountType || 'Unknown',
          count: item._count
        })),
        usersByStatus: usersByStatus.map(item => ({
          status: item.status || 'Unknown',
          count: item._count
        }))
      }
    });

  } catch (error) {
    console.error('Error fetching security data:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
