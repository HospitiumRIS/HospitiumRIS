import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { buildIcs, calendarEvents, foldLine, icsDate, icsEscape } from '../src/lib/training-calendar.js';
import { attendedHours, buildTranscript, cpdByYearAndBody, transcriptTotals, transcriptYears } from '../src/lib/training-transcript.js';

const training = {
  id: 't1',
  title: 'Infection prevention, control; basics',
  status: 'PUBLISHED',
  deliveryMode: 'HYBRID',
  venue: 'Hall A',
  onlineLink: 'https://meet.example/secret',
  startDate: '2026-12-01T06:00:00Z',
  endDate: '2026-12-02T15:00:00Z',
  sessions: [
    { id: 's1', title: 'Day 1', status: 'SCHEDULED', startsAt: '2026-12-01T06:00:00Z', endsAt: '2026-12-01T09:30:00Z' },
    { id: 's2', title: 'Day 2', status: 'CANCELLED', startsAt: '2026-12-02T06:00:00Z', endsAt: '2026-12-02T09:00:00Z', deliveryMode: 'IN_PERSON' },
  ],
};

describe('iCalendar (RFC 5545)', () => {
  const events = calendarEvents([{ training, role: 'participant' }], { baseUrl: 'https://hris.example' });
  const ics = buildIcs(events, { now: new Date('2026-11-24T08:00:00Z') });
  const unfolded = ics.replace(/\r\n /g, '');

  it('has the required calendar and event properties with CRLF endings', () => {
    assert.ok(ics.startsWith('BEGIN:VCALENDAR\r\nVERSION:2.0\r\nPRODID:'));
    assert.ok(ics.endsWith('END:VCALENDAR\r\n'));
    assert.equal(ics.split('\r\n').filter((l) => l === 'BEGIN:VEVENT').length, 2);
    assert.equal((ics.match(/BEGIN:VEVENT/g) || []).length, (ics.match(/END:VEVENT/g) || []).length);
    for (const prop of ['UID:session-s1@hospitiumris', 'DTSTAMP:20261124T080000Z', 'DTSTART:20261201T060000Z', 'DTEND:20261201T093000Z']) {
      assert.ok(unfolded.includes(prop), prop);
    }
    assert.equal(/[^\r]\n/.test(ics), false, 'bare LF found');
  });
  it('lines are at most 75 octets', () => {
    for (const line of ics.split('\r\n')) assert.ok(new TextEncoder().encode(line).length <= 75, line);
  });
  it('escapes text, marks cancelled sessions, never includes the meeting link', () => {
    assert.ok(unfolded.includes('SUMMARY:Day 1 · Infection prevention\\, control\\; basics'));
    assert.ok(unfolded.includes('STATUS:CANCELLED'));
    assert.ok(unfolded.includes('LOCATION:Hall A / Online'));
    assert.equal(unfolded.includes('meet.example'), false);
    assert.ok(unfolded.includes('/api/training/sessions/s1/join'));
  });
  it('helpers', () => {
    assert.equal(icsEscape('a\\b;c,d\ne'), 'a\\\\b\\;c\\,d\\ne');
    assert.equal(icsDate('2026-01-02T03:04:05.678Z'), '20260102T030405Z');
    const folded = foldLine(`DESCRIPTION:${'é'.repeat(80)}`);
    for (const l of folded.split('\r\n')) assert.ok(new TextEncoder().encode(l).length <= 75);
    assert.equal(folded.replace(/\r\n /g, ''), `DESCRIPTION:${'é'.repeat(80)}`);
  });
  it('facilitators get only their sessions; trainings without sessions become one event', () => {
    const f = calendarEvents([{ training, role: 'facilitator', sessionIds: ['s2'] }]);
    assert.deepEqual(f.map((e) => e.sessionId), ['s2']);
    assert.ok(f[0].title.endsWith('(facilitating)'));
    const plain = calendarEvents([{ training: { ...training, sessions: [] }, role: 'participant' }]);
    assert.equal(plain[0].uid, 'training-t1@hospitiumris');
    const dup = calendarEvents([{ training, role: 'participant' }, { training, role: 'facilitator' }]);
    assert.equal(dup.length, 2);
  });
});

describe('transcript and CPD', () => {
  const regs = [
    {
      id: 'r1', status: 'COMPLETED', completedAt: '2026-03-10T00:00:00Z',
      training: { ...training, id: 'a', title: 'A', cpdHours: 6, cpdPoints: 3, accreditationBody: 'Nursing Council' },
      attendance: [{ sessionId: 's1', status: 'PRESENT' }, { sessionId: 's2', status: 'PRESENT' }],
      certificate: { certificateNumber: 'HRIS-2026-000001', status: 'ISSUED' },
    },
    {
      id: 'r2', status: 'COMPLETED', completedAt: '2026-09-01T00:00:00Z',
      training: { id: 'b', title: 'B', endDate: '2026-09-01', cpdHours: 2, accreditationBody: 'Nursing Council', sessions: [] },
      attendance: [], certificate: { certificateNumber: 'X', status: 'REVOKED' },
    },
    { id: 'r3', status: 'NOT_COMPLETED', training: { id: 'c', title: 'C', endDate: '2025-05-01', cpdHours: 5, sessions: [] }, attendance: [] },
    { id: 'r4', status: 'CANCELLED', training: { id: 'd', title: 'D', endDate: '2026-01-01', sessions: [] } },
  ];
  const rows = buildTranscript(regs);
  it('attended hours skip cancelled sessions and absences', () => {
    assert.equal(attendedHours(training.sessions, [{ sessionId: 's1', status: 'LATE' }, { sessionId: 's2', status: 'PRESENT' }]), 3.5);
    assert.equal(attendedHours(training.sessions, [{ sessionId: 's1', status: 'ABSENT' }]), 0);
  });
  it('rows, years, certificates and CPD only when completed', () => {
    assert.deepEqual(rows.map((r) => r.trainingId), ['b', 'a', 'c']);
    assert.deepEqual(transcriptYears(rows), [2026, 2025]);
    assert.equal(rows.find((r) => r.trainingId === 'a').certificateNumber, 'HRIS-2026-000001');
    assert.equal(rows.find((r) => r.trainingId === 'b').certificateNumber, null); // revoked
    assert.equal(rows.find((r) => r.trainingId === 'c').cpdHours, 0);
  });
  it('CPD by year and accreditation body, and totals', () => {
    assert.deepEqual(cpdByYearAndBody(rows), [{ year: 2026, body: 'Nursing Council', hours: 8, points: 3, trainings: 2 }]);
    assert.deepEqual(transcriptTotals(rows), { trainings: 3, completed: 2, contactHours: 3.5, cpdHours: 8, cpdPoints: 3 });
  });
});
