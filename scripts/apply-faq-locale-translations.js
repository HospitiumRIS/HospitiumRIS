'use strict';

const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const BUNDLE_DIR = path.join(__dirname, 'locale-faq-bundles');
const LOCALES_DIR = path.join(ROOT, 'public/locales');
const EN_PATH = path.join(LOCALES_DIR, 'en.json');

const en = JSON.parse(fs.readFileSync(EN_PATH, 'utf8'));
const faqKeys = Object.keys(en.faq);

function validateBundle(code, bundle) {
  const missing = faqKeys.filter((key) => !(key in bundle));
  if (missing.length) {
    throw new Error(`${code}: missing faq keys: ${missing.join(', ')}`);
  }
  for (const key of faqKeys) {
    const value = bundle[key];
    if (key.endsWith('_bullets')) {
      if (!Array.isArray(value) || value.length === 0) {
        throw new Error(`${code}: ${key} must be a non-empty array`);
      }
    } else if (typeof value !== 'string' || value.trim() === '') {
      throw new Error(`${code}: ${key} must be a non-empty string`);
    }
  }
}

const bundleFiles = fs.readdirSync(BUNDLE_DIR).filter((f) => f.endsWith('.json'));

for (const file of bundleFiles) {
  const code = path.basename(file, '.json');
  const localePath = path.join(LOCALES_DIR, `${code}.json`);
  if (!fs.existsSync(localePath)) {
    console.warn(`Skipping ${code}: no public/locales/${code}.json`);
    continue;
  }

  const bundle = JSON.parse(fs.readFileSync(path.join(BUNDLE_DIR, file), 'utf8'));
  validateBundle(code, bundle);

  const locale = JSON.parse(fs.readFileSync(localePath, 'utf8'));
  locale.faq = bundle;
  fs.writeFileSync(localePath, `${JSON.stringify(locale, null, 2)}\n`, 'utf8');
  console.log(`Updated public/locales/${code}.json (faq)`);
}

console.log(`Done. Applied FAQ translations for ${bundleFiles.length} locale(s).`);
