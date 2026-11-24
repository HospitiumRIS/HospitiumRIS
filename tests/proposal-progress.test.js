import { test } from 'node:test';
import assert from 'node:assert/strict';
import { deliverableFlow, dueText, flowSummary, lifecycle, milestoneFlow, setDeliverableDelivered, timeElapsed } from '../src/lib/proposal-progress.js';
import { htmlToText, sanitizeHtml, snippet } from '../src/lib/safe-html.js';

const NOW = new Date('2026-11-25T10:00:00Z');

test('milestones: done, overdue, due soon, upcoming, sorted by due date', () => {
  const flow = milestoneFlow([
    { title: 'C', targetDate: '2027-06-01' },
    { title: 'A', targetDate: '2026-06-25', status: 'completed', completedDate: '2026-10-20' },
    { title: 'B', targetDate: '2026-11-20' },
    { title: 'D', targetDate: '2026-12-10' },
  ], NOW);
  assert.deepEqual(flow.map((m) => [m.title, m.state]), [['A', 'done'], ['B', 'overdue'], ['D', 'due_soon'], ['C', 'upcoming']]);
  assert.equal(dueText(flow[1]), '5 days overdue');
  assert.equal(dueText(flow[2]), 'Due in 15 days');
  const s = flowSummary(flow);
  assert.equal(s.done, 1);
  assert.equal(s.overdue, 1);
  assert.equal(s.next.title, 'B');
});

test('deliverables: delivered state, linked milestone, strings tolerated', () => {
  const flow = deliverableFlow([
    { id: 'dl1', title: 'Report', dueDate: '2028-04-24', milestoneId: 'm1' },
    { id: 'dl2', title: 'DMP', dueDate: '2026-11-01', deliveredAt: '2026-10-30T00:00:00Z' },
    'Policy brief',
  ], [{ id: 'm1', title: 'Final report' }], NOW);
  assert.deepEqual(flow.map((d) => d.state), ['delivered', 'upcoming', 'no_date']);
  assert.equal(flow[1].milestone, 'Final report');
});

test('mark delivered and undo', () => {
  const user = { id: 'u1', givenName: 'Ann', familyName: 'Ok' };
  const r = setDeliverableDelivered([{ id: 'dl1', title: 'X' }], { id: 'dl1', delivered: true, note: ' sent ', user }, NOW);
  assert.equal(r.deliverable.status, 'delivered');
  assert.equal(r.deliverable.deliveredByName, 'Ann Ok');
  assert.equal(r.deliverable.deliveryNote, 'sent');
  assert.ok(setDeliverableDelivered(r.deliverables, { id: 'dl1', delivered: true, user }, NOW).error);
  const u = setDeliverableDelivered(r.deliverables, { id: 'dl1', delivered: false, user }, NOW);
  assert.equal(u.deliverable.status, 'pending');
  assert.equal(u.deliverable.deliveredAt, undefined);
  // index fallback for rows without ids
  const legacy = setDeliverableDelivered([{ title: 'old' }], { id: 'dl-0', index: 0, delivered: true, user }, NOW);
  assert.equal(legacy.deliverable.id, 'dl-0');
  assert.ok(setDeliverableDelivered([{ id: 'a' }], { id: 'zzz', index: 0, delivered: true }, NOW).error);
});

test('lifecycle stages', () => {
  assert.equal(lifecycle({ status: 'DRAFT' }, NOW).current, 'DRAFT');
  assert.equal(lifecycle({ status: 'UNDER_REVIEW' }, NOW).current, 'IN_REVIEW');
  assert.equal(lifecycle({ status: 'REVISION_REQUESTED' }, NOW).flag, 'REVISION_REQUESTED');
  assert.equal(lifecycle({ status: 'APPROVED', startDate: '2027-01-01', endDate: '2028-01-01' }, NOW).current, 'APPROVED');
  const active = lifecycle({ status: 'APPROVED', startDate: '2026-10-25', endDate: '2028-04-24' }, NOW);
  assert.equal(active.current, 'ACTIVE');
  assert.deepEqual(active.steps.map((s) => s.state), ['done', 'done', 'done', 'current', 'todo']);
  assert.equal(lifecycle({ status: 'APPROVED', startDate: '2024-01-01', endDate: '2025-01-01' }, NOW).steps.at(-1).state, 'done');
  assert.equal(timeElapsed('2026-10-25', '2028-04-24', NOW), 6);
});

test('safe html: allowlist, no attributes, safe links, text', () => {
  const dirty = '<p onclick="x()">Hi <strong>there</strong><script>alert(1)</script><img src=x onerror=alert(1)></p><a href="javascript:alert(1)">bad</a><a href="https://ok.org">ok</a>';
  const clean = sanitizeHtml(dirty);
  assert.equal(clean, '<p>Hi <strong>there</strong></p><a>bad</a><a href="https://ok.org" target="_blank" rel="noopener noreferrer">ok</a>');
  assert.equal(htmlToText('<p>A &amp; B</p><ul><li>one</li><li>two</li></ul>'), 'A & B\n• one\n• two');
  assert.equal(snippet('<p>' + 'word '.repeat(100) + '</p>', 30).endsWith('…'), true);
  assert.equal(htmlToText('α = 0.05, n&asymp;60 &ge; 12'), 'α = 0.05, n≈60 ≥ 12');
});
