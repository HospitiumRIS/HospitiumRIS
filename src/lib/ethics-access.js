import { staffSharesTenantWithEthicsApplication } from './tenant.js';

const STAFF_ACCOUNT_TYPES = ['RESEARCH_ADMIN', 'INSTITUTION_ADMIN', 'GLOBAL_ADMIN'];

/**
 * Determine whether a user may read ethics application files.
 */
export async function canAccessEthicsApplication(prisma, user, application) {
  if (!user || !application) return false;
  if (application.userId === user.id) return true;
  if (!STAFF_ACCOUNT_TYPES.includes(user.accountType)) return false;
  if (user.accountType === 'GLOBAL_ADMIN') return true;
  return staffSharesTenantWithEthicsApplication(prisma, user, application);
}

export async function canModifyEthicsApplication(prisma, user, application) {
  if (!user || !application) return false;
  if (application.userId === user.id) return true;
  return false;
}
