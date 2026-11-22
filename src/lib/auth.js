import bcrypt from 'bcryptjs';

/**
 * Hash a password using bcrypt
 * @param {string} password - Plain text password
 * @returns {Promise<string>} - Hashed password
 */
export async function hashPassword(password) {
  const saltRounds = 12;
  return await bcrypt.hash(password, saltRounds);
}

/**
 * Verify a password against a hash
 * @param {string} password - Plain text password
 * @param {string} hashedPassword - Hashed password
 * @returns {Promise<boolean>} - True if password matches
 */
export async function verifyPassword(password, hashedPassword) {
  return await bcrypt.compare(password, hashedPassword);
}

/**
 * Validate email format
 * @param {string} email - Email to validate
 * @returns {boolean} - True if valid email format
 */
export function validateEmail(email) {
  const emailRegex = /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i;
  return emailRegex.test(email);
}

/** Built-in password rules, used when no saved policy is passed. */
export const DEFAULT_PASSWORD_POLICY = {
  minLength: 8,
  requireUppercase: true,
  requireLowercase: true,
  requireNumbers: true,
  requireSpecialChars: true,
};

/**
 * Validate password strength against a policy (see lib/system-settings
 * getPasswordPolicy for the admin-configured one).
 * @param {string} password - Password to validate
 * @param {object} [policy] - Password policy; defaults to DEFAULT_PASSWORD_POLICY
 * @returns {object} - Validation result with isValid, requirements and a message
 */
export function validatePassword(password, policy = DEFAULT_PASSWORD_POLICY) {
  const p = { ...DEFAULT_PASSWORD_POLICY, ...(policy || {}) };
  const value = String(password || '');
  const minLength = value.length >= Math.max(8, Number(p.minLength) || 8);
  const hasUpper = /[A-Z]/.test(value);
  const hasLower = /[a-z]/.test(value);
  const hasNumber = /\d/.test(value);
  const hasSpecial = /[^A-Za-z0-9]/.test(value);

  return {
    isValid:
      minLength &&
      (!p.requireUppercase || hasUpper) &&
      (!p.requireLowercase || hasLower) &&
      (!p.requireNumbers || hasNumber) &&
      (!p.requireSpecialChars || hasSpecial),
    requirements: {
      minLength,
      hasUpper,
      hasLower,
      hasNumber,
      hasSpecial,
    },
    message: describePasswordPolicy(p),
  };
}

/** Human-readable summary, e.g. "at least 10 characters, including an uppercase letter and a number". */
export function describePasswordPolicy(policy = DEFAULT_PASSWORD_POLICY) {
  const p = { ...DEFAULT_PASSWORD_POLICY, ...(policy || {}) };
  const parts = [];
  if (p.requireUppercase) parts.push('an uppercase letter');
  if (p.requireLowercase) parts.push('a lowercase letter');
  if (p.requireNumbers) parts.push('a number');
  if (p.requireSpecialChars) parts.push('a symbol');
  const base = `Password must be at least ${Math.max(8, Number(p.minLength) || 8)} characters`;
  if (!parts.length) return base;
  const list = parts.length === 1 ? parts[0] : `${parts.slice(0, -1).join(', ')} and ${parts[parts.length - 1]}`;
  return `${base}, including ${list}`;
}
