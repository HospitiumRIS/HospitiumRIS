import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  decodeReport,
  defaultMinMinutes,
  isJoinWindowOpen,
  parseAttendanceReport,
  parseDurationMinutes,
  parseReportDate,
  planVirtualImport,
  splitLine,
  statusForJoin,
} from '../src/lib/training-virtual-attendance.js';

const NAIROBI = -180; // Date#getTimezoneOffset convention

const session = {
  status: 'SCHEDULED',
  startsAt: '2026-12-01T06:00:00Z',
  endsAt: '2026-12-01T08:00:00Z',
  checkInOpensMinutesBefore: 15,
  lateAfterMinutes: 10,
};

const ZOOM = [
  'Meeting ID,Topic,Start Time,End Time,User Email,Duration (Minutes),Participants',
  '812 3456 7890,GCP refresher,12/01/2026 09:00:00 AM,12/01/2026 11:00:00 AM,host@a.ac.ke,121,3',
  '',
  'Name (Original Name),User Email,Join Time,Leave Time,Duration (Minutes),Guest,Recording Consent',
  'Jane Achieng,Jane@A.ac.ke,12/01/2026 08:58:00 AM,12/01/2026 10:00:00 AM,62,No,Y',
  'Jane Achieng,jane@a.ac.ke,12/01/2026 10:05:00 AM,12/01/2026 11:00:00 AM,55,No,Y',
  '"Otieno, Paul",paul@a.ac.ke,12/01/2026 09:20:00 AM,12/01/2026 11:00:00 AM,100,No,Y',
  'Guest Phone,,12/01/2026 09:00:00 AM,12/01/2026 09:30:00 AM,30,Yes,Y',
  'Brief Visitor,brief@a.ac.ke,12/01/2026 09:00:00 AM,12/01/2026 09:20:00 AM,20,No,Y',
].join('\n');

// Teams "Attendance report" export: tab-separated sections, durations like "1h 2m 3s".
const TEAMS = [
  '1. Summary',
  'Meeting title\tGCP refresher',
  'Attended participants\t2',
  '',
  '2. Participants',
  'Name\tFirst Join\tLast Leave\tIn-Meeting Duration\tEmail\tParticipant ID (UPN)\tRole',
  'Jane Achieng\t12/1/26, 8:58:00 AM\t12/1/26, 11:00:00 AM\t1h 57m 10s\tjane@a.ac.ke\tjane@a.ac.ke\tAttendee',
  'Mary Wanjiku\t12/1/26, 9:30:00 AM\t12/1/26, 9:45:00 AM\t15m 2s\tmary@a.ac.ke\tmary@a.ac.ke\tAttendee',
  '',
  '3. In-Meeting Activities',
  'Name\tJoin Time\tLeave Time\tDuration\tEmail\tRole',
  'Jane Achieng\t12/1/26, 8:58:00 AM\t12/1/26, 10:00:00 AM\t1h 2m\tjane@a.ac.ke\tAttendee',
].join('\n');

describe('join window', () => {
  it('is open from check-in opening until the session ends', () => {
    assert.equal(isJoinWindowOpen(session, new Date('2026-12-01T05:44:00Z')), false);
    assert.equal(isJoinWindowOpen(session, new Date('2026-12-01T05:45:00Z')), true);
    assert.equal(isJoinWindowOpen(session, new Date('2026-12-01T08:00:00Z')), true);
    assert.equal(isJoinWindowOpen(session, new Date('2026-12-01T08:00:01Z')), false);
    assert.equal(isJoinWindowOpen({ ...session, status: 'CANCELLED' }, new Date('2026-12-01T06:30:00Z')), false);
  });

  it('marks joins after the late threshold as LATE', () => {
    assert.equal(statusForJoin(session, '2026-12-01T06:10:00Z'), 'PRESENT');
    assert.equal(statusForJoin(session, '2026-12-01T06:10:01Z'), 'LATE');
  });
});

describe('parseReportDate', () => {
  it('reads Zoom, Teams and ISO wall-clock times in the given time zone', () => {
    assert.equal(parseReportDate('12/01/2026 09:05:00 AM', NAIROBI).toISOString(), '2026-12-01T06:05:00.000Z');
    assert.equal(parseReportDate('12/1/26, 1:05:00 PM', NAIROBI).toISOString(), '2026-12-01T10:05:00.000Z');
    assert.equal(parseReportDate('12/01/2026 12:30:00 AM', 0).toISOString(), '2026-12-01T00:30:00.000Z');
    assert.equal(parseReportDate('2026-12-01 09:05:00', NAIROBI).toISOString(), '2026-12-01T06:05:00.000Z');
    assert.equal(parseReportDate('2026-12-01T09:05:00+03:00').toISOString(), '2026-12-01T06:05:00.000Z');
    assert.equal(parseReportDate('yesterday'), null);
  });
});

describe('parsing helpers', () => {
  it('splits quoted CSV and parses durations', () => {
    assert.deepEqual(splitLine('"Otieno, Paul",paul@a.ac.ke,"say ""hi"""', ','), ['Otieno, Paul', 'paul@a.ac.ke', 'say "hi"']);
    assert.equal(parseDurationMinutes('62'), 62);
    assert.equal(parseDurationMinutes('1h 2m 30s'), 62.5);
    assert.equal(parseDurationMinutes('15m 2s').toFixed(2), '15.03');
    assert.equal(parseDurationMinutes('01:02:30'), 62.5);
    assert.equal(parseDurationMinutes('45 mins'), 45);
    assert.equal(parseDurationMinutes(''), null);
  });

  it('decodes UTF-16 Teams exports and strips BOMs', () => {
    const utf16 = new Uint8Array([0xff, 0xfe, ...[...'Name\tEmail'].flatMap((c) => [c.charCodeAt(0), 0])]);
    assert.equal(decodeReport(utf16), 'Name\tEmail');
    assert.equal(decodeReport(new TextEncoder().encode('﻿abc')), 'abc');
  });
});

describe('parseAttendanceReport', () => {
  it('reads a Zoom report below its meeting summary and merges rejoins', () => {
    const r = parseAttendanceReport(ZOOM, { offsetMinutes: NAIROBI });
    assert.equal(r.ok, true);
    assert.equal(r.source, 'zoom');
    const jane = r.rows.find((x) => x.email === 'jane@a.ac.ke');
    assert.equal(jane.minutes, 117);
    assert.equal(jane.segments, 2);
    assert.equal(r.rows.length, 3);
    assert.equal(r.skipped, 1); // guest without email
    assert.equal(jane.firstJoin.toISOString(), '2026-12-01T05:58:00.000Z');
    assert.equal(jane.lastLeave.toISOString(), '2026-12-01T08:00:00.000Z');
  });

  it('reads only the participants section of a Teams report', () => {
    const r = parseAttendanceReport(TEAMS, { offsetMinutes: NAIROBI });
    assert.equal(r.ok, true);
    assert.equal(r.source, 'teams');
    assert.deepEqual(r.rows.map((x) => x.email), ['jane@a.ac.ke', 'mary@a.ac.ke']);
    assert.equal(Math.round(r.rows[0].minutes), 117);
    assert.equal(r.rows[1].firstJoin.toISOString(), '2026-12-01T06:30:00.000Z');
  });

  it('fails clearly without a participant table', () => {
    assert.equal(parseAttendanceReport('a,b\n1,2').ok, false);
    assert.equal(parseAttendanceReport('').ok, false);
  });
});

describe('planVirtualImport', () => {
  const participants = [
    { registrationId: 'r1', email: 'jane@a.ac.ke', name: 'Jane', existingStatus: null },
    { registrationId: 'r2', email: 'paul@a.ac.ke', name: 'Paul', existingStatus: 'PRESENT' },
    { registrationId: 'r3', email: 'brief@a.ac.ke', name: 'Brief', existingStatus: 'ABSENT' },
    { registrationId: 'r4', email: 'nobody@a.ac.ke', name: 'Nobody', existingStatus: null },
  ];

  it('applies the minutes threshold, keeps existing marks unless overwriting, lists gaps', () => {
    const { rows } = parseAttendanceReport(ZOOM, { offsetMinutes: NAIROBI });
    const minMinutes = defaultMinMinutes(session);
    assert.equal(minMinutes, 60);
    const plan = planVirtualImport(rows, participants, session, { minMinutes });
    const byId = Object.fromEntries(plan.matched.map((m) => [m.registrationId, m]));
    assert.equal(byId.r1.status, 'PRESENT');
    assert.equal(byId.r1.action, 'set');
    assert.equal(byId.r2.status, 'LATE');
    assert.equal(byId.r2.action, 'keep');
    assert.equal(byId.r3.status, 'ABSENT');
    assert.equal(byId.r3.action, 'same');
    assert.deepEqual(plan.notInReport.map((p) => p.registrationId), ['r4']);
    assert.equal(plan.unmatched.length, 0);

    const overwrite = planVirtualImport(rows, participants, session, { minMinutes, overwrite: true });
    assert.equal(overwrite.matched.find((m) => m.registrationId === 'r2').action, 'set');
  });
});
