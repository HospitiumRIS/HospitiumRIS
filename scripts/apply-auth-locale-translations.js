'use strict';

const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const BUNDLE_DIR = path.join(__dirname, 'locale-auth-bundles');
const LOCALES_DIR = path.join(ROOT, 'public/locales');
const DATA_PATH = path.join(__dirname, 'locale-auth-translations-data.js');

const translations = require(DATA_PATH);
const localeCodes = Object.keys(translations.default || translations);

const EN_COMMON_REGISTER = {
  researcher: 'Researcher',
  foundation_admin: 'Foundation Administrator',
  reg_create_password: 'Create Password',
  reg_confirm_password: 'Confirm Password',
  reg_password: 'Password',
};

const SW_COMMON_REGISTER = {
  researcher: 'Mtafiti',
  foundation_admin: 'Msimamizi wa Mfuko',
  reg_create_password: 'Unda Nenosiri',
  reg_confirm_password: 'Thibitisha Nenosiri',
  reg_password: 'Nenosiri',
};

for (const [code, commonRegister] of [
  ['en', EN_COMMON_REGISTER],
  ['sw', SW_COMMON_REGISTER],
]) {
  const localePath = path.join(LOCALES_DIR, `${code}.json`);
  if (!fs.existsSync(localePath)) continue;
  const locale = JSON.parse(fs.readFileSync(localePath, 'utf8'));
  locale.common = locale.common || {};
  Object.assign(locale.common, commonRegister);
  fs.writeFileSync(localePath, `${JSON.stringify(locale, null, 2)}\n`, 'utf8');
  console.log(`Updated public/locales/${code}.json (common register keys)`);
}

for (const code of localeCodes) {
  const localePath = path.join(LOCALES_DIR, `${code}.json`);
  if (!fs.existsSync(localePath)) {
    console.warn(`Skipping ${code}: no public/locales/${code}.json`);
    continue;
  }

  const locale = JSON.parse(fs.readFileSync(localePath, 'utf8'));
  const bundle = translations[code] || translations.default?.[code];

  locale.auth = bundle.auth;
  locale.common = locale.common || {};
  Object.assign(locale.common, bundle.common_register);
  locale.register_success = bundle.register_success;

  fs.writeFileSync(localePath, `${JSON.stringify(locale, null, 2)}\n`, 'utf8');
  console.log(`Updated public/locales/${code}.json`);
}

console.log(`Done. Applied auth translations to ${localeCodes.length} locales.`);
