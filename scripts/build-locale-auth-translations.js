'use strict';

const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const EN_PATH = path.join(ROOT, 'public/locales/en.json');
const OUTPUT_PATH = path.join(__dirname, 'locale-auth-translations.json');
const DATA_PATH = path.join(__dirname, 'locale-auth-translations-data.js');

const EXPECTED_LOCALES = [
  'ar', 'de', 'es', 'fil', 'fr', 'hi', 'id', 'km', 'ko', 'lo', 'ms', 'my', 'pt', 'tet', 'th', 'vi', 'zh',
];

const COMMON_REGISTER_KEYS = [
  'reg_create_password',
  'reg_confirm_password',
  'reg_password',
  'foundation_admin',
  'researcher',
];

const REGISTER_SUCCESS_KEYS = ['title', 'subtitle', 'check_email', 'resend', 'login'];

function fail(message) {
  console.error(`ERROR: ${message}`);
  process.exit(1);
}

const en = JSON.parse(fs.readFileSync(EN_PATH, 'utf8'));
const authKeys = Object.keys(en.auth);
const authKeyCount = authKeys.length;

if (authKeyCount !== 126) {
  fail(`Expected 126 auth keys in en.json, found ${authKeyCount}`);
}

let translations;
try {
  translations = require(DATA_PATH);
} catch (err) {
  fail(`Failed to load data module: ${err.message}`);
}

const defaultExport = translations.default || translations;
const localeCodes = Object.keys(defaultExport).filter((code) => code !== 'default');

for (const code of EXPECTED_LOCALES) {
  if (!localeCodes.includes(code)) {
    fail(`Missing locale: ${code}`);
  }
}

for (const code of localeCodes) {
  if (!EXPECTED_LOCALES.includes(code)) {
    fail(`Unexpected locale in data module: ${code}`);
  }
}

const issues = [];

for (const code of EXPECTED_LOCALES) {
  const locale = defaultExport[code];

  if (!locale || typeof locale !== 'object') {
    issues.push(`${code}: locale entry is missing or not an object`);
    continue;
  }

  if (!locale.auth || typeof locale.auth !== 'object') {
    issues.push(`${code}: missing auth object`);
    continue;
  }

  const localeAuthKeys = Object.keys(locale.auth);
  if (localeAuthKeys.length !== authKeyCount) {
    issues.push(`${code}: auth has ${localeAuthKeys.length} keys, expected ${authKeyCount}`);
  }

  for (const key of authKeys) {
    if (!(key in locale.auth)) {
      issues.push(`${code}: missing auth key "${key}"`);
    } else if (typeof locale.auth[key] !== 'string' || locale.auth[key].trim() === '') {
      issues.push(`${code}: auth key "${key}" must be a non-empty string`);
    }
  }

  for (const key of authKeys) {
    if (localeAuthKeys.includes(key) && !authKeys.includes(key)) {
      issues.push(`${code}: unexpected auth key "${key}"`);
    }
  }

  if (!locale.common_register || typeof locale.common_register !== 'object') {
    issues.push(`${code}: missing common_register object`);
  } else {
    for (const key of COMMON_REGISTER_KEYS) {
      if (!(key in locale.common_register)) {
        issues.push(`${code}: missing common_register key "${key}"`);
      } else if (
        typeof locale.common_register[key] !== 'string' ||
        locale.common_register[key].trim() === ''
      ) {
        issues.push(`${code}: common_register key "${key}" must be a non-empty string`);
      }
    }
  }

  if (!locale.register_success || typeof locale.register_success !== 'object') {
    issues.push(`${code}: missing register_success object`);
  } else {
    for (const key of REGISTER_SUCCESS_KEYS) {
      if (!(key in locale.register_success)) {
        issues.push(`${code}: missing register_success key "${key}"`);
      } else if (
        typeof locale.register_success[key] !== 'string' ||
        locale.register_success[key].trim() === ''
      ) {
        issues.push(`${code}: register_success key "${key}" must be a non-empty string`);
      }
    }
  }
}

if (issues.length > 0) {
  console.error('Validation issues found:');
  for (const issue of issues) {
    console.error(`  - ${issue}`);
  }
  process.exit(1);
}

const json = JSON.stringify(defaultExport, null, 2);
fs.writeFileSync(OUTPUT_PATH, `${json}\n`, 'utf8');

let parsed;
try {
  parsed = JSON.parse(fs.readFileSync(OUTPUT_PATH, 'utf8'));
} catch (err) {
  fail(`Output JSON is not parseable: ${err.message}`);
}

console.log('SUCCESS: locale-auth-translations.json created');
console.log(`Output: ${OUTPUT_PATH}`);
console.log(`Auth keys per locale: ${authKeyCount}`);
console.log(`Common register keys per locale: ${COMMON_REGISTER_KEYS.length}`);
console.log(`Register success keys per locale: ${REGISTER_SUCCESS_KEYS.length}`);
console.log(`Locales: ${EXPECTED_LOCALES.length}`);

for (const code of EXPECTED_LOCALES) {
  const locale = parsed[code];
  console.log(
    `  ${code}: auth=${Object.keys(locale.auth).length}, common_register=${Object.keys(locale.common_register).length}, register_success=${Object.keys(locale.register_success).length}`,
  );
}
