/**
 * Certificate templates and per-training certificate settings (#98). Pure: no database
 * access; safe in client components, API routes and node:test.
 */

export const CERTIFICATE_MODES = ['AUTO', 'REVIEW', 'MANUAL_UPLOAD'];
export const CERTIFICATE_MODE_LABELS = {
  AUTO: 'Issue automatically when completed',
  REVIEW: 'Admin reviews and issues',
  MANUAL_UPLOAD: 'Admin uploads certificate files',
};
export const ORIENTATIONS = ['LANDSCAPE', 'PORTRAIT'];

export const MERGE_FIELDS = {
  participantName: 'Participant name',
  trainingTitle: 'Training title',
  completionDate: 'Completion date',
  startDate: 'Training start date',
  endDate: 'Training end date',
  cpdHours: 'CPD hours',
  cpdPoints: 'CPD points',
  certificateNumber: 'Certificate number',
  institutionName: 'Institution name',
  facilitators: 'Facilitators',
  accreditationBody: 'Accreditation body',
  accreditationNumber: 'Accreditation number',
};

export const DEFAULT_TEMPLATE = {
  name: 'Standard certificate',
  orientation: 'LANDSCAPE',
  primaryColor: '#8b6cbc',
  titleText: 'Certificate of Completion',
  bodyTemplate: 'has successfully completed {{trainingTitle}}, held {{startDate}} to {{endDate}}.',
  footerText: '',
  signatories: [],
  showQr: true,
  logoDataUrl: null,
  backgroundDataUrl: null,
};

export const SAMPLE_VALUES = {
  participantName: 'Jane Wanjiku Achieng',
  trainingTitle: 'Good Clinical Practice (GCP) Refresher',
  completionDate: '3 December 2026',
  startDate: '1 December 2026',
  endDate: '3 December 2026',
  cpdHours: '16',
  cpdPoints: '10',
  certificateNumber: 'HRIS-2026-000123',
  institutionName: 'Sample Teaching and Referral Hospital',
  facilitators: 'Dr. A. Otieno, M. Njeri',
  accreditationBody: 'Kenya Medical Practitioners and Dentists Council',
  accreditationNumber: 'KMPDC/CPD/2026/0042',
};

const IMAGE_LIMITS = { logo: 400 * 1024, signature: 300 * 1024, background: 1200 * 1024, accreditation: 400 * 1024 };

/** Replace {{field}} with values; unknown or empty fields become ''. */
export function renderMergeFields(text, values = {}) {
  return String(text || '')
    .replace(/\{\{\s*(\w+)\s*\}\}/g, (_, key) => (values[key] === null || values[key] === undefined ? '' : String(values[key])))
    .replace(/[ \t]{2,}/g, ' ')
    .trim();
}

export function unknownMergeFields(text) {
  const out = [];
  for (const [, key] of String(text || '').matchAll(/\{\{\s*(\w+)\s*\}\}/g)) {
    if (!(key in MERGE_FIELDS) && !out.includes(key)) out.push(key);
  }
  return out;
}

/** "data:image/png;base64,..." within a size limit. Returns { ok, value } or { ok:false, error }. */
export function validateImageDataUrl(value, kind = 'logo') {
  if (value === null || value === undefined || value === '') return { ok: true, value: null };
  const m = /^data:image\/(png|jpeg|jpg);base64,([A-Za-z0-9+/=]+)$/.exec(String(value));
  if (!m) return { ok: false, error: `The ${kind} must be a PNG or JPEG image` };
  const bytes = Math.floor((m[2].length * 3) / 4);
  const limit = IMAGE_LIMITS[kind] || IMAGE_LIMITS.logo;
  if (bytes > limit) return { ok: false, error: `The ${kind} image is too large (max ${Math.round(limit / 1024)} KB)` };
  return { ok: true, value: String(value) };
}

export function isHexColor(value) {
  return /^#[0-9a-fA-F]{6}$/.test(String(value || ''));
}

/**
 * Validate a template create/update body.
 * @returns {{ ok: true, data } | { ok: false, error }}
 */
export function validateTemplateInput(body, existing = {}) {
  const b = body || {};
  const pick = (k) => (b[k] !== undefined ? b[k] : existing[k]);
  const data = {};

  const name = String(pick('name') ?? '').trim();
  if (!name) return { ok: false, error: 'Template name is required' };
  if (name.length > 120) return { ok: false, error: 'Template name is too long' };
  data.name = name;

  const orientation = pick('orientation') || 'LANDSCAPE';
  if (!ORIENTATIONS.includes(orientation)) return { ok: false, error: 'Orientation must be LANDSCAPE or PORTRAIT' };
  data.orientation = orientation;

  const color = pick('primaryColor') || DEFAULT_TEMPLATE.primaryColor;
  if (!isHexColor(color)) return { ok: false, error: 'Colour must look like #8b6cbc' };
  data.primaryColor = color;

  const titleText = String(pick('titleText') ?? DEFAULT_TEMPLATE.titleText).trim();
  if (!titleText || titleText.length > 120) return { ok: false, error: 'Title is required (120 characters max)' };
  data.titleText = titleText;

  const bodyTemplate = String(pick('bodyTemplate') ?? DEFAULT_TEMPLATE.bodyTemplate).trim();
  if (bodyTemplate.length > 1000) return { ok: false, error: 'Body text is too long (1000 characters max)' };
  data.bodyTemplate = bodyTemplate;

  const footerText = String(pick('footerText') ?? '').trim();
  if (footerText.length > 300) return { ok: false, error: 'Footer text is too long (300 characters max)' };
  data.footerText = footerText || null;

  const unknown = [...unknownMergeFields(titleText), ...unknownMergeFields(bodyTemplate), ...unknownMergeFields(footerText)];
  if (unknown.length) return { ok: false, error: `Unknown merge field: {{${unknown[0]}}}` };

  for (const [field, kind] of [['logoDataUrl', 'logo'], ['backgroundDataUrl', 'background']]) {
    const r = validateImageDataUrl(pick(field), kind);
    if (!r.ok) return r;
    data[field] = r.value;
  }

  const signatories = pick('signatories') || [];
  if (!Array.isArray(signatories) || signatories.length > 3) return { ok: false, error: 'Up to 3 signatories' };
  data.signatories = [];
  for (const s of signatories) {
    const sName = String(s?.name || '').trim();
    if (!sName) return { ok: false, error: 'Each signatory needs a name' };
    const img = validateImageDataUrl(s?.signatureDataUrl, 'signature');
    if (!img.ok) return img;
    data.signatories.push({ name: sName.slice(0, 80), title: String(s?.title || '').trim().slice(0, 100), signatureDataUrl: img.value });
  }

  data.showQr = pick('showQr') !== false;
  data.isDefault = pick('isDefault') === true;
  return { ok: true, data };
}

/** Prefix for certificate numbers (decision D1): letters, digits, dashes; upper-cased. */
export function normalizeCertificatePrefix(value) {
  const v = String(value ?? '').trim().toUpperCase();
  if (!v) return 'HRIS';
  return v;
}

export function formatCertificateNumber(prefix, year, sequence) {
  return `${normalizeCertificatePrefix(prefix)}-${year}-${String(sequence).padStart(6, '0')}`;
}

/**
 * Validate the certificate + CPD settings of a training update.
 * @returns {{ ok: true, data } | { ok: false, error }}
 */
export function validateCertificateSettings(body) {
  const b = body || {};
  const data = {};
  if (b.certificatePrefix !== undefined) {
    const p = normalizeCertificatePrefix(b.certificatePrefix);
    if (!/^[A-Z0-9][A-Z0-9-]{0,15}$/.test(p) || p.endsWith('-')) {
      return { ok: false, error: 'Prefix: up to 16 letters, digits or dashes (e.g. KNH-GCP)' };
    }
    data.certificatePrefix = p;
  }
  if (b.certificateMode !== undefined) {
    if (!CERTIFICATE_MODES.includes(b.certificateMode)) return { ok: false, error: 'Unknown certificate mode' };
    data.certificateMode = b.certificateMode;
  }
  if (b.certificateTemplateId !== undefined) data.certificateTemplateId = b.certificateTemplateId || null;
  if (b.certificateValidityMonths !== undefined) {
    if (b.certificateValidityMonths === null || b.certificateValidityMonths === '') data.certificateValidityMonths = null;
    else {
      const n = Number(b.certificateValidityMonths);
      if (!Number.isInteger(n) || n < 1 || n > 120) return { ok: false, error: 'Validity must be 1 to 120 months' };
      data.certificateValidityMonths = n;
    }
  }
  for (const key of ['cpdHours', 'cpdPoints']) {
    if (b[key] === undefined) continue;
    if (b[key] === null || b[key] === '') { data[key] = null; continue; }
    const n = Number(b[key]);
    if (!Number.isFinite(n) || n < 0 || n > 1000) return { ok: false, error: `${key === 'cpdHours' ? 'CPD hours' : 'CPD points'} must be between 0 and 1000` };
    data[key] = Math.round(n * 10) / 10;
  }
  for (const key of ['accreditationBody', 'accreditationNumber']) {
    if (b[key] === undefined) continue;
    const v = String(b[key] ?? '').trim();
    if (v.length > 200) return { ok: false, error: 'Accreditation fields are 200 characters max' };
    data[key] = v || null;
  }
  if (b.accreditationLogoDataUrl !== undefined) {
    const r = validateImageDataUrl(b.accreditationLogoDataUrl, 'accreditation');
    if (!r.ok) return r;
    data.accreditationLogoDataUrl = r.value;
  }
  return { ok: true, data };
}

function formatDay(date, timeZone) {
  if (!date) return '';
  return new Intl.DateTimeFormat('en-GB', { timeZone, day: 'numeric', month: 'long', year: 'numeric' }).format(new Date(date));
}

/**
 * Merge values for one certificate, from data captured at issue time.
 */
export function buildCertificateValues({ participant, training, institution, completedAt, certificateNumber, facilitators = [], timeZone = 'Africa/Nairobi' }) {
  const name = [participant?.givenName, participant?.familyName].filter(Boolean).join(' ') || participant?.email || '';
  const fmtNum = (n) => (n === null || n === undefined ? '' : String(Number(n)));
  return {
    participantName: name,
    trainingTitle: training?.title || '',
    completionDate: formatDay(completedAt || training?.endDate, timeZone),
    startDate: formatDay(training?.startDate, timeZone),
    endDate: formatDay(training?.endDate, timeZone),
    cpdHours: fmtNum(training?.cpdHours),
    cpdPoints: fmtNum(training?.cpdPoints),
    certificateNumber: certificateNumber || '',
    institutionName: institution?.name || '',
    facilitators: facilitators.join(', '),
    accreditationBody: training?.accreditationBody || '',
    accreditationNumber: training?.accreditationNumber || '',
  };
}
