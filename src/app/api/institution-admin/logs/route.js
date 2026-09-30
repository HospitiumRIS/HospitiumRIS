import { NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';
import prisma from '@/lib/prisma';
import {
  requireInstitutionAdmin,
  getOwnedInstitution,
  resolveInstitutionMemberScope,
} from '@/lib/institution-admin';

const LOG_FILE = path.join(process.cwd(), 'logs', 'activity.log');

function getLogUserId(log) {
  return log.metadata?.userId || log.metadata?.user?.id || null;
}

function getLogEmail(log) {
  return (log.metadata?.email || log.metadata?.user?.email || '').toLowerCase();
}

function belongsToInstitution(log, memberIdSet, memberEmailSet) {
  const userId = getLogUserId(log);
  if (userId && memberIdSet.has(userId)) return true;

  const email = getLogEmail(log);
  if (email && memberEmailSet.has(email)) return true;

  return false;
}

function parseLogFile(content) {
  return content
    .trim()
    .split('\n')
    .filter((line) => line.trim())
    .map((line) => {
      try {
        return JSON.parse(line);
      } catch {
        return null;
      }
    })
    .filter(Boolean);
}

function applyFilters(logs, { level, search, startDate, endDate }) {
  return logs.filter((log) => {
    if (level && log.level !== level) return false;

    if (startDate) {
      const logDate = new Date(log.timestamp);
      if (logDate < new Date(startDate)) return false;
    }

    if (endDate) {
      const logDate = new Date(log.timestamp);
      if (logDate > new Date(`${endDate}T23:59:59.999Z`)) return false;
    }

    if (search) {
      const term = search.toLowerCase();
      const messageMatch = log.message?.toLowerCase().includes(term);
      const metadataMatch = JSON.stringify(log.metadata || {}).toLowerCase().includes(term);
      if (!messageMatch && !metadataMatch) return false;
    }

    return true;
  });
}

function buildStats(logs) {
  const last24Hours = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const levels = {};
  const uniqueUsers = new Set();
  let recentErrors = 0;

  logs.forEach((log) => {
    levels[log.level] = (levels[log.level] || 0) + 1;

    if (log.level === 'ERROR' && new Date(log.timestamp) >= last24Hours) {
      recentErrors += 1;
    }

    const userId = getLogUserId(log);
    if (userId) uniqueUsers.add(userId);
  });

  return {
    total: logs.length,
    levels,
    recentErrors,
    uniqueUsers: uniqueUsers.size,
    timeRange: {
      earliest: logs.length > 0 ? logs[logs.length - 1].timestamp : null,
      latest: logs.length > 0 ? logs[0].timestamp : null,
    },
  };
}

export async function GET(request) {
  try {
    const { user, error } = await requireInstitutionAdmin();
    if (error) return error;

    const institution = await getOwnedInstitution(user);
    if (!institution) {
      return NextResponse.json({ success: false, message: 'No institution found' }, { status: 404 });
    }

    const { memberWhere } = await resolveInstitutionMemberScope(institution);
    const members = await prisma.user.findMany({
      where: memberWhere,
      select: { id: true, email: true, givenName: true, familyName: true },
    });

    const memberIdSet = new Set(members.map((member) => member.id));
    const memberEmailSet = new Set(members.map((member) => member.email.toLowerCase()));
    const memberLookup = new Map(
      members.map((member) => [
        member.id,
        {
          id: member.id,
          email: member.email,
          name: `${member.givenName || ''} ${member.familyName || ''}`.trim(),
        },
      ])
    );

    const { searchParams } = new URL(request.url);
    const level = searchParams.get('level') || '';
    const search = searchParams.get('search') || '';
    const startDate = searchParams.get('startDate') || '';
    const endDate = searchParams.get('endDate') || '';
    const sortOrder = searchParams.get('sortOrder') || 'desc';
    const page = Math.max(parseInt(searchParams.get('page') || '1', 10), 1);
    const limit = Math.min(Math.max(parseInt(searchParams.get('limit') || '20', 10), 1), 500);
    const exportAll = searchParams.get('export') === 'true';

    let allLogs = [];
    try {
      await fs.access(LOG_FILE);
      const content = await fs.readFile(LOG_FILE, 'utf-8');
      allLogs = parseLogFile(content).filter((log) =>
        belongsToInstitution(log, memberIdSet, memberEmailSet)
      );
    } catch (err) {
      if (err.code !== 'ENOENT') throw err;
    }

    const filteredLogs = applyFilters(allLogs, { level, search, startDate, endDate });

    filteredLogs.sort((a, b) => {
      const dateA = new Date(a.timestamp).getTime();
      const dateB = new Date(b.timestamp).getTime();
      return sortOrder === 'desc' ? dateB - dateA : dateA - dateB;
    });

    const enrichedLogs = filteredLogs.map((log) => {
      const userId = getLogUserId(log);
      const member = userId ? memberLookup.get(userId) : null;
      return {
        ...log,
        member: member || {
          email: log.metadata?.email || log.metadata?.user?.email || null,
          name: log.metadata?.user?.name || null,
        },
      };
    });

    const stats = buildStats(filteredLogs);
    const total = filteredLogs.length;
    const totalPages = Math.ceil(total / limit) || 0;

    if (exportAll) {
      return NextResponse.json({
        success: true,
        logs: enrichedLogs,
        total,
        stats,
        institutionName: institution.name,
      });
    }

    const startIndex = (page - 1) * limit;
    const paginatedLogs = enrichedLogs.slice(startIndex, startIndex + limit);

    return NextResponse.json({
      success: true,
      logs: paginatedLogs,
      total,
      page,
      limit,
      totalPages,
      stats,
      institutionName: institution.name,
      memberCount: members.length,
    });
  } catch (err) {
    console.error('Error fetching institution logs:', err);
    return NextResponse.json(
      { success: false, message: 'Failed to fetch institution logs', error: err.message },
      { status: 500 }
    );
  }
}
