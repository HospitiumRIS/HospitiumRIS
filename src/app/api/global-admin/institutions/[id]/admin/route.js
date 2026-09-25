import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireGlobalAdmin } from '@/lib/require-global-admin';
import { hashPassword } from '@/lib/auth';
import {
  loadInstitutionAdmins,
  serializeAdmin,
  validatePasswordPair,
} from '@/lib/institution-admins';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

async function loadInstitution(id) {
  return prisma.institution.findUnique({
    where: { id },
    include: { user: true },
  });
}

function resolveAdminNames(body) {
  const name = body.name?.trim();
  if (name) {
    return { givenName: name, familyName: '' };
  }
  return {
    givenName: body.givenName?.trim() || '',
    familyName: body.familyName?.trim() || '',
  };
}

function adminPayload(body) {
  const { givenName, familyName } = resolveAdminNames(body);
  return {
    givenName,
    familyName,
    email: body.email?.trim()?.toLowerCase(),
    password: body.password,
    confirmPassword: body.confirmPassword,
    isPrimary: Boolean(body.isPrimary),
  };
}

async function assertNotAdminElsewhere(userId, institutionId) {
  const owned = await prisma.institution.findFirst({
    where: {
      userId,
      NOT: { id: institutionId },
    },
    select: { id: true, name: true },
  });
  if (owned) {
    return `This user already administers ${owned.name}`;
  }
  return null;
}

export async function GET(_request, { params }) {
  try {
    const { error } = await requireGlobalAdmin();
    if (error) return error;

    const { id } = await params;
    const institution = await loadInstitution(id);
    if (!institution) {
      return NextResponse.json({ error: 'Institution not found' }, { status: 404 });
    }

    const admins = await loadInstitutionAdmins(id, institution.userId);
    return NextResponse.json({ success: true, admins });
  } catch (err) {
    console.error('Error listing institution admins:', err);
    return NextResponse.json({ error: 'Failed to list institution admins' }, { status: 500 });
  }
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

    const {
      givenName,
      familyName,
      email,
      password,
      confirmPassword,
      isPrimary,
    } = adminPayload(await request.json());

    if (!givenName || !email) {
      return NextResponse.json(
        { error: 'Admin name and email are required' },
        { status: 400 }
      );
    }

    if (!EMAIL_REGEX.test(email)) {
      return NextResponse.json({ error: 'Invalid email format' }, { status: 400 });
    }

    const existingUser = await prisma.user.findUnique({ where: { email } });
    const passwordError = validatePasswordPair(password, confirmPassword, {
      required: !existingUser,
    });
    if (passwordError) {
      return NextResponse.json({ error: passwordError }, { status: 400 });
    }

    if (existingUser?.accountType === 'GLOBAL_ADMIN') {
      return NextResponse.json(
        { error: 'Cannot assign a global administrator as an institution admin' },
        { status: 400 }
      );
    }

    if (
      existingUser?.accountType === 'INSTITUTION_ADMIN' &&
      existingUser.secondaryInstitutionId === institution.id
    ) {
      return NextResponse.json(
        { error: 'This user is already a system admin for this institution' },
        { status: 409 }
      );
    }

    if (existingUser) {
      const elsewhere = await assertNotAdminElsewhere(existingUser.id, institution.id);
      if (elsewhere) {
        return NextResponse.json({ error: elsewhere }, { status: 409 });
      }
    }

    const makePrimary = isPrimary || !institution.userId;
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

      if (makePrimary) {
        await tx.institution.update({
          where: { id: institution.id },
          data: { userId: user.id },
        });
      }

      return user;
    });

    return NextResponse.json({
      success: true,
      message: makePrimary ? 'System admin added and set as primary' : 'System admin added',
      admin: serializeAdmin(admin, makePrimary),
    }, { status: 201 });
  } catch (err) {
    console.error('Error adding institution admin:', err);
    return NextResponse.json({ error: 'Failed to add institution admin' }, { status: 500 });
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

    const body = await request.json();
    const action = body.action || (body.password ? 'reset-password' : null);
    const targetUserId = body.userId || institution.userId || institution.user?.id;

    if (action === 'set-primary') {
      if (!body.userId) {
        return NextResponse.json({ error: 'Admin user id is required' }, { status: 400 });
      }

      const admin = await prisma.user.findFirst({
        where: {
          id: body.userId,
          accountType: 'INSTITUTION_ADMIN',
          secondaryInstitutionId: institution.id,
        },
      });

      if (!admin) {
        return NextResponse.json(
          { error: 'This user is not a system admin for this institution' },
          { status: 400 }
        );
      }

      await prisma.institution.update({
        where: { id: institution.id },
        data: { userId: admin.id },
      });

      return NextResponse.json({
        success: true,
        message: 'Primary system admin updated',
        admin: serializeAdmin(admin, true),
      });
    }

    if (action === 'reset-password') {
      if (!targetUserId) {
        return NextResponse.json(
          { error: 'This institution has no admin to reset' },
          { status: 400 }
        );
      }

      const passwordError = validatePasswordPair(body.password, body.confirmPassword, {
        required: true,
      });
      if (passwordError) {
        return NextResponse.json({ error: passwordError }, { status: 400 });
      }

      const admin = await prisma.user.findFirst({
        where: {
          id: targetUserId,
          accountType: 'INSTITUTION_ADMIN',
          secondaryInstitutionId: institution.id,
        },
      });

      if (!admin) {
        return NextResponse.json(
          { error: 'This user is not a system admin for this institution' },
          { status: 400 }
        );
      }

      await prisma.user.update({
        where: { id: admin.id },
        data: { passwordHash: await hashPassword(body.password) },
      });

      return NextResponse.json({
        success: true,
        message: 'Admin password reset',
        admin: serializeAdmin(admin, admin.id === institution.userId),
      });
    }

    return NextResponse.json({ error: 'Unsupported action' }, { status: 400 });
  } catch (err) {
    console.error('Error updating institution admin:', err);
    return NextResponse.json({ error: 'Failed to update institution admin' }, { status: 500 });
  }
}
