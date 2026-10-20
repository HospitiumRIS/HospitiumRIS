import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getAuthenticatedUser } from '@/lib/auth-server';
import {
  activeMemberWhere,
  resolveDirectoryInstitution,
  toDirectoryResearcher,
} from '@/lib/institution-directory';

const SORTS = {
  name: [{ familyName: 'asc' }, { givenName: 'asc' }],
  recent: [{ createdAt: 'desc' }],
  publications: [{ publications: { _count: 'desc' } }, { familyName: 'asc' }],
};

/**
 * GET /api/researcher/institution-directory
 * Paginated list of verified, active researchers at the caller's institution.
 * Query: q (name / email / ORCID / department text), department (exact),
 *        page (0-based), pageSize (max 50), sort (name | recent | publications),
 *        meta=0 to skip the department list.
 */
export async function GET(request) {
  try {
    const user = await getAuthenticatedUser(request);
    if (!user) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });

    const institution = resolveDirectoryInstitution(user);
    if (!institution) {
      return NextResponse.json({
        success: true,
        linked: false,
        institution: null,
        departments: [],
        researchers: [],
        total: 0,
        directoryTotal: 0,
        page: 0,
        pageSize: 0,
      });
    }

    const { searchParams } = new URL(request.url);
    const q = (searchParams.get('q') || '').trim().slice(0, 120);
    const department = (searchParams.get('department') || '').trim();
    const pageSize = Math.min(Math.max(parseInt(searchParams.get('pageSize'), 10) || 25, 1), 50);
    const page = Math.max(parseInt(searchParams.get('page'), 10) || 0, 0);
    const orderBy = SORTS[searchParams.get('sort')] || SORTS.name;
    const includeMeta = searchParams.get('meta') !== '0';

    const baseWhere = { ...activeMemberWhere(institution.id), id: { not: user.id } };
    const where = { ...baseWhere };

    const tokens = q.split(/\s+/).filter(Boolean).slice(0, 5);
    if (tokens.length) {
      where.AND = tokens.map((token) => ({
        OR: [
          { givenName: { contains: token, mode: 'insensitive' } },
          { familyName: { contains: token, mode: 'insensitive' } },
          { orcidGivenNames: { contains: token, mode: 'insensitive' } },
          { orcidFamilyName: { contains: token, mode: 'insensitive' } },
          { email: { contains: token, mode: 'insensitive' } },
          { orcidId: { contains: token } },
          { researchProfile: { is: { department: { contains: token, mode: 'insensitive' } } } },
        ],
      }));
    }
    if (department) {
      where.researchProfile = { is: { department: { equals: department, mode: 'insensitive' } } };
    }

    const [users, total, directoryTotal, departmentRows] = await Promise.all([
      prisma.user.findMany({
        where,
        select: {
          id: true,
          givenName: true,
          familyName: true,
          email: true,
          orcidId: true,
          avatarUrl: true,
          researchProfile: { select: { department: true, academicTitle: true } },
          _count: { select: { publications: true } },
        },
        orderBy,
        skip: page * pageSize,
        take: pageSize,
      }),
      prisma.user.count({ where }),
      includeMeta ? prisma.user.count({ where: baseWhere }) : Promise.resolve(null),
      includeMeta
        ? prisma.researchProfile.findMany({
            where: { department: { not: null }, user: activeMemberWhere(institution.id) },
            select: { department: true },
            distinct: ['department'],
          })
        : Promise.resolve(null),
    ]);

    let departments;
    if (departmentRows) {
      const departmentMap = new Map();
      for (const row of departmentRows) {
        const name = (row.department || '').trim();
        if (name && !departmentMap.has(name.toLowerCase())) departmentMap.set(name.toLowerCase(), name);
      }
      departments = [...departmentMap.values()].sort((a, b) => a.localeCompare(b));
    }

    return NextResponse.json({
      success: true,
      linked: true,
      institution,
      ...(includeMeta ? { departments, directoryTotal } : {}),
      researchers: users.map((member) => toDirectoryResearcher(member, institution.name)),
      total,
      page,
      pageSize,
    });
  } catch (error) {
    console.error('Institution directory error:', error);
    return NextResponse.json({ success: false, error: 'Failed to load institution directory' }, { status: 500 });
  }
}
