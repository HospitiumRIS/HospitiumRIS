import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getAuthenticatedUser } from '@/lib/auth-server';

const ALLOWED_ACCOUNT_TYPES = ['INSTITUTION_ADMIN', 'RESEARCH_ADMIN'];

export async function requireInstitutionAdmin() {
  const user = await getAuthenticatedUser();

  if (!user) {
    return {
      error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }),
    };
  }

  if (!ALLOWED_ACCOUNT_TYPES.includes(user.accountType)) {
    return {
      error: NextResponse.json(
        { error: 'Forbidden - Institution Admin access required' },
        { status: 403 }
      ),
    };
  }

  return { user };
}

export async function getOwnedInstitution(user, extra = {}) {
  if (!user) return null;

  const include = extra.include || undefined;

  const byOwner = await prisma.institution.findUnique({
    where: { userId: user.id },
    include,
  });
  if (byOwner) return byOwner;

  if (user.secondaryInstitutionId) {
    return prisma.institution.findUnique({
      where: { id: user.secondaryInstitutionId },
      include,
    });
  }

  return null;
}
