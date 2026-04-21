import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { getAuthenticatedUser } from '@/lib/auth-server';

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

    // Get database statistics
    const [
      userCount,
      institutionCount,
      publicationCount,
      activityLogCount
    ] = await Promise.all([
      prisma.user.count(),
      prisma.institution.count(),
      prisma.publication.count(),
      prisma.activityLog.count()
    ]);

    // Get database size (PostgreSQL specific)
    let databaseSize = 0;
    let tableCount = 0;
    try {
      const sizeResult = await prisma.$queryRaw`
        SELECT pg_database_size(current_database()) as size
      `;
      databaseSize = Number(sizeResult[0]?.size || 0);

      const tableResult = await prisma.$queryRaw`
        SELECT count(*) as count 
        FROM information_schema.tables 
        WHERE table_schema = 'public'
      `;
      tableCount = Number(tableResult[0]?.count || 0);
    } catch (error) {
      console.error('Error getting database size:', error);
    }

    // Get active connections
    let activeConnections = 0;
    let maxConnections = 100;
    try {
      const connResult = await prisma.$queryRaw`
        SELECT count(*) as count 
        FROM pg_stat_activity 
        WHERE datname = current_database()
      `;
      activeConnections = Number(connResult[0]?.count || 0);

      const maxConnResult = await prisma.$queryRaw`
        SELECT setting::int as max 
        FROM pg_settings 
        WHERE name = 'max_connections'
      `;
      maxConnections = Number(maxConnResult[0]?.max || 100);
    } catch (error) {
      console.error('Error getting connections:', error);
    }

    // Get recent activity (last 10 operations)
    const recentActivity = await prisma.activityLog.findMany({
      take: 10,
      orderBy: {
        createdAt: 'desc'
      },
      select: {
        id: true,
        action: true,
        entityType: true,
        createdAt: true,
        user: {
          select: {
            givenName: true,
            familyName: true,
            email: true
          }
        }
      }
    });

    // Get table sizes (top 5 largest tables)
    let tableSizes = [];
    try {
      const rawTableSizes = await prisma.$queryRaw`
        SELECT 
          schemaname,
          tablename,
          pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size,
          pg_total_relation_size(schemaname||'.'||tablename) AS size_bytes
        FROM pg_tables
        WHERE schemaname = 'public'
        ORDER BY size_bytes DESC
        LIMIT 5
      `;
      tableSizes = rawTableSizes || [];
    } catch (error) {
      console.error('Error getting table sizes:', error);
      tableSizes = [];
    }

    // Calculate database size in MB
    const databaseSizeMB = (databaseSize / (1024 * 1024)).toFixed(2);

    return NextResponse.json({
      stats: {
        totalRecords: userCount + institutionCount + publicationCount,
        users: userCount,
        institutions: institutionCount,
        publications: publicationCount,
        activityLogs: activityLogCount,
        databaseSize: databaseSizeMB,
        tableCount: tableCount
      },
      connections: {
        active: activeConnections,
        max: maxConnections,
        usage: ((activeConnections / maxConnections) * 100).toFixed(1)
      },
      recentActivity: recentActivity.map(log => ({
        id: log.id,
        action: log.action,
        entityType: log.entityType,
        user: log.user ? `${log.user.givenName} ${log.user.familyName}` : 'System',
        timestamp: log.createdAt
      })),
      tableSizes: tableSizes.map(table => ({
        name: table.tablename,
        size: table.size,
        sizeBytes: Number(table.size_bytes)
      }))
    });

  } catch (error) {
    console.error('Error fetching database stats:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
