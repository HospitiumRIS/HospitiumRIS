import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  baseName,
  isCandidateZipEntry,
  parseMappingCsv,
  planBulkUpload,
  sniffMatchesExtension,
} from '../src/lib/certificate-bulk-match.js';

const participants = [
  { registrationId: 'r1', email: 'jane.achieng@a.ac.ke', givenName: 'Jane', familyName: 'Achieng', status: 'COMPLETED', hasCertificate: false },
  { registrationId: 'r2', email: 'paul@a.ac.ke', givenName: 'Paul', familyName: 'Otieno', status: 'COMPLETED', hasCertificate: true },
  { registrationId: 'r3', email: 'mary@a.ac.ke', givenName: 'Mary', familyName: 'Wanjiku', status: 'REGISTERED', hasCertificate: false },
  { registrationId: 'r4', email: 'john.k@a.ac.ke', givenName: 'John', familyName: 'Kamau', status: 'COMPLETED', hasCertificate: false },
  { registrationId: 'r5', email: 'john.m@a.ac.ke', givenName: 'John', familyName: 'Kamau', status: 'COMPLETED', hasCertificate: false },
  { registrationId: 'r6', email: 'zoe@a.ac.ke', givenName: 'Zoë', familyName: 'Nyambura', status: 'COMPLETED', hasCertificate: false },
];
const f = (name, size = 1000) => ({ name, size });

describe('planBulkUpload', () => {
  it('matches by email, by full name (any order, accents ignored) and flags replacements', () => {
    const { rows } = planBulkUpload([
      f('certs/jane.achieng@a.ac.ke.pdf'),
      f('Otieno_Paul_GCP_2026.pdf'),
      f('zoe-nyambura.jpg'),
    ], participants);
    assert.deepEqual(rows.map((r) => [r.result, r.registrationId, r.how]), [
      ['matched', 'r1', 'email'],
      ['matched', 'r2', 'name'],
      ['matched', 'r6', 'name'],
    ]);
    assert.equal(rows[0].name, 'jane.achieng@a.ac.ke.pdf');
    assert.equal(rows[1].replaces, true);
  });

  it('uses the mapping file first, and email-like "_at_" names', () => {
    const { rows } = planBulkUpload([f('scan001.pdf'), f('john.k_at_a.ac.ke.pdf')], participants, {
      mappingCsv: 'file,email\nscan001.pdf,PAUL@a.ac.ke\n',
    });
    assert.deepEqual(rows.map((r) => [r.result, r.registrationId, r.how]), [['matched', 'r2', 'mapping'], ['matched', 'r4', 'email']]);
  });

  it('reports ambiguous, unmatched, not completed, duplicate and invalid files', () => {
    const { rows, counts } = planBulkUpload([
      f('John Kamau.pdf'),
      f('random.pdf'),
      f('mary_wanjiku.pdf'),
      f('jane achieng.pdf'),
      f('jane.achieng@a.ac.ke.pdf'),
      f('notes.docx'),
      f('huge.pdf', 6 * 1024 * 1024),
      f('empty.pdf', 0),
    ], participants);
    assert.deepEqual(rows.map((r) => r.result), ['ambiguous', 'unmatched', 'not_completed', 'matched', 'duplicate', 'invalid', 'invalid', 'invalid']);
    assert.deepEqual(rows[0].candidates.sort(), ['r4', 'r5']);
    assert.match(rows[4].reason, /jane achieng\.pdf/);
    assert.deepEqual(counts, { ambiguous: 1, unmatched: 1, not_completed: 1, matched: 1, duplicate: 1, invalid: 3 });
  });

  it('enforces the file count and requires files', () => {
    assert.equal(planBulkUpload([], participants).ok, false);
    assert.equal(planBulkUpload(Array.from({ length: 201 }, (_, i) => f(`${i}.pdf`)), participants).ok, false);
  });
});

describe('helpers', () => {
  it('strips folders and traversal from names', () => {
    assert.equal(baseName('../../etc/passwd'), 'passwd');
    assert.equal(baseName('a\\b\\c.pdf'), 'c.pdf');
  });

  it('skips folders and OS clutter in ZIPs', () => {
    assert.equal(isCandidateZipEntry('certs/'), false);
    assert.equal(isCandidateZipEntry('__MACOSX/certs/._a.pdf'), false);
    assert.equal(isCandidateZipEntry('certs/.DS_Store'), false);
    assert.equal(isCandidateZipEntry('certs/a.pdf'), true);
  });

  it('parses mapping CSVs with or without a header', () => {
    const m = parseMappingCsv('"file","email"\r\n"A.pdf","X@Y.org"\nB.pdf;z@y.org\nbad line');
    assert.deepEqual([...m.entries()], [['a.pdf', 'x@y.org'], ['b.pdf', 'z@y.org']]);
  });

  it('checks content against the extension', () => {
    assert.equal(sniffMatchesExtension(new TextEncoder().encode('%PDF-1.7'), 'a.pdf'), true);
    assert.equal(sniffMatchesExtension(new TextEncoder().encode('<html>'), 'a.pdf'), false);
    assert.equal(sniffMatchesExtension(new Uint8Array([0x89, 0x50, 0x4e, 0x47]), 'a.png'), true);
    assert.equal(sniffMatchesExtension(new Uint8Array([0xff, 0xd8, 0xff, 0xe0]), 'a.JPG'), true);
    assert.equal(sniffMatchesExtension(new Uint8Array([0xff, 0xd8, 0xff]), 'a.exe'), false);
  });
});
