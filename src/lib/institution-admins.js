import prisma from '@/lib/prisma';

export function formatAdminName(admin) {
  return [admin?.givenName, admin?.familyName].filter(Boolean).join(' ');
}

export function serializeAdmin(admin, isPrimary = false) {
  return {
    id: admin.id,
    givenName: admin.givenName,
    familyName: admin.familyName,
    email: admin.email,
    status: admin.status,
    isPrimary,
  };
}

const adminSelect = {
  id: true,
  givenName: true,
  familyName: true,
  email: true,
  status: true,
};

export async function loadInstitutionAdmins(institutionId, primaryUserId = null) {
  const [primaryUser, memberAdmins] = await Promise.all([
    primaryUserId
      ? prisma.user.findUnique({ where: { id: primaryUserId }, select: adminSelect })
      : null,
    prisma.user.findMany({
      where: {
        accountType: 'INSTITUTION_ADMIN',
        secondaryInstitutionId: institutionId,
      },
      select: adminSelect,
      orderBy: { createdAt: 'asc' },
    }),
  ]);

  const byId = new Map();
  for (const admin of memberAdmins) {
    byId.set(admin.id, admin);
  }
  if (primaryUser) {
    byId.set(primaryUser.id, primaryUser);
  }

  const primaryId = primaryUserId || null;
  return Array.from(byId.values()).map((admin) =>
    serializeAdmin(admin, admin.id === primaryId)
  );
}

export function validatePasswordPair(password, confirmPassword, { required = false } = {}) {
  if (!password && !confirmPassword) {
    return required ? 'Password is required' : null;
  }
  if (!password || password.length < 8) {
    return 'Password must be at least 8 characters';
  }
  if (password !== confirmPassword) {
    return 'Passwords do not match';
  }
  return null;
}
