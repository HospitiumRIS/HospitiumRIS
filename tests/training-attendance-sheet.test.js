import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  SHEET_COLUMNS,
  buildAttendanceRows,
  parseStatusCell,
  planSheetImport,
} from '../src/lib/training-attendance-sheet.js';

const matrix = {
  sessions: [
    { id: 's1', title: 'Day 1', startsAt: '2026-12-01T06:00:00Z', status: 'SCHEDULED' },
    { id: 's2', title: 'Day 2', startsAt: '2026-12-02T06:00:00Z', status: 'SCHEDULED' },
    { id: 's3', title: 'Cancelled', startsAt: '2026-12-03T06:00:00Z', status: 'CANCELLED' },
  ],
  participants: [
    { registrationId: 'r1', user: { givenName: 'Jane', familyName: 'Achieng', email: 'jane@a.ac.ke' } },
    { registrationId: 'r2', user: { givenName: 'Paul', familyName: 'Otieno', email: 'Paul@A.ac.ke' } },
  ],
  records: [
    { sessionId: 's1', registrationId: 'r1', status: 'PRESENT', method: 'QR', checkedInAt: '2026-12-01T05:58:00Z', note: null },
    { sessionId: 's1', registrationId: 'r2', status: 'EXCUSED', method: 'MANUAL', note: 'Clinic duty' },
  ],
};

describe('parseStatusCell', () => {
  it('accepts labels, enums and short forms; blank means no change', () => {
    assert.equal(parseStatusCell('Present'), 'PRESENT');
    assert.equal(parseStatusCell('LATE'), 'LATE');
    assert.equal(parseStatusCell(' a '), 'ABSENT');
    assert.equal(parseStatusCell('Excused'), 'EXCUSED');
    assert.equal(parseStatusCell(''), null);
    assert.equal(parseStatusCell('maybe'), undefined);
  });
});

describe('buildAttendanceRows', () => {
  it('gives one row per participant per scheduled session, in local time', () => {
    const rows = buildAttendanceRows(matrix, { timeZone: 'Africa/Nairobi' });
    assert.equal(rows.length, 4);
    assert.deepEqual(Object.keys(rows[0]), SHEET_COLUMNS);
    assert.equal(rows[0].Date, '2026-12-01');
    assert.equal(rows[0].Start, '09:00');
    assert.equal(rows[0].Status, 'Present');
    assert.equal(rows[0]['Checked in'], '2026-12-01 08:58');
    assert.equal(rows[1].Note, 'Clinic duty');
    assert.equal(rows[2].Status, '');
    assert.equal(buildAttendanceRows(matrix, { sessionId: 's2' }).length, 2);
  });
});

describe('planSheetImport', () => {
  it('round-trips an export unchanged', () => {
    const rows = buildAttendanceRows(matrix, { timeZone: 'Africa/Nairobi' });
    const plan = planSheetImport(rows, matrix, { timeZone: 'Africa/Nairobi' });
    assert.equal(plan.ok, true);
    assert.equal(plan.counts.set, 0);
    assert.equal(plan.counts.same, 2);
    assert.equal(plan.counts.skip, 2);
    assert.equal(plan.counts.error, 0);
  });

  it('applies filled-in statuses, matching emails case-insensitively', () => {
    const rows = buildAttendanceRows(matrix, { timeZone: 'Africa/Nairobi' });
    rows[2].Status = 'p';
    rows[3].Status = 'Late';
    rows[3].Email = 'PAUL@a.ac.ke';
    rows[0].Status = 'Absent';
    const plan = planSheetImport(rows, matrix, { timeZone: 'Africa/Nairobi' });
    assert.equal(plan.counts.set, 3);
    assert.deepEqual(plan.changes.find((c) => c.registrationId === 'r2' && c.sessionId === 's2'), { sessionId: 's2', registrationId: 'r2', status: 'LATE', note: '' || null });
    assert.equal(plan.results[0].previous, 'PRESENT');
  });

  it('finds sessions by date and start time, or by a unique title, without the ID column', () => {
    const rows = [
      { Date: '2026-12-02', Start: '9:00', Email: 'jane@a.ac.ke', Status: 'Present' },
      { Session: 'day 1', Email: 'paul@a.ac.ke', Status: 'Absent' },
    ];
    const plan = planSheetImport(rows, matrix, { timeZone: 'Africa/Nairobi' });
    assert.equal(plan.counts.set, 2);
    assert.equal(plan.results[0].sessionId, 's2');
    assert.equal(plan.results[1].sessionId, 's1');
  });

  it('reports errors per row and refuses files without the key columns', () => {
    const plan = planSheetImport([
      { Email: 'ghost@a.ac.ke', Status: 'Present', 'Session ID': 's1' },
      { Email: 'jane@a.ac.ke', Status: 'Here', 'Session ID': 's1' },
      { Email: 'jane@a.ac.ke', Status: 'Present', 'Session ID': 's3' },
    ], matrix);
    assert.equal(plan.counts.error, 3);
    assert.match(plan.results[0].reason, /not an active participant/);
    assert.match(plan.results[1].reason, /Unknown status/);
    assert.match(plan.results[2].reason, /Session not found/);
    assert.equal(planSheetImport([{ Name: 'x' }], matrix).ok, false);
    assert.equal(planSheetImport([], matrix).ok, false);
  });
});

describe('buildSignInSheetPdf', () => {
  it('produces a multi-page PDF for a long list', async () => {
    const { buildSignInSheetPdf } = await import('../src/lib/training-signin-sheet.js');
    const participants = Array.from({ length: 40 }, (_, i) => ({ user: { givenName: `P${i}`, familyName: `Surname ${i}`, email: `p${i}@a.ac.ke` } }));
    const pdf = buildSignInSheetPdf({
      training: { title: 'GCP refresher' },
      session: { title: 'Day 1', startsAt: '2026-12-01T06:00:00Z', endsAt: '2026-12-01T14:00:00Z', venue: 'Main hall' },
      participants,
    });
    const text = pdf.toString('latin1');
    assert.equal(text.slice(0, 5), '%PDF-');
    assert.ok((text.match(/\/Type \/Page\b/g) || []).length >= 2);
  });
});
