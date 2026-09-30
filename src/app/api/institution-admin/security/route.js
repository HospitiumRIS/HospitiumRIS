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

function calculateSecurityScore({ totalMembers, activeMembers, unverifiedMembers, suspendedMembers, verifiedDomains, pendingDomains, securityEvents7d }) {
  if (totalMembers === 0) return 100;

  const verificationRate = ((totalMembers - unverifiedMembers) / totalMembers) * 100;
  const activeRate = (activeMembers / totalMembers) * 100;
  const suspensionRate = (suspendedMembers / totalMembers) * 100;
  const domainScore = verifiedDomains > 0 ? 100 : pendingDomains > 0 ? 60 : 40;
  const eventPenalty = Math.min(securityEvents7d * 3, 30);

  const raw =
    verificationRate * 0.3 +
    activeRate * 0.25 +
    (100 - suspensionRate) * 0.2 +
    domainScore * 0.15 +
    Math.max(0, 100 - eventPenalty) * 0.1;

  return Math.round(Math.min(100, Math.max(0, raw)));
}

export async function GET() {
  try {
    const { user, error } = await requireInstitutionAdmin();
    if (error) return error;

    const institution = await getOwnedInstitution(user, {
      include: { verifiedDomains: true },
    });
    if (!institution) {
      return NextResponse.json({ success: false, message: 'No institution found' }, { status: 404 });
    }

    const { memberWhere } = await resolveInstitutionMemberScope(institution);
    const now = new Date();
    const last24Hours = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const last7Days = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    const members = await prisma.user.findMany({
      where: memberWhere,
      select: {
        id: true,
        email: true,
        givenName: true,
        familyName: true,
        status: true,
        emailVerified: true,
        institutionVerifiedAt: true,
        updatedAt: true,
      },
    });

    const memberIdSet = new Set(members.map((member) => member.id));
    const memberEmailSet = new Set(members.map((member) => member.email.toLowerCase()));

    const totalMembers = members.length;
    const activeMembers = members.filter((member) => member.status === 'ACTIVE').length;
    const pendingMembers = members.filter((member) => member.status === 'PENDING').length;
    const suspendedMembers = members.filter((member) => member.status === 'SUSPENDED').length;
    const unverifiedMembers = members.filter((member) => !member.emailVerified).length;
    const unverifiedInstitutionMembers = members.filter((member) => !member.institutionVerifiedAt).length;
    const recentLogins = members.filter((member) => member.updatedAt >= last24Hours).length;

    const domains = institution.verifiedDomains || [];
    const verifiedDomains = domains.filter((domain) => domain.status === 'VERIFIED').length;
    const pendingDomains = domains.filter((domain) => domain.status === 'PENDING').length;
    const suspendedDomains = domains.filter((domain) => domain.status === 'SUSPENDED').length;

    const usersByStatus = Object.entries(
      members.reduce((acc, member) => {
        acc[member.status] = (acc[member.status] || 0) + 1;
        return acc;
      }, {})
    ).map(([status, count]) => ({ status, count }));

    let securityEvents = { unauthorized: 0, forbidden: 0, errors: 0, total: 0 };
    let recentSecurityEvents = [];
    const topIPs = {};

    try {
      await fs.access(LOG_FILE);
      const content = await fs.readFile(LOG_FILE, 'utf-8');
      const institutionLogs = parseLogFile(content).filter((log) =>
        belongsToInstitution(log, memberIdSet, memberEmailSet)
      );

      institutionLogs.forEach((log) => {
        const logDate = new Date(log.timestamp);
        if (logDate < last7Days) return;

        if (log.metadata?.statusCode === 401) {
          securityEvents.unauthorized += 1;
          securityEvents.total += 1;
          if (logDate >= last24Hours) {
            recentSecurityEvents.push({
              type: 'UNAUTHORIZED',
              timestamp: log.timestamp,
              ip: log.metadata?.ip || 'Unknown',
              message: log.message,
              user: log.metadata?.email || log.metadata?.user?.email || 'Unknown',
            });
          }
        }

        if (log.metadata?.statusCode === 403) {
          securityEvents.forbidden += 1;
          securityEvents.total += 1;
          if (logDate >= last24Hours) {
            recentSecurityEvents.push({
              type: 'FORBIDDEN',
              timestamp: log.timestamp,
              ip: log.metadata?.ip || 'Unknown',
              message: log.message,
              user: log.metadata?.email || log.metadata?.user?.email || 'Unknown',
            });
          }
        }

        if (log.level === 'ERROR') {
          securityEvents.errors += 1;
          securityEvents.total += 1;
          if (logDate >= last24Hours) {
            recentSecurityEvents.push({
              type: 'ERROR',
              timestamp: log.timestamp,
              ip: log.metadata?.ip || 'Unknown',
              message: log.message,
              user: log.metadata?.email || log.metadata?.user?.email || 'Unknown',
            });
          }
        }

        const ip = log.metadata?.ip;
        if (ip && ip !== 'Unknown' && ip !== '127.0.0.1' && logDate >= last7Days) {
          topIPs[ip] = (topIPs[ip] || 0) + 1;
        }
      });
    } catch (err) {
      if (err.code !== 'ENOENT') {
        console.warn('Could not read security logs:', err.message);
      }
    }

    recentSecurityEvents.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    recentSecurityEvents = recentSecurityEvents.slice(0, 15);

    const topIPsList = Object.entries(topIPs)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([ip, requests]) => ({ ip, requests }));

    const securityScore = calculateSecurityScore({
      totalMembers,
      activeMembers,
      unverifiedMembers,
      suspendedMembers,
      verifiedDomains,
      pendingDomains,
      securityEvents7d: securityEvents.total,
    });

    const recommendations = [];
    if (unverifiedMembers > 0) {
      recommendations.push({
        id: 'unverified-email',
        severity: 'warning',
        title: `${unverifiedMembers} member${unverifiedMembers === 1 ? '' : 's'} with unverified email`,
        description: 'Review pending accounts and resend verification where needed.',
        href: '/institution-admin/users',
      });
    }
    if (pendingMembers > 0) {
      recommendations.push({
        id: 'pending-users',
        severity: 'info',
        title: `${pendingMembers} pending user approval${pendingMembers === 1 ? '' : 's'}`,
        description: 'Approve or reject users waiting for institution access.',
        href: '/institution-admin/users',
      });
    }
    if (verifiedDomains === 0) {
      recommendations.push({
        id: 'no-verified-domains',
        severity: 'error',
        title: 'No verified email domains',
        description: 'Add and verify at least one domain to control member onboarding.',
        href: '/institution-admin/verified-domains',
      });
    } else if (pendingDomains > 0) {
      recommendations.push({
        id: 'pending-domains',
        severity: 'warning',
        title: `${pendingDomains} domain${pendingDomains === 1 ? '' : 's'} awaiting verification`,
        description: 'Complete domain verification to enable auto-approval.',
        href: '/institution-admin/verified-domains',
      });
    }
    if (suspendedMembers > 0) {
      recommendations.push({
        id: 'suspended-users',
        severity: 'warning',
        title: `${suspendedMembers} suspended member${suspendedMembers === 1 ? '' : 's'}`,
        description: 'Review suspended accounts and restore or remove access.',
        href: '/institution-admin/users',
      });
    }
    if (securityEvents.total > 0) {
      recommendations.push({
        id: 'security-events',
        severity: securityEvents.total >= 5 ? 'error' : 'warning',
        title: `${securityEvents.total} security event${securityEvents.total === 1 ? '' : 's'} in the last 7 days`,
        description: 'Inspect failed logins and permission errors in activity logs.',
        href: '/institution-admin/logs',
      });
    }
    if (recommendations.length === 0) {
      recommendations.push({
        id: 'all-good',
        severity: 'success',
        title: 'Institution security looks healthy',
        description: 'Keep monitoring member access and verified domains regularly.',
        href: null,
      });
    }

    return NextResponse.json({
      success: true,
      data: {
        institutionName: institution.name,
        overview: {
          totalMembers,
          activeMembers,
          pendingMembers,
          suspendedMembers,
          unverifiedMembers,
          unverifiedInstitutionMembers,
          recentLogins,
          securityScore,
        },
        domains: {
          verified: verifiedDomains,
          pending: pendingDomains,
          suspended: suspendedDomains,
          total: domains.length,
        },
        securityEvents,
        recentSecurityEvents,
        topIPs: topIPsList,
        usersByStatus,
        recommendations,
      },
    });
  } catch (err) {
    console.error('Error fetching institution security data:', err);
    return NextResponse.json(
      { success: false, message: 'Failed to fetch security data', error: err.message },
      { status: 500 }
    );
  }
}
