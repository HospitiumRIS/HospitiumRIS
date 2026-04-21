import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { getAuthenticatedUser } from '@/lib/auth-server';
import os from 'os';

const prisma = new PrismaClient();

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

    // Get system metrics
    const totalMemory = os.totalmem();
    const freeMemory = os.freemem();
    const usedMemory = totalMemory - freeMemory;
    const memoryUsage = ((usedMemory / totalMemory) * 100).toFixed(1);

    const cpus = os.cpus();
    const cpuCount = cpus.length;
    
    // Calculate average CPU usage
    let totalIdle = 0;
    let totalTick = 0;
    cpus.forEach(cpu => {
      for (const type in cpu.times) {
        totalTick += cpu.times[type];
      }
      totalIdle += cpu.times.idle;
    });
    const cpuUsage = (100 - (100 * totalIdle / totalTick)).toFixed(1);

    // Get system uptime
    const uptimeSeconds = os.uptime();
    const uptimeDays = Math.floor(uptimeSeconds / 86400);
    const uptimeHours = Math.floor((uptimeSeconds % 86400) / 3600);
    const uptimeMinutes = Math.floor((uptimeSeconds % 3600) / 60);

    // Test database connection
    let databaseHealth = 'healthy';
    let databaseConnections = 0;
    try {
      await prisma.$queryRaw`SELECT 1`;
      // Try to get connection count (this is database-specific)
      const result = await prisma.$queryRaw`
        SELECT count(*) as count 
        FROM pg_stat_activity 
        WHERE datname = current_database()
      `;
      databaseConnections = Number(result[0]?.count || 0);
    } catch (error) {
      console.error('Database health check failed:', error);
      databaseHealth = 'error';
    }

    // Simulate network latency check (ping to database)
    const startTime = Date.now();
    await prisma.$queryRaw`SELECT 1`;
    const networkLatency = Date.now() - startTime;

    // Disk usage (Note: This is simplified, actual disk usage would need OS-specific commands)
    // For now, we'll use a placeholder
    const diskUsage = 45.2; // Placeholder

    return NextResponse.json({
      cpu: {
        usage: parseFloat(cpuUsage),
        cores: cpuCount
      },
      memory: {
        usage: parseFloat(memoryUsage),
        total: (totalMemory / (1024 ** 3)).toFixed(2), // GB
        used: (usedMemory / (1024 ** 3)).toFixed(2), // GB
        free: (freeMemory / (1024 ** 3)).toFixed(2) // GB
      },
      disk: {
        usage: diskUsage
      },
      network: {
        latency: networkLatency
      },
      database: {
        status: databaseHealth,
        connections: databaseConnections,
        maxConnections: 100 // Placeholder, would need to query from DB config
      },
      uptime: {
        seconds: uptimeSeconds,
        days: uptimeDays,
        hours: uptimeHours,
        minutes: uptimeMinutes,
        formatted: `${uptimeDays}d ${uptimeHours}h ${uptimeMinutes}m`
      },
      platform: os.platform(),
      hostname: os.hostname(),
      nodeVersion: process.version
    });

  } catch (error) {
    console.error('Error fetching system health:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
