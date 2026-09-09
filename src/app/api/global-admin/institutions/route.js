import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireGlobalAdmin } from '@/lib/require-global-admin';
import { uniqueInstitutionSlug, slugify } from '@/lib/institution-slug';
import { defaultEnabledModules } from '@/lib/institution-modules';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function serializeInstitution(institution) {
  return {
    id: institution.id,
    name: institution.name,
    slug: institution.slug,
    type: institution.type,
    country: institution.country,
    website: institution.website,
    contactEmail: institution.contactEmail,
    enabledModules: Array.isArray(institution.enabledModules) ? institution.enabledModules : [],
    createdAt: institution.createdAt,
    updatedAt: institution.updatedAt,
    admin: institution.user
      ? {
          id: institution.user.id,
          givenName: institution.user.givenName,
          familyName: institution.user.familyName,
          email: institution.user.email,
          status: institution.user.status,
        }
      : null,
    domains: institution.verifiedDomains || [],
    memberCount: institution._count?.members ?? 0,
  };
}

const institutionInclude = {
  user: {
    select: {
      id: true,
      givenName: true,
      familyName: true,
      email: true,
      status: true,
    },
  },
  verifiedDomains: {
    select: {
      id: true,
      domain: true,
      status: true,
      createdAt: true,
    },
    orderBy: { createdAt: 'desc' },
  },
  _count: {
    select: { members: true },
  },
};

export async function GET() {
  try {
    const { user, error } = await requireGlobalAdmin();
    if (error) return error;

    const institutions = await prisma.institution.findMany({
      include: institutionInclude,
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({
      success: true,
      institutions: institutions.map(serializeInstitution),
    });
  } catch (err) {
    console.error('Error fetching institutions:', err);
    return NextResponse.json({ error: 'Failed to fetch institutions' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const { user, error } = await requireGlobalAdmin();
    if (error) return error;

    const body = await request.json();
    const name = body.name?.trim();
    const contactEmail = body.contactEmail?.trim()?.toLowerCase();
    const type = body.type || 'UNIVERSITY';
    const country = body.country?.trim() || '';

    if (!name) {
      return NextResponse.json({ error: 'Institution name is required' }, { status: 400 });
    }

    if (!contactEmail || !EMAIL_REGEX.test(contactEmail)) {
      return NextResponse.json({ error: 'A valid contact email is required' }, { status: 400 });
    }

    const requestedSlug = slugify(body.slug || name);
    if (!requestedSlug) {
      return NextResponse.json({ error: 'A valid slug is required' }, { status: 400 });
    }

    const existingName = await prisma.institution.findFirst({
      where: { name: { equals: name, mode: 'insensitive' } },
    });
    if (existingName) {
      return NextResponse.json({ error: 'An institution with this name already exists' }, { status: 400 });
    }

    const slug = await uniqueInstitutionSlug(prisma, requestedSlug);

    const institution = await prisma.institution.create({
      data: {
        name,
        slug,
        contactEmail,
        type,
        country,
        enabledModules: defaultEnabledModules(),
      },
      include: institutionInclude,
    });

    return NextResponse.json({
      success: true,
      message: 'Institution created',
      institution: serializeInstitution(institution),
    }, { status: 201 });
  } catch (err) {
    console.error('Error creating institution:', err);
    return NextResponse.json({ error: 'Failed to create institution' }, { status: 500 });
  }
}
