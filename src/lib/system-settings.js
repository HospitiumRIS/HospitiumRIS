/**
 * Platform-wide settings (Global Admin > System Settings).
 *
 * Stored in the `system_settings` table, one row per section. Each row holds
 * only the fields an admin changed; everything else comes from DEFAULTS below.
 * Values are cached in memory for a short time so hot paths (auth, uploads)
 * don't hit the database on every request.
 *
 * Server-only: imports Prisma.
 */
import prisma from './prisma.js';

const CACHE_TTL_MS = 30 * 1000;

/**
 * Field definitions. `editable: false` fields are never accepted from the API
 * (they are either read from env vars or not built yet). `status` tells the UI
 * how to present the field:
 *   - 'active'      saved and enforced by the app
 *   - 'env'         read-only, comes from server configuration
 *   - 'coming_soon' shown disabled; nothing in the app uses it yet
 */
export const SETTINGS_SCHEMA = {
  system: {
    siteName: { type: 'string', default: 'HospitiumRIS', max: 80, status: 'active' },
    siteUrl: { type: 'string', status: 'env' },
    maintenanceMode: { type: 'boolean', default: false, status: 'active' },
    maintenanceMessage: {
      type: 'string',
      default: 'HospitiumRIS is undergoing scheduled maintenance. Please check back shortly.',
      max: 500,
      status: 'active',
    },
    allowRegistration: { type: 'boolean', default: true, status: 'active' },
    requireEmailVerification: { type: 'boolean', default: true, status: 'coming_soon' },
    sessionTimeout: { type: 'int', default: 30, min: 5, max: 1440, status: 'coming_soon' },
    maxLoginAttempts: { type: 'int', default: 5, min: 1, max: 50, status: 'coming_soon' },
    lockoutDuration: { type: 'int', default: 15, min: 1, max: 1440, status: 'coming_soon' },
  },
  email: {
    smtpHost: { type: 'string', status: 'env' },
    smtpPort: { type: 'string', status: 'env' },
    smtpUser: { type: 'string', status: 'env' },
    smtpSecure: { type: 'boolean', status: 'env' },
    smtpConfigured: { type: 'boolean', status: 'env' },
    fromName: { type: 'string', default: 'HospitiumRIS', max: 80, status: 'active' },
    fromEmail: { type: 'email', default: '', max: 200, status: 'active' },
  },
  security: {
    passwordMinLength: { type: 'int', default: 8, min: 8, max: 64, status: 'active' },
    passwordRequireUppercase: { type: 'boolean', default: true, status: 'active' },
    passwordRequireLowercase: { type: 'boolean', default: true, status: 'active' },
    passwordRequireNumbers: { type: 'boolean', default: true, status: 'active' },
    passwordRequireSpecialChars: { type: 'boolean', default: true, status: 'active' },
    twoFactorEnabled: { type: 'boolean', default: false, status: 'coming_soon' },
    ipWhitelist: { type: 'stringArray', default: [], status: 'coming_soon' },
    rateLimitEnabled: { type: 'boolean', default: true, status: 'coming_soon' },
    rateLimitRequests: { type: 'int', default: 100, min: 1, max: 100000, status: 'coming_soon' },
    rateLimitWindow: { type: 'int', default: 15, min: 1, max: 1440, status: 'coming_soon' },
  },
  notifications: {
    emailNotifications: { type: 'boolean', default: true, status: 'coming_soon' },
    systemAlerts: { type: 'boolean', default: true, status: 'coming_soon' },
    securityAlerts: { type: 'boolean', default: true, status: 'coming_soon' },
    maintenanceAlerts: { type: 'boolean', default: true, status: 'coming_soon' },
    digestFrequency: { type: 'enum', values: ['daily', 'weekly', 'never'], default: 'daily', status: 'coming_soon' },
  },
  storage: {
    storageProvider: { type: 'string', status: 'env' },
    maxFileSize: { type: 'int', default: 50, min: 1, max: 50, status: 'active' },
    allowedFileTypes: { type: 'stringArray', default: [], status: 'coming_soon' },
    storageQuota: { type: 'int', default: 1000, min: 1, max: 1000000, status: 'coming_soon' },
  },
  api: {
    apiEnabled: { type: 'boolean', default: true, status: 'coming_soon' },
    apiRateLimit: { type: 'int', default: 1000, min: 1, max: 1000000, status: 'coming_soon' },
    apiRateLimitWindow: { type: 'int', default: 60, min: 1, max: 1440, status: 'coming_soon' },
    webhooksEnabled: { type: 'boolean', default: false, status: 'coming_soon' },
    corsEnabled: { type: 'boolean', default: true, status: 'coming_soon' },
    allowedOrigins: { type: 'stringArray', default: [], status: 'coming_soon' },
  },
};

export const SETTINGS_SECTIONS = Object.keys(SETTINGS_SCHEMA);

/** Values that come from server configuration rather than the database. */
function envValues() {
  return {
    system: {
      siteUrl: process.env.NEXT_PUBLIC_APP_URL || process.env.NEXTAUTH_URL || '',
    },
    email: {
      smtpHost: process.env.SMTP_HOST || '',
      smtpPort: process.env.SMTP_PORT || '',
      smtpUser: process.env.SMTP_USER || '',
      smtpSecure: process.env.SMTP_SECURE === 'true',
      smtpConfigured: Boolean(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS),
    },
    storage: {
      storageProvider: process.env.STORAGE_DRIVER || 'local',
    },
  };
}

function defaultsFor(section) {
  const out = {};
  for (const [field, def] of Object.entries(SETTINGS_SCHEMA[section])) {
    if (def.status !== 'env') out[field] = Array.isArray(def.default) ? [...def.default] : def.default;
  }
  return out;
}

let cache = null; // { at: number, values: { [section]: object } }

async function loadStored() {
  const rows = await prisma.systemSetting.findMany();
  const stored = {};
  for (const row of rows) {
    if (SETTINGS_SCHEMA[row.key] && row.value && typeof row.value === 'object') stored[row.key] = row.value;
  }
  return stored;
}

/**
 * All settings, merged: defaults < stored values < env values.
 * Fails open to defaults if the table can't be read (e.g. migration not yet
 * applied), so a settings problem never takes the whole site down.
 */
export async function getAllSettings({ fresh = false } = {}) {
  if (!fresh && cache && Date.now() - cache.at < CACHE_TTL_MS) return cache.values;

  let stored = {};
  try {
    stored = await loadStored();
  } catch (error) {
    console.error('Could not read system settings, using defaults:', error.message);
  }

  const env = envValues();
  const values = {};
  for (const section of SETTINGS_SECTIONS) {
    const defaults = defaultsFor(section);
    const saved = {};
    // Only keep stored fields that still exist and are editable.
    for (const [field, value] of Object.entries(stored[section] || {})) {
      const def = SETTINGS_SCHEMA[section][field];
      if (def && def.status !== 'env') saved[field] = value;
    }
    values[section] = { ...defaults, ...saved, ...(env[section] || {}) };
  }

  cache = { at: Date.now(), values };
  return values;
}

export async function getSettingsSection(section) {
  const all = await getAllSettings();
  return all[section];
}

export function clearSettingsCache() {
  cache = null;
}

/** Field metadata for the UI: { section: { field: status } } */
export function getSettingsMeta() {
  const meta = {};
  for (const [section, fields] of Object.entries(SETTINGS_SCHEMA)) {
    meta[section] = {};
    for (const [field, def] of Object.entries(fields)) {
      meta[section][field] = {
        status: def.status,
        ...(def.min != null ? { min: def.min } : {}),
        ...(def.max != null && def.type === 'int' ? { max: def.max } : {}),
      };
    }
  }
  return meta;
}

function coerce(def, value) {
  switch (def.type) {
    case 'boolean':
      if (typeof value !== 'boolean') throw new Error('must be true or false');
      return value;
    case 'int': {
      const n = typeof value === 'string' && value.trim() !== '' ? Number(value) : value;
      if (!Number.isInteger(n)) throw new Error('must be a whole number');
      if (def.min != null && n < def.min) throw new Error(`must be at least ${def.min}`);
      if (def.max != null && n > def.max) throw new Error(`must be at most ${def.max}`);
      return n;
    }
    case 'string': {
      if (typeof value !== 'string') throw new Error('must be text');
      const s = value.trim();
      if (def.max && s.length > def.max) throw new Error(`must be ${def.max} characters or fewer`);
      return s;
    }
    case 'email': {
      if (typeof value !== 'string') throw new Error('must be text');
      const s = value.trim();
      if (s && !/^[^\s@<>]+@[^\s@<>]+\.[^\s@<>]+$/.test(s)) throw new Error('must be a valid email address');
      if (def.max && s.length > def.max) throw new Error(`must be ${def.max} characters or fewer`);
      return s;
    }
    case 'enum':
      if (!def.values.includes(value)) throw new Error(`must be one of ${def.values.join(', ')}`);
      return value;
    case 'stringArray':
      if (!Array.isArray(value) || value.some((v) => typeof v !== 'string')) throw new Error('must be a list of text values');
      return value.map((v) => v.trim()).filter(Boolean);
    default:
      throw new Error('unsupported field');
  }
}

/**
 * Validate and save one section. Only fields marked 'active' are accepted;
 * read-only and not-yet-built fields in the payload are ignored, not errors,
 * so the UI can send the whole form back.
 *
 * @returns {{ values: object, changed: string[] }} merged section after save
 * @throws {SettingsValidationError} with `fieldErrors` when input is invalid
 */
export async function saveSettingsSection(section, input, { userId = null } = {}) {
  const schema = SETTINGS_SCHEMA[section];
  if (!schema) throw new SettingsValidationError(`Unknown settings section "${section}"`);
  if (!input || typeof input !== 'object' || Array.isArray(input)) {
    throw new SettingsValidationError('Settings must be an object');
  }

  const fieldErrors = {};
  const accepted = {};
  for (const [field, value] of Object.entries(input)) {
    const def = schema[field];
    if (!def || def.status !== 'active') continue;
    try {
      accepted[field] = coerce(def, value);
    } catch (error) {
      fieldErrors[field] = error.message;
    }
  }
  if (Object.keys(fieldErrors).length) {
    throw new SettingsValidationError('Some settings are invalid', fieldErrors);
  }

  const current = await getAllSettings({ fresh: true });
  const changed = Object.keys(accepted).filter(
    (field) => JSON.stringify(current[section][field]) !== JSON.stringify(accepted[field])
  );

  const existing = await prisma.systemSetting.findUnique({ where: { key: section } });
  const nextValue = { ...((existing?.value && typeof existing.value === 'object') ? existing.value : {}), ...accepted };

  await prisma.systemSetting.upsert({
    where: { key: section },
    create: { key: section, value: nextValue, updatedById: userId },
    update: { value: nextValue, updatedById: userId },
  });

  clearSettingsCache();
  const all = await getAllSettings({ fresh: true });
  return { values: all[section], changed };
}

export class SettingsValidationError extends Error {
  constructor(message, fieldErrors = {}) {
    super(message);
    this.name = 'SettingsValidationError';
    this.fieldErrors = fieldErrors;
  }
}

/* ---------- Helpers used across the app ---------- */

export async function getPasswordPolicy() {
  const s = await getSettingsSection('security');
  return {
    minLength: s.passwordMinLength,
    requireUppercase: s.passwordRequireUppercase,
    requireLowercase: s.passwordRequireLowercase,
    requireNumbers: s.passwordRequireNumbers,
    requireSpecialChars: s.passwordRequireSpecialChars,
  };
}

export async function isMaintenanceMode() {
  const s = await getSettingsSection('system');
  return Boolean(s.maintenanceMode);
}

/** True when maintenance mode is on and this user is not a global admin. */
export async function isBlockedByMaintenance(user) {
  if (user?.accountType === 'GLOBAL_ADMIN') return false;
  return isMaintenanceMode();
}

export async function isRegistrationOpen() {
  const s = await getSettingsSection('system');
  return Boolean(s.allowRegistration);
}

/** Platform-wide upload cap in bytes (applied on top of per-module limits). */
export async function getUploadCapBytes() {
  const s = await getSettingsSection('storage');
  return s.maxFileSize * 1024 * 1024;
}

/** "Name <email>" for outgoing mail. Saved settings win; env FROM_EMAIL is the fallback. */
export async function getEmailFromAddress() {
  const fallback = process.env.FROM_EMAIL || 'HospitiumRIS <noreply@hospitiumris.com>';
  try {
    const s = await getSettingsSection('email');
    if (!s.fromEmail) return fallback;
    const name = (s.fromName || 'HospitiumRIS').replace(/["<>]/g, '');
    return `"${name}" <${s.fromEmail}>`;
  } catch {
    return fallback;
  }
}

/** Settings anyone (including signed-out visitors) may read. */
export async function getPublicSettings() {
  const [system, policy] = await Promise.all([getSettingsSection('system'), getPasswordPolicy()]);
  return {
    siteName: system.siteName,
    maintenanceMode: Boolean(system.maintenanceMode),
    maintenanceMessage: system.maintenanceMessage,
    allowRegistration: Boolean(system.allowRegistration),
    passwordPolicy: policy,
  };
}
