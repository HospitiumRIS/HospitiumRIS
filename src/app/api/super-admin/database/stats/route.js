import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET() {
  try {
    // Get database statistics
    const [
      totalUsers,
      activeUsers,
      totalManuscripts,
      totalPublications,
      totalProposals,
      totalDonations,
      totalCampaigns,
      pendingUsers
    ] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { status: 'ACTIVE' } }),
      prisma.manuscript.count(),
      prisma.publication.count(),
      prisma.proposal.count(),
      prisma.donation.count(),
      prisma.campaign.count(),
      prisma.user.count({ where: { status: 'PENDING' } })
    ]);

    // Get database size information (PostgreSQL specific)
    let dbSize = 'N/A';
    let indexSize = 'N/A';
    let totalSize = 'N/A';
    
    try {
      const sizeQuery = await prisma.$queryRaw`
        SELECT 
          pg_size_pretty(pg_database_size(current_database())) as db_size,
          pg_size_pretty(
            pg_total_relation_size(schemaname||'.'||tablename)
          ) as total_size
        FROM pg_tables 
        WHERE schemaname = 'public'
        LIMIT 1
      `;
      
      if (sizeQuery.length > 0) {
        dbSize = sizeQuery[0].db_size;
      }
    } catch (error) {
      console.log('Could not fetch database size:', error.message);
    }

    // Get connection information
    let connections = 0;
    let maxConnections = 100;
    
    try {
      const connectionInfo = await prisma.$queryRaw`
        SELECT 
          count(*) as active_connections,
          setting as max_connections
        FROM pg_stat_activity, pg_settings 
        WHERE pg_settings.name = 'max_connections'
        GROUP BY setting
      `;
      
      if (connectionInfo.length > 0) {
        connections = parseInt(connectionInfo[0].active_connections);
        maxConnections = parseInt(connectionInfo[0].max_connections);
      }
    } catch (error) {
      console.log('Could not fetch connection info:', error.message);
    }

    // Get table sizes and row counts
    const tableStats = await Promise.all([
      {
        name: 'users',
        count: totalUsers,
        model: 'User'
      },
      {
        name: 'manuscripts', 
        count: totalManuscripts,
        model: 'Manuscript'
      },
      {
        name: 'publications',
        count: totalPublications, 
        model: 'Publication'
      },
      {
        name: 'proposals',
        count: totalProposals,
        model: 'Proposal'
      },
      {
        name: 'donations',
        count: totalDonations,
        model: 'Donation'
      },
      {
        name: 'campaigns',
        count: totalCampaigns,
        model: 'Campaign'
      }
    ].map(async (table) => {
      let tableSize = 'N/A';
      
      try {
        const sizeResult = await prisma.$queryRaw`
          SELECT pg_size_pretty(pg_total_relation_size(${table.name})) as size
        `;
        
        if (sizeResult.length > 0) {
          tableSize = sizeResult[0].size;
        }
      } catch (error) {
        console.log(`Could not fetch size for table ${table.name}:`, error.message);
      }
      
      return {
        ...table,
        size: tableSize
      };
    }));

    // Get recent activity/logs count (if you have activity logging)
    let recentLogsCount = 0;
    try {
      // Assuming you have a logs table or activity tracking
      const logsCount = await prisma.registrationLog.count({
        where: {
          attemptedAt: {
            gte: new Date(Date.now() - 24 * 60 * 60 * 1000) // Last 24 hours
          }
        }
      });
      recentLogsCount = logsCount;
    } catch (error) {
      console.log('Could not fetch recent logs count:', error.message);
    }

    // Calculate uptime (you might track this separately)
    const uptimeHours = Math.floor(process.uptime() / 3600);
    const uptimeDays = Math.floor(uptimeHours / 24);
    const remainingHours = uptimeHours % 24;
    const uptime = `${uptimeDays} days, ${remainingHours} hours`;

    const stats = {
      // User statistics
      totalUsers,
      activeUsers,
      pendingUsers,
      suspendedUsers: totalUsers - activeUsers - pendingUsers,
      
      // Content statistics  
      totalManuscripts,
      totalPublications,
      totalProposals,
      totalDonations,
      totalCampaigns,
      
      // Database statistics
      dbSize,
      totalSize,
      connections,
      maxConnections,
      uptime,
      recentLogs: recentLogsCount,
      
      // Performance indicators
      slowQueries: 0, // You might implement slow query logging
      indexEfficiency: 95, // You might calculate this based on query performance
      
      // Table breakdown
      tableStats,
      
      // Backup information
      lastBackup: 'N/A', // You might track this separately
      backupSize: 'N/A',
      
      // Health indicators
      health: 'healthy',
      issues: [],
      
      // Timestamps
      generatedAt: new Date().toISOString(),
      serverTime: new Date().toLocaleString()
    };

    return NextResponse.json({
      success: true,
      stats
    });

  } catch (error) {
    console.error('Error fetching database statistics:', error);
    
    return NextResponse.json({
      success: false,
      message: 'Failed to fetch database statistics',
      error: error.message
    }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}
