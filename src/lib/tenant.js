/**
 * Resolve the tenant (Institution) ID for a user.
 * Used for storage key prefixes and cross-tenant access checks.
 *
 * @param {object|null} user - Authenticated user with institution relations
 * @returns {string|null} Institution.id, or null for personal namespace
 */
export function resolveTenantId(user) {
  if (!user) return null;
  if (user.secondaryInstitutionId) return user.secondaryInstitutionId;
  if (user.institution?.id) return user.institution.id;
  return null;
}

/**
 * Get tenant ID for an ethics application owner.
 */
export async function resolveEthicsApplicationTenantId(prisma, application) {
  if (!application?.userId) return null;
  const owner = await prisma.user.findUnique({
    where: { id: application.userId },
    select: { secondaryInstitutionId: true, institution: { select: { id: true } } },
  });
  return resolveTenantId(owner);
}

/**
 * Returns true when staff user belongs to the same tenant as the application owner.
 */
export async function staffSharesTenantWithEthicsApplication(prisma, user, application) {
  if (!user || !application) return false;
  if (user.accountType === 'GLOBAL_ADMIN') return true;

  const staffTenantId = resolveTenantId(user);
  if (!staffTenantId) return false;

  const ownerTenantId = await resolveEthicsApplicationTenantId(prisma, application);
  return staffTenantId === ownerTenantId;
}
