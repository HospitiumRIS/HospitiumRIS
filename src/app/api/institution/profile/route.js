import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getAuthenticatedUser } from '@/lib/auth-server';
import { uniqueInstitutionSlug } from '@/lib/institution-slug';
import { defaultEnabledModules } from '@/lib/institution-modules';
import { resolveUserInstitution } from '@/lib/institution-scope';

const ALLOWED_ACCOUNT_TYPES = ['RESEARCH_ADMIN', 'INSTITUTION_ADMIN'];

function unauthorized() {
  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
}

function forbidden() {
  return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
}

function buildProfileResponse(userProfile, institution) {
  return {
    id: userProfile.id,
    email: userProfile.email,
    givenName: userProfile.givenName,
    familyName: userProfile.familyName,
    orcidId: userProfile.orcidId,
    orcidGivenNames: userProfile.orcidGivenNames,
    orcidFamilyName: userProfile.orcidFamilyName,
    primaryInstitution: userProfile.primaryInstitution,
    accountType: userProfile.accountType,
    status: userProfile.status,
    emailVerified: userProfile.emailVerified,
    createdAt: userProfile.createdAt,
    updatedAt: userProfile.updatedAt,
    institution: institution
      ? {
          id: institution.id,
          name: institution.name,
          type: institution.type,
          country: institution.country,
          website: institution.website,
          createdAt: institution.createdAt,
          updatedAt: institution.updatedAt,
        }
      : null,
  };
}

export async function GET(request) {
  try {
    const user = await getAuthenticatedUser(request);
    if (!user) return unauthorized();
    if (!ALLOWED_ACCOUNT_TYPES.includes(user.accountType)) return forbidden();

    const userProfile = await prisma.user.findUnique({
      where: { id: user.id },
    });

    if (!userProfile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
    }

    const institution = await resolveUserInstitution(user);

    return NextResponse.json({
      success: true,
      profile: buildProfileResponse(userProfile, institution),
    });
  } catch (error) {
    console.error('Error fetching institution profile:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(request) {
  try {
    const user = await getAuthenticatedUser(request);
    if (!user) return unauthorized();
    if (!ALLOWED_ACCOUNT_TYPES.includes(user.accountType)) return forbidden();

    const body = await request.json();

    await prisma.user.update({
      where: { id: user.id },
      data: {
        givenName: body.givenName?.trim() || user.givenName,
        familyName: body.familyName?.trim() || user.familyName,
        primaryInstitution: body.primaryInstitution?.trim() || user.primaryInstitution,
      },
    });

    const existingInstitution = await resolveUserInstitution(user);

    if (body.institution && existingInstitution) {
      await prisma.institution.update({
        where: { id: existingInstitution.id },
        data: {
          name: body.institution.name?.trim() || existingInstitution.name,
          type: body.institution.type?.trim() || existingInstitution.type,
          country: body.institution.country?.trim() || existingInstitution.country,
          website: body.institution.website?.trim() || null,
        },
      });
    } else if (body.institution && !existingInstitution && body.institution.name) {
      await prisma.institution.create({
        data: {
          userId: user.id,
          name: body.institution.name.trim(),
          slug: await uniqueInstitutionSlug(prisma, body.institution.name.trim()),
          type: body.institution.type?.trim() || 'Research Institute',
          country: body.institution.country?.trim() || 'Unknown',
          website: body.institution.website?.trim() || null,
          contactEmail: user.email,
          enabledModules: defaultEnabledModules(),
        },
      });
    }

    const updated = await prisma.user.findUnique({
      where: { id: user.id },
    });
    const institution = await resolveUserInstitution(user);

    return NextResponse.json({
      success: true,
      message: 'Profile updated successfully',
      profile: buildProfileResponse(updated, institution),
    });
  } catch (error) {
    console.error('Error updating institution profile:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
