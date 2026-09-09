import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireInstitutionAdmin, getOwnedInstitution } from '@/lib/institution-admin';
import { uniqueInstitutionSlug, slugify } from '@/lib/institution-slug';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const INSTITUTION_TYPES = [
  'UNIVERSITY',
  'RESEARCH_INSTITUTE',
  'HOSPITAL',
  'GOVERNMENT',
  'PRIVATE',
  'NON_PROFIT',
  'OTHER',
];

function serializeInstitution(institution) {
  return {
    id: institution.id,
    name: institution.name,
    slug: institution.slug,
    type: institution.type,
    country: institution.country,
    website: institution.website,
    contactEmail: institution.contactEmail,
    logo: institution.logo,
    createdAt: institution.createdAt,
    updatedAt: institution.updatedAt,
    domains: institution.verifiedDomains || [],
  };
}

export async function GET() {
  try {
    const { user, error } = await requireInstitutionAdmin();
    if (error) return error;

    const institution = await getOwnedInstitution(user, {
      include: {
        verifiedDomains: {
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!institution) {
      return NextResponse.json({ error: 'No institution found for this admin' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      institution: serializeInstitution(institution),
    });
  } catch (err) {
    console.error('Error fetching institution profile:', err);
    return NextResponse.json({ error: 'Failed to load institution profile' }, { status: 500 });
  }
}

export async function PUT(request) {
  try {
    const { user, error } = await requireInstitutionAdmin();
    if (error) return error;

    const institution = await getOwnedInstitution(user);
    if (!institution) {
      return NextResponse.json({ error: 'No institution found for this admin' }, { status: 404 });
    }

    const body = await request.json();
    const data = {};

    if (typeof body.name === 'string' && body.name.trim()) {
      data.name = body.name.trim();
    }

    if (typeof body.contactEmail === 'string') {
      const email = body.contactEmail.trim().toLowerCase();
      if (email && !EMAIL_REGEX.test(email)) {
        return NextResponse.json({ error: 'Invalid contact email' }, { status: 400 });
      }
      data.contactEmail = email || null;
    }

    if (typeof body.website === 'string') {
      data.website = body.website.trim() || null;
    }

    if (typeof body.country === 'string') {
      data.country = body.country.trim();
    }

    if (typeof body.type === 'string' && INSTITUTION_TYPES.includes(body.type)) {
      data.type = body.type;
    }

    if (typeof body.slug === 'string' && body.slug.trim()) {
      data.slug = await uniqueInstitutionSlug(prisma, slugify(body.slug), institution.id);
    }

    const updated = await prisma.institution.update({
      where: { id: institution.id },
      data,
      include: {
        verifiedDomains: {
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Institution profile updated',
      institution: serializeInstitution(updated),
    });
  } catch (err) {
    console.error('Error updating institution profile:', err);
    return NextResponse.json({ error: 'Failed to update institution profile' }, { status: 500 });
  }
}
