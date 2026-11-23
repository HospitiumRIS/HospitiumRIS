import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { TRAINING_EMAIL_KINDS, buildTrainingEmail, shouldDeliver } from '../src/lib/training-email.js';
import { escapeHtml, renderBrandedEmail } from '../src/lib/email-layout.js';

const base = {
  baseUrl: 'https://hospitium.example.org/',
  recipient: { givenName: 'Jane', email: 'jane@a.ac.ke' },
  training: { id: 't1', title: 'GCP refresher', startDate: '2026-12-01T06:00:00Z', endDate: '2026-12-03T14:00:00Z', venue: 'Main hall' },
  session: { title: 'Day 1', startsAt: '2026-12-01T06:00:00Z', endsAt: '2026-12-01T14:00:00Z', venue: 'Main hall' },
  certificate: { number: 'HRIS-2026-000001', verifyUrl: 'https://hospitium.example.org/verify/certificate/abc' },
  dueDate: '2026-12-20T00:00:00Z',
  reason: 'Clashes with clinic',
  checks: [{ label: 'Attend at least 80% of sessions', met: false }, { label: 'Complete all required modules', met: true }],
};

describe('buildTrainingEmail', () => {
  it('renders every kind with subject, HTML, text and an in-app notification', () => {
    for (const kind of TRAINING_EMAIL_KINDS) {
      const e = buildTrainingEmail(kind, base);
      assert.match(e.subject, /^HospitiumRIS - /, kind);
      assert.match(e.html, /<!DOCTYPE html>/, kind);
      assert.ok(e.html.includes('GCP refresher') || e.text.includes('GCP refresher'), kind);
      assert.match(e.text, /Hi Jane,/, kind);
      assert.ok(e.notification.type && e.notification.title && e.notification.message, kind);
      assert.ok(e.notification.actionUrl.startsWith('/'), `${kind} actionUrl is relative`);
      assert.ok(!e.html.includes('undefined') && !e.text.includes('undefined'), `${kind} has no undefined`);
    }
  });

  it('formats session times in Nairobi time and links to the right place', () => {
    const r = buildTrainingEmail('SESSION_REMINDER', { ...base, reminder: '24h' });
    assert.match(r.text, /Tuesday,? 1 December 2026, 09:00–17:00/);
    assert.match(r.subject, /Tomorrow: Day 1/);
    const c = buildTrainingEmail('CHECKIN_OPEN', base);
    assert.match(c.html, /href="https:\/\/hospitium\.example\.org\/researcher\/training\/check-in"/);
    assert.equal(c.notification.actionUrl, '/researcher/training/check-in');
  });

  it('lists unmet requirements when not completed and the number on certificates', () => {
    assert.match(buildTrainingEmail('TRAINING_NOT_COMPLETED', base).text, /Not met: Attend at least 80% of sessions$/m);
    assert.match(buildTrainingEmail('CERTIFICATE_ISSUED', base).text, /Certificate number: HRIS-2026-000001/);
  });

  it('escapes user-supplied content', () => {
    const e = buildTrainingEmail('REGISTRATION_CANCELLED', { ...base, training: { id: 't', title: '<script>alert(1)</script>' }, reason: '"><img src=x>' });
    assert.ok(!e.html.includes('<script>alert(1)</script>'));
    assert.ok(!e.html.includes('<img src=x>'));
    assert.ok(e.html.includes('&lt;script&gt;'));
  });

  it('rejects unknown kinds and leaves out empty details', () => {
    assert.throws(() => buildTrainingEmail('NOPE', base));
    const e = buildTrainingEmail('WAITLISTED', { ...base, waitlistPosition: null });
    assert.ok(!e.text.includes('Position:'));
  });
});

describe('renderBrandedEmail', () => {
  it('drops non-http action links', () => {
    const { html } = renderBrandedEmail({ title: 'x', action: { url: 'javascript:alert(1)', label: 'Go' }, baseUrl: 'https://a' });
    assert.ok(!html.includes('javascript:'));
    assert.equal(escapeHtml(`<a href="x">'`), '&lt;a href=&quot;x&quot;&gt;&#39;');
  });
});

describe('shouldDeliver', () => {
  it('follows the notification preferences', () => {
    assert.equal(shouldDeliver(null, 'email'), true);
    assert.equal(shouldDeliver({ emailEnabled: false, inAppEnabled: true }, 'email'), false);
    assert.equal(shouldDeliver({ emailEnabled: false, inAppEnabled: true }, 'inApp'), true);
    assert.equal(shouldDeliver({ doNotDisturb: true }, 'inApp'), false);
    assert.equal(shouldDeliver({ emailEnabled: true, categoryPreferences: { TRAINING: { email: false } } }, 'email'), false);
    assert.equal(shouldDeliver({ emailEnabled: true, categoryPreferences: { TRAINING: { email: false } } }, 'inApp'), true);
  });
});
