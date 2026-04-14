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
    
    if (!user || user.accountType !== 'GLOBAL_ADMIN') {
      return NextResponse.json(
        { error: 'Unauthorized. Global Admin access required.' },
        { status: 403 }
      );
    }

    // Fetch system-wide statistics
    const totalUsers = await prisma.user.count();
    const activeUsers = await prisma.user.count({
      where: { status: 'ACTIVE' }
    });
    const totalManuscripts = await prisma.manuscript.count();
    
    // Count institution admins (as proxy for institutions)
    const totalInstitutions = await prisma.user.count({
      where: { accountType: 'INSTITUTION_ADMIN' }
    });

    // Get system health metrics
    const totalMemory = os.totalmem();
    const freeMemory = os.freemem();
    const usedMemory = totalMemory - freeMemory;
    const memoryUsage = Math.round((usedMemory / totalMemory) * 100);

    const loadAverage = os.loadavg();
    const cpuCount = os.cpus().length;
    const cpuUsage = Math.min(Math.round((loadAverage[0] / cpuCount) * 100), 100);

    let diskUsage = 0;
    try {
      const platform = os.platform();
      let command;
      
      if (platform === 'win32') {
        command = 'wmic logicaldisk where "DeviceID=\'C:\'" get Size,FreeSpace /format:list';
      } else if (platform === 'darwin' || platform === 'linux') {
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
          const parts = stdout.trim().split(/\s+/);
          if (parts.length >= 5) {
            const usedPercent = parts[4].replace('%', '');
            diskUsage = parseInt(usedPercent);
          }
        }
      }
    } catch (error) {
      console.error('Error fetching disk usage:', error);
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
      uptime: Math.round(os.uptime() / 3600),
      status: (cpuUsage < 80 && memoryUsage < 80 && diskUsage < 80) ? 'healthy' : 'warning'
    };

    return NextResponse.json({
      stats: {
        totalInstitutions,
        totalUsers,
        activeUsers,
        totalManuscripts
      },
      systemHealth
    });

  } catch (error) {
    console.error('Error fetching global admin dashboard stats:', error);
    return NextResponse.json(
      { error: 'Failed to fetch dashboard statistics' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
