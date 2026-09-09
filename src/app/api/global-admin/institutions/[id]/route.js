import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireGlobalAdmin } from '@/lib/require-global-admin';
import { uniqueInstitutionSlug, slugify } from '@/lib/institution-slug';
import { normalizeEnabledModules } from '@/lib/institution-modules';
import { INSTITUTION_TYPE_VALUES } from '@/lib/institution-types';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

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
      verificationMethod: true,
      createdAt: true,
    },
    orderBy: { createdAt: 'desc' },
  },
  _count: {
    select: { members: true },
  },
};

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

export async function GET(request, { params }) {
  try {
    const { error } = await requireGlobalAdmin();
    if (error) return error;

    const { id } = await params;
    const institution = await prisma.institution.findUnique({
      where: { id },
      include: institutionInclude,
    });

    if (!institution) {
      return NextResponse.json({ error: 'Institution not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      institution: serializeInstitution(institution),
    });
  } catch (err) {
    console.error('Error fetching institution:', err);
    return NextResponse.json({ error: 'Failed to fetch institution' }, { status: 500 });
  }
}

export async function PUT(request, { params }) {
  try {
    const { error } = await requireGlobalAdmin();
    if (error) return error;

    const { id } = await params;
    const body = await request.json();

    const existing = await prisma.institution.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: 'Institution not found' }, { status: 404 });
    }

    const data = {};

    if (typeof body.name === 'string' && body.name.trim()) {
      data.name = body.name.trim();
      if (data.name.toLowerCase() !== existing.name.toLowerCase()) {
        const nameTaken = await prisma.institution.findFirst({
          where: {
            name: { equals: data.name, mode: 'insensitive' },
            NOT: { id },
          },
        });
        if (nameTaken) {
          return NextResponse.json(
            { error: 'An institution with this name already exists' },
            { status: 400 }
          );
        }
      }
    }

    if (typeof body.contactEmail === 'string') {
      const email = body.contactEmail.trim().toLowerCase();
      if (email && !EMAIL_REGEX.test(email)) {
        return NextResponse.json({ error: 'Invalid contact email' }, { status: 400 });
      }
      data.contactEmail = email || null;
    }

    if (typeof body.type === 'string' && body.type.trim()) {
      if (!INSTITUTION_TYPE_VALUES.includes(body.type.trim())) {
        return NextResponse.json({ error: 'Invalid institution type' }, { status: 400 });
      }
      data.type = body.type.trim();
    }

    if (typeof body.country === 'string') {
      data.country = body.country.trim();
    }

    if (typeof body.website === 'string') {
      data.website = body.website.trim() || null;
    }

    if (typeof body.slug === 'string' && body.slug.trim()) {
      data.slug = await uniqueInstitutionSlug(prisma, slugify(body.slug), id);
    }

    if (body.enabledModules !== undefined) {
      data.enabledModules = normalizeEnabledModules(body.enabledModules);
    }

    const institution = await prisma.institution.update({
      where: { id },
      data,
      include: institutionInclude,
    });

    return NextResponse.json({
      success: true,
      message: 'Institution updated',
      institution: serializeInstitution(institution),
    });
  } catch (err) {
    console.error('Error updating institution:', err);
    return NextResponse.json({ error: 'Failed to update institution' }, { status: 500 });
  }
}
