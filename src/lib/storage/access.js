import { resolveTenantId } from '../tenant.js';

/**
 * Basic tenant isolation for StoredFile rows.
 * Module-specific entity checks are added at cutover (Phase 2).
 */
export function canReadStoredFile(user, file) {
  if (!file || file.status === 'DELETED') return false;
  if (file.visibility === 'PUBLIC') return Boolean(user);
  if (!user) return false;
  if (user.accountType === 'GLOBAL_ADMIN') return true;
  if (file.ownerUserId === user.id) return true;

  const userTenant = resolveTenantId(user);
  if (!userTenant || !file.tenantId) return false;
  return userTenant === file.tenantId;
}

export function canWriteStoredFile(user, file) {
  if (!user || !file) return false;
  if (file.status === 'DELETED') return false;
  if (user.accountType === 'GLOBAL_ADMIN') return true;
  return file.ownerUserId === user.id;
}

/**
 * Cross-tenant upload initiation guard: caller tenant must match declared entity tenant
 * when both are known. Phase 2 adds entity-level policy functions.
 */
export function canInitiateForTenant(user, entityTenantId) {
  if (!user) return false;
  if (user.accountType === 'GLOBAL_ADMIN') return true;
  if (!entityTenantId) return true;
  const userTenant = resolveTenantId(user);
  return userTenant === entityTenantId;
}
