#!/usr/bin/env node
/**
 * Render every training email (#97) to HTML files for a quick visual check.
 *   npm run preview:training-emails            -> writes to tmp/training-emails/
 *   node scripts/preview-training-emails.mjs <out-dir>
 * Uses sample data only; sends nothing.
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { TRAINING_EMAIL_KINDS, buildTrainingEmail } from '../src/lib/training-email.js';

const outDir = path.resolve(process.argv[2] || 'tmp/training-emails');
mkdirSync(outDir, { recursive: true });

const sample = {
  baseUrl: process.env.NEXT_PUBLIC_APP_URL || 'https://hospitium.hospitiumris.org',
  recipient: { givenName: 'Jane', familyName: 'Achieng', email: 'jane@example.org' },
  training: { id: 'sample', title: 'Good Clinical Practice refresher', startDate: '2026-12-01T06:00:00Z', endDate: '2026-12-03T14:00:00Z', venue: 'Main hall, Block B' },
  session: { title: 'Day 1: Consent and documentation', startsAt: '2026-12-01T06:00:00Z', endsAt: '2026-12-01T14:00:00Z', venue: 'Main hall, Block B' },
  reminder: '24h',
  waitlistPosition: 3,
  dueDate: '2026-12-20T00:00:00Z',
  reason: 'The facilitator is unavailable.',
  certificate: { number: 'HRIS-2026-000123', verifyUrl: 'https://hospitium.hospitiumris.org/verify/certificate/sample' },
  checks: [{ label: 'Attend at least 80% of sessions', met: false }, { label: 'Complete all required modules', met: true }],
};

const links = [];
for (const kind of TRAINING_EMAIL_KINDS) {
  const email = buildTrainingEmail(kind, sample);
  const file = `${kind.toLowerCase()}.html`;
  writeFileSync(path.join(outDir, file), email.html);
  links.push(`<li><a href="${file}">${kind}</a> — ${email.subject.replace(/&/g, '&amp;').replace(/</g, '&lt;')}</li>`);
}
writeFileSync(path.join(outDir, 'index.html'), `<!DOCTYPE html><meta charset="utf-8"><title>Training emails</title><h1>Training emails</h1><ul>${links.join('')}</ul>`);
console.log(`Wrote ${TRAINING_EMAIL_KINDS.length} emails to ${outDir}/index.html`);
