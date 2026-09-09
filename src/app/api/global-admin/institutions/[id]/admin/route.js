import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireGlobalAdmin } from '@/lib/require-global-admin';
import { hashPassword } from '@/lib/auth';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function serializeAdmin(admin) {
  return {
    id: admin.id,
    givenName: admin.givenName,
    familyName: admin.familyName,
    email: admin.email,
    status: admin.status,
  };
}

async function loadInstitution(id) {
  return prisma.institution.findUnique({
    where: { id },
    include: { user: true },
  });
}

function adminPayload(body) {
  return {
    givenName: body.givenName?.trim(),
    familyName: body.familyName?.trim(),
    email: body.email?.trim()?.toLowerCase(),
    password: body.password,
  };
}

export async function POST(request, { params }) {
  try {
    const { error } = await requireGlobalAdmin();
    if (error) return error;

    const { id } = await params;
    const institution = await loadInstitution(id);

    if (!institution) {
      return NextResponse.json({ error: 'Institution not found' }, { status: 404 });
    }

    if (institution.userId || institution.user) {
      return NextResponse.json(
        { error: 'This institution already has an admin' },
        { status: 409 }
      );
    }

    const { givenName, familyName, email, password } = adminPayload(await request.json());

    if (!givenName || !familyName || !email || !password) {
      return NextResponse.json(
        { error: 'First name, last name, email, and password are required' },
        { status: 400 }
      );
    }

    if (!EMAIL_REGEX.test(email)) {
      return NextResponse.json({ error: 'Invalid email format' }, { status: 400 });
    }

    if (password.length < 8) {
      return NextResponse.json(
        { error: 'Password must be at least 8 characters' },
        { status: 400 }
      );
    }

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return NextResponse.json({ error: 'Email already exists' }, { status: 400 });
    }

    const passwordHash = await hashPassword(password);

    const admin = await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          givenName,
          familyName,
          email,
          passwordHash,
          accountType: 'INSTITUTION_ADMIN',
          status: 'ACTIVE',
          emailVerified: true,
          primaryInstitution: institution.name,
          secondaryInstitutionId: institution.id,
          institutionVerifiedAt: new Date(),
          institutionVerificationMethod: 'MANUAL',
        },
      });

      await tx.institution.update({
        where: { id: institution.id },
        data: { userId: user.id },
      });

      return user;
    });

    return NextResponse.json({
      success: true,
      message: 'Institution admin created',
      admin: serializeAdmin(admin),
    }, { status: 201 });
  } catch (err) {
    console.error('Error adding institution admin:', err);
    return NextResponse.json({ error: 'Failed to add institution admin' }, { status: 500 });
  }
}

export async function PUT(request, { params }) {
  try {
    const { error } = await requireGlobalAdmin();
    if (error) return error;

    const { id } = await params;
    const institution = await loadInstitution(id);

    if (!institution) {
      return NextResponse.json({ error: 'Institution not found' }, { status: 404 });
    }

    const { givenName, familyName, email, password } = adminPayload(await request.json());

    if (!givenName || !familyName || !email) {
      return NextResponse.json(
        { error: 'First name, last name, and email are required' },
        { status: 400 }
      );
    }

    if (!EMAIL_REGEX.test(email)) {
      return NextResponse.json({ error: 'Invalid email format' }, { status: 400 });
    }

    if (password && password.length < 8) {
      return NextResponse.json(
        { error: 'Password must be at least 8 characters' },
        { status: 400 }
      );
    }

    const existingUser = await prisma.user.findUnique({ where: { email } });
    const currentAdminId = institution.userId || institution.user?.id || null;

    if (!existingUser && (!password || password.length < 8)) {
      return NextResponse.json(
        { error: 'Password must be at least 8 characters for a new admin account' },
        { status: 400 }
      );
    }

    if (existingUser?.accountType === 'GLOBAL_ADMIN') {
      return NextResponse.json(
        { error: 'Cannot assign a global administrator as an institution admin' },
        { status: 400 }
      );
    }

    if (existingUser && existingUser.id !== currentAdminId) {
      const owned = await prisma.institution.findUnique({
        where: { userId: existingUser.id },
        select: { id: true, name: true },
      });
      if (owned && owned.id !== institution.id) {
        return NextResponse.json(
          { error: `This user already administers ${owned.name}` },
          { status: 409 }
        );
      }
    }

    const passwordHash = password ? await hashPassword(password) : undefined;

    const admin = await prisma.$transaction(async (tx) => {
      let user;

      if (existingUser) {
        user = await tx.user.update({
          where: { id: existingUser.id },
          data: {
            givenName,
            familyName,
            accountType: 'INSTITUTION_ADMIN',
            status: 'ACTIVE',
            emailVerified: true,
            primaryInstitution: institution.name,
            secondaryInstitutionId: institution.id,
            institutionVerifiedAt: new Date(),
            institutionVerificationMethod: 'MANUAL',
            ...(passwordHash ? { passwordHash } : {}),
          },
        });
      } else {
        user = await tx.user.create({
          data: {
            givenName,
            familyName,
            email,
            passwordHash,
            accountType: 'INSTITUTION_ADMIN',
            status: 'ACTIVE',
            emailVerified: true,
            primaryInstitution: institution.name,
            secondaryInstitutionId: institution.id,
            institutionVerifiedAt: new Date(),
            institutionVerificationMethod: 'MANUAL',
          },
        });
      }

      await tx.institution.update({
        where: { id: institution.id },
        data: { userId: user.id },
      });

      if (currentAdminId && currentAdminId !== user.id) {
        await tx.user.update({
          where: { id: currentAdminId },
          data: { accountType: 'RESEARCHER' },
        });
      }

      return user;
    });

    return NextResponse.json({
      success: true,
      message: currentAdminId && currentAdminId !== admin.id
        ? 'Institution admin reassigned'
        : currentAdminId
          ? 'Institution admin updated'
          : 'Institution admin assigned',
      admin: serializeAdmin(admin),
    });
  } catch (err) {
    console.error('Error reassigning institution admin:', err);
    return NextResponse.json({ error: 'Failed to reassign institution admin' }, { status: 500 });
  }
}

export async function PATCH(request, { params }) {
  try {
    const { error } = await requireGlobalAdmin();
    if (error) return error;

    const { id } = await params;
    const institution = await loadInstitution(id);

    if (!institution) {
      return NextResponse.json({ error: 'Institution not found' }, { status: 404 });
    }

    if (!institution.user) {
      return NextResponse.json(
        { error: 'This institution has no admin to reset' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const password = body.password;

    if (!password || password.length < 8) {
      return NextResponse.json(
        { error: 'Password must be at least 8 characters' },
        { status: 400 }
      );
    }

    await prisma.user.update({
      where: { id: institution.user.id },
      data: { passwordHash: await hashPassword(password) },
    });

    return NextResponse.json({
      success: true,
      message: 'Admin password reset',
      admin: serializeAdmin(institution.user),
    });
  } catch (err) {
    console.error('Error resetting institution admin password:', err);
    return NextResponse.json({ error: 'Failed to reset admin password' }, { status: 500 });
  }
}
