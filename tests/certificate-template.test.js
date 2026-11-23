import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  DEFAULT_TEMPLATE,
  SAMPLE_VALUES,
  buildCertificateValues,
  formatCertificateNumber,
  renderMergeFields,
  unknownMergeFields,
  validateCertificateSettings,
  validateImageDataUrl,
  validateTemplateInput,
} from '../src/lib/certificate-template.js';

const PNG_1PX = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';

describe('merge fields', () => {
  it('fills known fields and blanks unknown or empty ones', () => {
    assert.equal(renderMergeFields('{{participantName}} completed {{ trainingTitle }}', SAMPLE_VALUES),
      'Jane Wanjiku Achieng completed Good Clinical Practice (GCP) Refresher');
    assert.equal(renderMergeFields('Hours: {{cpdHours}} {{nope}}', { cpdHours: '' }), 'Hours:');
    assert.deepEqual(unknownMergeFields('{{trainingTitle}} {{nope}} {{nope}}'), ['nope']);
  });
});

describe('validateTemplateInput', () => {
  it('accepts a full template and fills defaults', () => {
    const r = validateTemplateInput({
      name: 'GCP',
      signatories: [{ name: 'Dr A', title: 'Director', signatureDataUrl: PNG_1PX }],
      logoDataUrl: PNG_1PX,
    });
    assert.equal(r.ok, true);
    assert.equal(r.data.orientation, 'LANDSCAPE');
    assert.equal(r.data.titleText, DEFAULT_TEMPLATE.titleText);
    assert.equal(r.data.signatories.length, 1);
    assert.equal(r.data.showQr, true);
  });

  it('rejects bad input', () => {
    assert.equal(validateTemplateInput({}).ok, false);
    assert.match(validateTemplateInput({ name: 'x', bodyTemplate: '{{salary}}' }).error, /Unknown merge field/);
    assert.equal(validateTemplateInput({ name: 'x', primaryColor: 'purple' }).ok, false);
    assert.equal(validateTemplateInput({ name: 'x', orientation: 'SQUARE' }).ok, false);
    assert.equal(validateTemplateInput({ name: 'x', signatories: [{}, {}, {}, {}] }).ok, false);
    assert.equal(validateTemplateInput({ name: 'x', logoDataUrl: 'data:image/svg+xml;base64,PHN2Zz4=' }).ok, false);
  });

  it('merges a partial update with the existing template', () => {
    const r = validateTemplateInput({ titleText: 'Certificate of Attendance' }, { name: 'Old', orientation: 'PORTRAIT', primaryColor: '#000000' });
    assert.equal(r.data.name, 'Old');
    assert.equal(r.data.orientation, 'PORTRAIT');
    assert.equal(r.data.titleText, 'Certificate of Attendance');
  });
});

describe('validateImageDataUrl', () => {
  it('limits type and size', () => {
    assert.equal(validateImageDataUrl(PNG_1PX).ok, true);
    assert.equal(validateImageDataUrl('').value, null);
    const big = `data:image/png;base64,${'A'.repeat(600 * 1024)}`;
    assert.match(validateImageDataUrl(big, 'logo').error, /too large/);
  });
});

describe('certificate settings (D1, D6)', () => {
  it('normalises the prefix and validates CPD fields', () => {
    const r = validateCertificateSettings({ certificatePrefix: ' knh-gcp ', cpdHours: '16', cpdPoints: 7.25, certificateMode: 'AUTO', certificateValidityMonths: 24 });
    assert.deepEqual(r.data, { certificatePrefix: 'KNH-GCP', cpdHours: 16, cpdPoints: 7.3, certificateMode: 'AUTO', certificateValidityMonths: 24 });
    assert.equal(validateCertificateSettings({ certificatePrefix: '' }).data.certificatePrefix, 'HRIS');
    assert.equal(validateCertificateSettings({ certificatePrefix: 'BAD PREFIX' }).ok, false);
    assert.equal(validateCertificateSettings({ certificatePrefix: 'X-' }).ok, false);
    assert.equal(validateCertificateSettings({ cpdHours: -1 }).ok, false);
    assert.equal(validateCertificateSettings({ certificateMode: 'MAGIC' }).ok, false);
    assert.equal(validateCertificateSettings({ certificateValidityMonths: '' }).data.certificateValidityMonths, null);
  });

  it('formats certificate numbers', () => {
    assert.equal(formatCertificateNumber('knh', 2026, 42), 'KNH-2026-000042');
    assert.equal(formatCertificateNumber(null, 2026, 1234567), 'HRIS-2026-1234567');
  });
});

describe('buildCertificateValues', () => {
  it('builds values in Nairobi time', () => {
    const v = buildCertificateValues({
      participant: { givenName: 'Jane', familyName: 'Achieng' },
      training: { title: 'GCP', startDate: '2026-11-30T22:00:00Z', endDate: '2026-12-03T14:00:00Z', cpdHours: 16, cpdPoints: null },
      institution: { name: 'KNH' },
      completedAt: '2026-12-03T14:00:00Z',
      certificateNumber: 'KNH-2026-000001',
      facilitators: ['Dr A', 'Dr B'],
    });
    assert.equal(v.participantName, 'Jane Achieng');
    assert.equal(v.startDate, '1 December 2026');
    assert.equal(v.cpdHours, '16');
    assert.equal(v.cpdPoints, '');
    assert.equal(v.facilitators, 'Dr A, Dr B');
  });
});

describe('buildCertificatePdf', () => {
  it('renders landscape and portrait PDFs with images, QR and long names', async () => {
    const { buildCertificatePdf } = await import('../src/lib/certificate-pdf.js');
    for (const orientation of ['LANDSCAPE', 'PORTRAIT']) {
      const pdf = await buildCertificatePdf({
        template: { ...DEFAULT_TEMPLATE, orientation, logoDataUrl: PNG_1PX, signatories: [{ name: 'Dr A', title: 'Director', signatureDataUrl: PNG_1PX }, { name: 'Prof B' }] },
        values: { ...SAMPLE_VALUES, participantName: 'Jane Wanjiku Achieng-Otieno Nyambura Kamau' },
        verifyUrl: 'https://hospitium.example.org/verify/certificate/abc',
        accreditationLogoDataUrl: PNG_1PX,
        watermark: 'PREVIEW',
      });
      assert.equal(pdf.subarray(0, 5).toString(), '%PDF-');
      assert.ok(pdf.length > 2000);
    }
    const minimal = await buildCertificatePdf({ template: {}, values: { participantName: 'X' } });
    assert.equal(minimal.subarray(0, 5).toString(), '%PDF-');
  });
});
