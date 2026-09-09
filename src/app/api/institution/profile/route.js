import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getAuthenticatedUser } from '@/lib/auth-server';
import { uniqueInstitutionSlug } from '@/lib/institution-slug';
import { defaultEnabledModules } from '@/lib/institution-modules';

const ALLOWED_ACCOUNT_TYPES = ['RESEARCH_ADMIN', 'INSTITUTION_ADMIN'];

function unauthorized() {
  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
}

function forbidden() {
  return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
}

function buildProfileResponse(userProfile) {
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
    institution: userProfile.institution
      ? {
          id: userProfile.institution.id,
          name: userProfile.institution.name,
          type: userProfile.institution.type,
          country: userProfile.institution.country,
          website: userProfile.institution.website,
          createdAt: userProfile.institution.createdAt,
          updatedAt: userProfile.institution.updatedAt,
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
      include: { institution: true },
    });

    if (!userProfile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      profile: buildProfileResponse(userProfile),
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

    if (body.institution && user.institution) {
      await prisma.institution.update({
        where: { id: user.institution.id },
        data: {
          name: body.institution.name?.trim() || user.institution.name,
          type: body.institution.type?.trim() || user.institution.type,
          country: body.institution.country?.trim() || user.institution.country,
          website: body.institution.website?.trim() || null,
        },
      });
    } else if (body.institution && !user.institution && body.institution.name) {
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
      include: { institution: true },
    });

    return NextResponse.json({
      success: true,
      message: 'Profile updated successfully',
      profile: buildProfileResponse(updated),
    });
  } catch (error) {
    console.error('Error updating institution profile:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
