import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireInstitutionAdmin, getOwnedInstitution } from '@/lib/institution-admin';
import { hashPassword, validateEmail } from '@/lib/auth';
import { normalizeOrcid } from '@/lib/orcid';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MANAGEABLE_ACCOUNT_TYPES = ['RESEARCHER', 'RESEARCH_ADMIN'];
const LIST_ACCOUNT_TYPES = ['RESEARCHER', 'RESEARCH_ADMIN', 'INSTITUTION_ADMIN'];

function institutionUserWhere(institution) {
  const clauses = [{ secondaryInstitutionId: institution.id }];
  if (institution.userId) {
    clauses.push({ id: institution.userId });
  }
  return { OR: clauses };
}

function serializeUser(user) {
  return {
    id: user.id,
    givenName: user.givenName,
    familyName: user.familyName,
    email: user.email,
    accountType: user.accountType,
    status: user.status,
    emailVerified: user.emailVerified,
    orcidId: user.orcidId || null,
    primaryInstitution: user.primaryInstitution || null,
    secondaryInstitutionId: user.secondaryInstitutionId || null,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
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

    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search')?.trim() || '';
    const status = searchParams.get('status') || '';
    const accountType = searchParams.get('accountType') || '';
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10) || 1);
    const limit = Math.min(100, Math.max(10, parseInt(searchParams.get('limit') || '25', 10) || 25));
    const sortBy = ['createdAt', 'givenName', 'familyName', 'email'].includes(searchParams.get('sortBy'))
      ? searchParams.get('sortBy')
      : 'createdAt';
    const sortOrder = searchParams.get('sortOrder') === 'asc' ? 'asc' : 'desc';

    const where = {
      AND: [
        institutionUserWhere(institution),
        { accountType: { not: 'GLOBAL_ADMIN' } },
      ],
    };

    if (search) {
      where.AND.push({
        OR: [
          { givenName: { contains: search, mode: 'insensitive' } },
          { familyName: { contains: search, mode: 'insensitive' } },
          { email: { contains: search, mode: 'insensitive' } },
          { orcidId: { contains: search, mode: 'insensitive' } },
        ],
      });
    }

    if (status) {
      where.AND.push({ status });
    }

    if (accountType && LIST_ACCOUNT_TYPES.includes(accountType)) {
      where.AND.push({ accountType });
    }

    const memberWhere = {
      AND: [
        institutionUserWhere(institution),
        { accountType: { not: 'GLOBAL_ADMIN' } },
      ],
    };

    const [total, users, statusGroups, typeGroups] = await Promise.all([
      prisma.user.count({ where }),
      prisma.user.findMany({
        where,
        select: {
          id: true,
          givenName: true,
          familyName: true,
          email: true,
          accountType: true,
          status: true,
          emailVerified: true,
          orcidId: true,
          primaryInstitution: true,
          secondaryInstitutionId: true,
          createdAt: true,
          updatedAt: true,
        },
        orderBy: { [sortBy]: sortOrder },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.user.groupBy({
        by: ['status'],
        where: memberWhere,
        _count: true,
      }),
      prisma.user.groupBy({
        by: ['accountType'],
        where: memberWhere,
        _count: true,
      }),
    ]);

    const countOf = (row) => (typeof row._count === 'number' ? row._count : row._count?._all || 0);

    const byStatus = { active: 0, pending: 0, inactive: 0, suspended: 0 };
    for (const row of statusGroups) {
      const key = String(row.status).toLowerCase();
      if (key in byStatus) byStatus[key] = countOf(row);
    }

    const byAccountType = { researcher: 0, researchAdmin: 0, institutionAdmin: 0 };
    for (const row of typeGroups) {
      if (row.accountType === 'RESEARCHER') byAccountType.researcher = countOf(row);
      if (row.accountType === 'RESEARCH_ADMIN') byAccountType.researchAdmin = countOf(row);
      if (row.accountType === 'INSTITUTION_ADMIN') byAccountType.institutionAdmin = countOf(row);
    }

    return NextResponse.json({
      success: true,
      users,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
      stats: {
        byStatus,
        byAccountType,
      },
    });
  } catch (err) {
    console.error('Error fetching users:', err);
    return NextResponse.json(
      { success: false, message: 'Failed to fetch users' },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  try {
    const { user, error } = await requireInstitutionAdmin();
    if (error) return error;

    const institution = await getOwnedInstitution(user);
    if (!institution) {
      return NextResponse.json({ success: false, message: 'No institution found' }, { status: 404 });
    }

    const body = await request.json();
    const givenName = body.givenName?.trim();
    const familyName = body.familyName?.trim();
    const email = body.email?.trim()?.toLowerCase();
    const password = body.password;
    const accountType = body.accountType || 'RESEARCHER';

    if (!givenName || !familyName || !email || !password) {
      return NextResponse.json(
        { success: false, message: 'First name, last name, email, and password are required' },
        { status: 400 }
      );
    }

    if (!EMAIL_REGEX.test(email) || !validateEmail(email)) {
      return NextResponse.json({ success: false, message: 'Invalid email format' }, { status: 400 });
    }

    if (password.length < 8) {
      return NextResponse.json(
        { success: false, message: 'Password must be at least 8 characters' },
        { status: 400 }
      );
    }

    if (!MANAGEABLE_ACCOUNT_TYPES.includes(accountType)) {
      return NextResponse.json(
        { success: false, message: 'Account type must be Researcher or Research Admin' },
        { status: 400 }
      );
    }

    const orcid = normalizeOrcid(body.orcidId);
    if (orcid && orcid.error) {
      return NextResponse.json({ success: false, message: orcid.error }, { status: 400 });
    }
    if (accountType !== 'RESEARCHER' && orcid) {
      return NextResponse.json(
        { success: false, message: 'ORCID iD can only be set on researcher accounts' },
        { status: 400 }
      );
    }

    const existingEmail = await prisma.user.findUnique({ where: { email }, select: { id: true } });
    if (existingEmail) {
      return NextResponse.json({ success: false, message: 'Email already exists' }, { status: 400 });
    }

    if (orcid) {
      const existingOrcid = await prisma.user.findFirst({ where: { orcidId: orcid }, select: { id: true } });
      if (existingOrcid) {
        return NextResponse.json({ success: false, message: 'That ORCID iD is already in use' }, { status: 400 });
      }
    }

    const created = await prisma.user.create({
      data: {
        givenName,
        familyName,
        email,
        passwordHash: await hashPassword(password),
        accountType,
        status: 'ACTIVE',
        emailVerified: true,
        primaryInstitution: institution.name,
        secondaryInstitutionId: institution.id,
        institutionVerifiedAt: new Date(),
        institutionVerificationMethod: 'MANUAL',
        orcidId: accountType === 'RESEARCHER' ? orcid || null : null,
      },
    });

    return NextResponse.json({
      success: true,
      message: 'User created',
      user: serializeUser(created),
    }, { status: 201 });
  } catch (err) {
    console.error('Error creating user:', err);
    return NextResponse.json(
      { success: false, message: 'Failed to create user' },
      { status: 500 }
    );
  }
}
