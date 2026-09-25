import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireGlobalAdmin } from '@/lib/require-global-admin';
import { uniqueInstitutionSlug, slugify } from '@/lib/institution-slug';
import { normalizeEnabledModules } from '@/lib/institution-modules';
import { INSTITUTION_TYPE_VALUES } from '@/lib/institution-types';
import { loadInstitutionAdmins } from '@/lib/institution-admins';
import { deleteInstitutionLogoFile } from '@/lib/institution-logo';

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

async function serializeInstitution(institution) {
  const admins = await loadInstitutionAdmins(institution.id, institution.userId);
  const primaryAdmin = admins.find((admin) => admin.isPrimary) || admins[0] || null;

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
    admin: primaryAdmin,
    admins,
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
      institution: await serializeInstitution(institution),
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
      institution: await serializeInstitution(institution),
    });
  } catch (err) {
    console.error('Error updating institution:', err);
    return NextResponse.json({ error: 'Failed to update institution' }, { status: 500 });
  }
}

export async function DELETE(_request, { params }) {
  try {
    const { user, error } = await requireGlobalAdmin();
    if (error) return error;

    const { id } = await params;
    const institution = await prisma.institution.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        logo: true,
        userId: true,
        _count: { select: { members: true } },
      },
    });

    if (!institution) {
      return NextResponse.json({ error: 'Institution not found' }, { status: 404 });
    }

    const adminConditions = [{ secondaryInstitutionId: id }];
    if (institution.userId) {
      adminConditions.push({ id: institution.userId });
    }

    await prisma.$transaction(async (tx) => {
      await tx.user.updateMany({
        where: {
          OR: adminConditions,
          accountType: 'INSTITUTION_ADMIN',
        },
        data: {
          accountType: 'RESEARCHER',
          secondaryInstitutionId: null,
          institutionVerifiedAt: null,
          institutionVerificationMethod: null,
        },
      });

      await tx.user.updateMany({
        where: { secondaryInstitutionId: id },
        data: {
          secondaryInstitutionId: null,
          institutionVerifiedAt: null,
          institutionVerificationMethod: null,
        },
      });

      await tx.institution.delete({ where: { id } });
    });

    if (institution.logo) {
      await deleteInstitutionLogoFile(institution.logo, user);
    }

    return NextResponse.json({
      success: true,
      message: 'Institution deleted',
      deleted: {
        id: institution.id,
        name: institution.name,
        memberCount: institution._count.members,
      },
    });
  } catch (err) {
    console.error('Error deleting institution:', err);
    return NextResponse.json({ error: 'Failed to delete institution' }, { status: 500 });
  }
}
