const fs = require('fs');
const path = require('path');

const translations = require('./locale-auth-translations.json');
const localesDir = path.join(__dirname, '..', 'public', 'locales');

for (const [code, data] of Object.entries(translations)) {
  const filePath = path.join(localesDir, `${code}.json`);
  const locale = JSON.parse(fs.readFileSync(filePath, 'utf8'));

  locale.auth = { ...locale.auth, ...data.auth };

  if (!locale.common) locale.common = {};
  Object.assign(locale.common, data.common_register);

  locale.register_success = { ...locale.register_success, ...data.register_success };

  fs.writeFileSync(filePath, JSON.stringify(locale, null, 2) + '\n', 'utf8');
  console.log(`Updated ${code}.json`);
}

// Fix sw common register keys if still English
const swPath = path.join(localesDir, 'sw.json');
const sw = JSON.parse(fs.readFileSync(swPath, 'utf8'));
Object.assign(sw.common, {
  reg_create_password: 'Unda Nywila',
  reg_confirm_password: 'Thibitisha Nywila',
  reg_password: 'Nywila',
  researcher: 'Mtafiti',
});
fs.writeFileSync(swPath, JSON.stringify(sw, null, 2) + '\n', 'utf8');
console.log('Updated sw.json common register keys');

// Add common.researcher to en if missing
const enPath = path.join(localesDir, 'en.json');
const en = JSON.parse(fs.readFileSync(enPath, 'utf8'));
if (!en.common.researcher) {
  en.common.researcher = 'Researcher';
  fs.writeFileSync(enPath, JSON.stringify(en, null, 2) + '\n', 'utf8');
  console.log('Added en.common.researcher');
}

console.log('Done');
