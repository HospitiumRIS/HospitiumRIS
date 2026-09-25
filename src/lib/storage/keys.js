import { randomUUID } from 'crypto';
import { resolveTenantId } from '../tenant.js';
import { sanitizeFileName } from '../sanitize-file-name.js';

const PERSONAL_TENANT = '_none';
const PLATFORM_TENANT = '_platform';
const UNASSIGNED_TENANT = '_unassigned';

/**
 * Resolve tenant prefix segment for storage keys.
 */
export function resolveTenant(user) {
  const tenantId = resolveTenantId(user);
  if (tenantId) return tenantId;
  if (user?.accountType === 'GLOBAL_ADMIN') return PLATFORM_TENANT;
  if (user?.id) return `${PERSONAL_TENANT}/u/${user.id}`;
  return UNASSIGNED_TENANT;
}

/**
 * Build an object storage key. Client file names never appear in the key.
 */
export function buildKey({ tenantId, module, entityId, fileId, ext }) {
  const safeExt = String(ext || 'bin').replace(/[^a-z0-9]/gi, '').toLowerCase() || 'bin';
  const safeModule = String(module || 'unknown').toLowerCase();
  const safeEntityId = String(entityId || 'unknown');
  const safeFileId = fileId || randomUUID().replace(/-/g, '');
  return `t/${tenantId}/${safeModule}/${safeEntityId}/${safeFileId}.${safeExt}`;
}

/**
 * Derive extension from original name using module policy allowlist.
 */
export function extensionFromOriginalName(originalName, allowedExtensions) {
  const base = sanitizeFileName(originalName);
  const parts = base.split('.');
  const ext = parts.length > 1 ? parts.pop().toLowerCase() : '';
  if (!allowedExtensions.includes(ext)) return null;
  return ext;
}

export { PERSONAL_TENANT, PLATFORM_TENANT, UNASSIGNED_TENANT };
