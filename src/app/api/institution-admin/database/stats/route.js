import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import {
  requireInstitutionAdmin,
  getOwnedInstitution,
  resolveInstitutionMemberScope,
  getInstitutionMemberIds,
} from '@/lib/institution-admin';

export async function GET() {
  try {
    const { user, error } = await requireInstitutionAdmin();
    if (error) return error;

    const institution = await getOwnedInstitution(user);
    if (!institution) {
      return NextResponse.json({ success: false, message: 'No institution found' }, { status: 404 });
    }

    const { memberWhere, verifiedDomains } = await resolveInstitutionMemberScope(institution);
    const userIds = await getInstitutionMemberIds(institution, { memberWhere, verifiedDomains });

    const [
      totalUsers,
      activeUsers,
      pendingUsers,
      totalManuscripts,
      totalPublications,
      totalProposals,
    ] = await Promise.all([
      prisma.user.count({ where: memberWhere }),
      prisma.user.count({ where: { AND: [memberWhere, { status: 'ACTIVE' }] } }),
      prisma.user.count({ where: { AND: [memberWhere, { status: 'PENDING' }] } }),
      userIds.length
        ? prisma.manuscript.count({ where: { createdBy: { in: userIds } } })
        : Promise.resolve(0),
      userIds.length
        ? prisma.publication.count({
            where: { authorRelations: { some: { userId: { in: userIds } } } },
          })
        : Promise.resolve(0),
      prisma.proposalReviewTracking.count({
        where: { pipeline: { institutionId: institution.id } },
      }),
    ]);

    let dbSize = 'N/A';
    let connections = 0;
    let maxConnections = 100;

    try {
      const sizeQuery = await prisma.$queryRaw`
        SELECT pg_size_pretty(pg_database_size(current_database())) as db_size
      `;
      if (sizeQuery.length > 0) {
        dbSize = sizeQuery[0].db_size;
      }
    } catch (err) {
      console.log('Could not fetch database size:', err.message);
    }

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
        connections = parseInt(connectionInfo[0].active_connections, 10);
        maxConnections = parseInt(connectionInfo[0].max_connections, 10);
      }
    } catch (err) {
      console.log('Could not fetch connection info:', err.message);
    }

    const uptimeHours = Math.floor(process.uptime() / 3600);
    const uptimeDays = Math.floor(uptimeHours / 24);
    const remainingHours = uptimeHours % 24;

    const tableStats = [
      { name: 'users', label: 'Users', count: totalUsers },
      { name: 'manuscripts', label: 'Manuscripts', count: totalManuscripts },
      { name: 'publications', label: 'Publications', count: totalPublications },
      { name: 'proposals', label: 'Proposals in review', count: totalProposals },
    ];

    return NextResponse.json({
      success: true,
      stats: {
        institutionName: institution.name,
        totalUsers,
        activeUsers,
        pendingUsers,
        totalManuscripts,
        totalPublications,
        totalProposals,
        dbSize,
        connections,
        maxConnections,
        uptime: `${uptimeDays} days, ${remainingHours} hours`,
        tableStats,
        health: 'healthy',
        generatedAt: new Date().toISOString(),
      },
    });
  } catch (err) {
    console.error('Error fetching database statistics:', err);
    return NextResponse.json(
      { success: false, message: 'Failed to fetch database statistics', error: err.message },
      { status: 500 }
    );
  }
}
