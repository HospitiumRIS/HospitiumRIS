const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const en = JSON.parse(fs.readFileSync(path.join(root, 'public/locales/en.json'), 'utf8'));
const sw = JSON.parse(fs.readFileSync(path.join(root, 'public/locales/sw.json'), 'utf8'));
const ethicsEn = JSON.parse(fs.readFileSync(path.join(__dirname, 'ethics-form-locale-en.json'), 'utf8'));

en.ethics_form = ethicsEn;

const swEthicsPath = path.join(__dirname, 'ethics-form-locale-sw.json');
if (fs.existsSync(swEthicsPath)) {
  sw.ethics_form = JSON.parse(fs.readFileSync(swEthicsPath, 'utf8'));
} else {
  // Fallback: copy English keys with Swahili prefix for missing dedicated file
  sw.ethics_form = { ...ethicsEn };
}

Object.assign(en.foundation_import, {
  drag_drop_title: 'Drag & drop your CSV file here',
  drag_drop_subtitle: 'or click to browse your files',
  succeeded: 'Succeeded',
  donations_processed: 'Donations processed',
  campaigns_processed: 'Campaigns processed',
  failed_rows_title: 'Failed Rows:',
  valid_row: 'Valid row',
  rows_skip_warning:
    '{{errorCount}} row(s) with errors will be skipped. Only {{validCount}} valid records will be imported.',
  importing_wait: 'Importing records — please wait…',
  parse_failed: 'Failed to parse file: {{message}}',
  status: 'Status',
});

Object.assign(sw.foundation_import, {
  drag_drop_title: 'Buruta na uangushe faili yako ya CSV hapa',
  drag_drop_subtitle: 'au bofya kuvinjari faili zako',
  succeeded: 'Imefanikiwa',
  donations_processed: 'Michango imechakatwa',
  campaigns_processed: 'Kampeni zimechakatwa',
  failed_rows_title: 'Safu Zilizoshindwa:',
  valid_row: 'Safu halali',
  rows_skip_warning:
    'Safu {{errorCount}} zenye makosa zitarukwa. Rekodi {{validCount}} halali tu zitaingizwa.',
  importing_wait: 'Inaingiza rekodi — tafadhali subiri…',
  parse_failed: 'Imeshindwa kuchanganua faili: {{message}}',
  status: 'Hali',
});

fs.writeFileSync(path.join(root, 'public/locales/en.json'), `${JSON.stringify(en, null, 2)}\n`);
fs.writeFileSync(path.join(root, 'public/locales/sw.json'), `${JSON.stringify(sw, null, 2)}\n`);
console.log('Locale files updated');
