import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireInstitutionAdmin, getOwnedInstitution } from '@/lib/institution-admin';
import { hashPassword, validateEmail } from '@/lib/auth';
import { normalizeOrcid } from '@/lib/orcid';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MANAGEABLE_ACCOUNT_TYPES = ['RESEARCHER', 'RESEARCH_ADMIN'];

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

async function loadManagedUser(institution, userId) {
  return prisma.user.findFirst({
    where: {
      id: userId,
      AND: [institutionUserWhere(institution)],
    },
  });
}

export async function GET(request, { params }) {
  try {
    const { user, error } = await requireInstitutionAdmin();
    if (error) return error;

    const institution = await getOwnedInstitution(user);
    if (!institution) {
      return NextResponse.json({ success: false, message: 'No institution found' }, { status: 404 });
    }

    const { id } = await params;
    const target = await loadManagedUser(institution, id);
    if (!target) {
      return NextResponse.json({ success: false, message: 'User not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, user: serializeUser(target) });
  } catch (err) {
    console.error('Error fetching user:', err);
    return NextResponse.json({ success: false, message: 'Failed to fetch user' }, { status: 500 });
  }
}

export async function PATCH(request, { params }) {
  try {
    const { user, error } = await requireInstitutionAdmin();
    if (error) return error;

    const institution = await getOwnedInstitution(user);
    if (!institution) {
      return NextResponse.json({ success: false, message: 'No institution found' }, { status: 404 });
    }

    const { id } = await params;
    const existingUser = await loadManagedUser(institution, id);
    if (!existingUser) {
      return NextResponse.json({ success: false, message: 'User not found' }, { status: 404 });
    }

    if (existingUser.accountType === 'GLOBAL_ADMIN') {
      return NextResponse.json({ success: false, message: 'Cannot modify this account' }, { status: 403 });
    }

    const body = await request.json();
    const data = {};

    if (typeof body.givenName === 'string' && body.givenName.trim()) {
      data.givenName = body.givenName.trim();
    }
    if (typeof body.familyName === 'string' && body.familyName.trim()) {
      data.familyName = body.familyName.trim();
    }

    if (typeof body.email === 'string') {
      const email = body.email.trim().toLowerCase();
      if (!EMAIL_REGEX.test(email) || !validateEmail(email)) {
        return NextResponse.json({ success: false, message: 'Invalid email format' }, { status: 400 });
      }
      if (email !== existingUser.email) {
        const taken = await prisma.user.findUnique({ where: { email }, select: { id: true } });
        if (taken) {
          return NextResponse.json({ success: false, message: 'Email already exists' }, { status: 400 });
        }
      }
      data.email = email;
    }

    if (typeof body.status === 'string' && body.status.trim()) {
      if (existingUser.accountType === 'INSTITUTION_ADMIN' && body.status === 'SUSPENDED') {
        return NextResponse.json(
          { success: false, message: 'Cannot suspend institution admin accounts' },
          { status: 403 }
        );
      }
      if (existingUser.id === user.id && body.status !== 'ACTIVE') {
        return NextResponse.json(
          { success: false, message: 'You cannot change your own account status' },
          { status: 403 }
        );
      }
      data.status = body.status;
    }

    if (typeof body.emailVerified === 'boolean') {
      data.emailVerified = body.emailVerified;
    }

    if (typeof body.accountType === 'string' && body.accountType.trim()) {
      if (existingUser.accountType === 'INSTITUTION_ADMIN' || existingUser.id === user.id) {
        return NextResponse.json(
          { success: false, message: 'Cannot change this account type' },
          { status: 403 }
        );
      }
      if (!MANAGEABLE_ACCOUNT_TYPES.includes(body.accountType)) {
        return NextResponse.json({ success: false, message: 'Invalid account type' }, { status: 400 });
      }
      data.accountType = body.accountType;
    }

    const nextAccountType = data.accountType || existingUser.accountType;
    if (body.orcidId !== undefined) {
      if (nextAccountType !== 'RESEARCHER') {
        data.orcidId = null;
      } else {
        const orcid = normalizeOrcid(body.orcidId);
        if (orcid && orcid.error) {
          return NextResponse.json({ success: false, message: orcid.error }, { status: 400 });
        }
        if (orcid) {
          const taken = await prisma.user.findFirst({
            where: { orcidId: orcid, NOT: { id: existingUser.id } },
            select: { id: true },
          });
          if (taken) {
            return NextResponse.json({ success: false, message: 'That ORCID iD is already in use' }, { status: 400 });
          }
        }
        data.orcidId = orcid || null;
      }
    } else if (data.accountType && data.accountType !== 'RESEARCHER') {
      data.orcidId = null;
    }

    if (typeof body.password === 'string') {
      if (body.password.length < 8) {
        return NextResponse.json(
          { success: false, message: 'Password must be at least 8 characters' },
          { status: 400 }
        );
      }
      data.passwordHash = await hashPassword(body.password);
    }

    const updatedUser = await prisma.user.update({
      where: { id: existingUser.id },
      data,
    });

    return NextResponse.json({
      success: true,
      message: body.password ? 'Password updated' : 'User updated successfully',
      user: serializeUser(updatedUser),
    });
  } catch (err) {
    console.error('Error updating user:', err);
    return NextResponse.json({ success: false, message: 'Failed to update user' }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  try {
    const { user, error } = await requireInstitutionAdmin();
    if (error) return error;

    const institution = await getOwnedInstitution(user);
    if (!institution) {
      return NextResponse.json({ success: false, message: 'No institution found' }, { status: 404 });
    }

    const { id } = await params;
    const existingUser = await loadManagedUser(institution, id);
    if (!existingUser) {
      return NextResponse.json({ success: false, message: 'User not found' }, { status: 404 });
    }

    if (existingUser.id === user.id || existingUser.accountType === 'INSTITUTION_ADMIN') {
      return NextResponse.json(
        { success: false, message: 'Cannot delete institution admin accounts' },
        { status: 403 }
      );
    }

    await prisma.user.delete({ where: { id: existingUser.id } });

    return NextResponse.json({ success: true, message: 'User deleted successfully' });
  } catch (err) {
    console.error('Error deleting user:', err);
    return NextResponse.json({ success: false, message: 'Failed to delete user' }, { status: 500 });
  }
}
