import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { getAuthenticatedUser } from '@/lib/auth-server';
import os from 'os';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);
const prisma = new PrismaClient();

export async function GET(request) {
  try {
    const user = await getAuthenticatedUser(request);
    
    if (!user || user.accountType !== 'SUPER_ADMIN') {
      return NextResponse.json(
        { error: 'Unauthorized. Super Admin access required.' },
        { status: 403 }
      );
    }

    // Get time period filter from query params
    const { searchParams } = new URL(request.url);
    const period = searchParams.get('period') || 'week';
    
    // Calculate date range based on period
    const now = new Date();
    let startDate = new Date();
    
    switch (period) {
      case 'week':
        startDate.setDate(now.getDate() - 7);
        break;
      case 'month':
        startDate.setMonth(now.getMonth() - 1);
        break;
      case '3months':
        startDate.setMonth(now.getMonth() - 3);
        break;
      case '6months':
        startDate.setMonth(now.getMonth() - 6);
        break;
      case 'year':
        startDate.setFullYear(now.getFullYear() - 1);
        break;
      default:
        startDate.setDate(now.getDate() - 7);
    }

    // Fetch user statistics
    const totalUsers = await prisma.user.count();
    
    const activeUsers = await prisma.user.count({
      where: { status: 'ACTIVE' }
    });
    
    const pendingUsers = await prisma.user.count({
      where: { status: 'PENDING' }
    });

    // Get new users created today
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const newUsersToday = await prisma.user.count({
      where: {
        createdAt: {
          gte: today
        }
      }
    });

    // Fetch manuscript statistics
    const totalManuscripts = await prisma.manuscript.count();
    
    const activeManuscripts = await prisma.manuscript.count({
      where: {
        status: {
          in: ['DRAFT', 'IN_REVIEW', 'UNDER_REVISION']
        }
      }
    });

    // Fetch recent users based on time period filter
    const recentUsers = await prisma.user.findMany({
      where: {
        createdAt: {
          gte: startDate
        }
      },
      take: 50,
      orderBy: {
        createdAt: 'desc'
      },
      select: {
        id: true,
        givenName: true,
        familyName: true,
        email: true,
        accountType: true,
        status: true,
        createdAt: true
      }
    });

    // Format recent users data
    const formattedRecentUsers = recentUsers.map(user => ({
      id: user.id,
      name: `${user.givenName} ${user.familyName}`,
      email: user.email,
      accountType: user.accountType,
      status: user.status,
      createdAt: user.createdAt.toISOString()
    }));

    // Get system health metrics
    const totalMemory = os.totalmem();
    const freeMemory = os.freemem();
    const usedMemory = totalMemory - freeMemory;
    const memoryUsage = Math.round((usedMemory / totalMemory) * 100);

    // CPU usage (simplified - average load)
    const loadAverage = os.loadavg();
    const cpuCount = os.cpus().length;
    const cpuUsage = Math.min(Math.round((loadAverage[0] / cpuCount) * 100), 100);

    // Get actual disk usage
    let diskUsage = 0;
    try {
      const platform = os.platform();
      let command;
      
      if (platform === 'win32') {
        // Windows: Get C: drive usage
        command = 'wmic logicaldisk where "DeviceID=\'C:\'" get Size,FreeSpace /format:list';
      } else if (platform === 'darwin' || platform === 'linux') {
        // macOS/Linux: Get root partition usage
        command = 'df -k / | tail -1';
      }
      
      if (command) {
        const { stdout } = await execAsync(command);
        
        if (platform === 'win32') {
          const lines = stdout.split('\n').filter(line => line.trim());
          let freeSpace = 0;
          let totalSize = 0;
          
          lines.forEach(line => {
            if (line.startsWith('FreeSpace=')) {
              freeSpace = parseInt(line.split('=')[1]);
            } else if (line.startsWith('Size=')) {
              totalSize = parseInt(line.split('=')[1]);
            }
          });
          
          if (totalSize > 0) {
            diskUsage = Math.round(((totalSize - freeSpace) / totalSize) * 100);
          }
        } else {
          // Parse df output for Unix-like systems
          const parts = stdout.trim().split(/\s+/);
          if (parts.length >= 5) {
            const usedPercent = parts[4].replace('%', '');
            diskUsage = parseInt(usedPercent);
          }
        }
      }
    } catch (error) {
      console.error('Error fetching disk usage:', error);
      // Fallback to a safe default if disk check fails
      diskUsage = 0;
    }

    const systemHealth = {
      cpuUsage,
      memoryUsage,
      diskUsage,
      totalMemoryGB: Math.round(totalMemory / (1024 ** 3)),
      usedMemoryGB: Math.round(usedMemory / (1024 ** 3)),
      freeMemoryGB: Math.round(freeMemory / (1024 ** 3)),
      cpuCount,
      platform: os.platform(),
      uptime: Math.round(os.uptime() / 3600), // Convert to hours
      status: (cpuUsage < 80 && memoryUsage < 80 && diskUsage < 80) ? 'healthy' : 'warning'
    };

    return NextResponse.json({
      stats: {
        totalUsers,
        activeUsers,
        pendingUsers,
        newUsersToday,
        totalManuscripts,
        activeManuscripts
      },
      recentUsers: formattedRecentUsers,
      systemHealth
    });

  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    return NextResponse.json(
      { error: 'Failed to fetch dashboard statistics' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
