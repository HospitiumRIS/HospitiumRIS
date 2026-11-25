/**
 * Clinical trials: shared statuses, rules and (for now) sample data.
 *
 * The module has no database tables yet, so every clinical-trials page reads the same
 * SAMPLE_TRIALS. When trials are stored for real, replace `sampleTrials()` with an API
 * call; the helpers below stay the same. Pure (no DB).
 */

export const TRIAL_STATUS = {
  DRAFT: { label: 'Draft', tone: 'neutral', open: true },
  IN_APPROVAL: { label: 'In approval', tone: 'info', open: true },
  APPROVED: { label: 'Approved, not started', tone: 'progress', open: true },
  RECRUITING: { label: 'Recruiting', tone: 'success', open: true },
  FOLLOW_UP: { label: 'Follow-up', tone: 'success', open: true },
  SUSPENDED: { label: 'Suspended', tone: 'danger', open: true },
  COMPLETED: { label: 'Completed', tone: 'neutral', open: false },
  TERMINATED: { label: 'Terminated early', tone: 'danger', open: false },
  WITHDRAWN: { label: 'Withdrawn', tone: 'neutral', open: false },
};

export const APPROVAL_STATUS = {
  NOT_STARTED: { label: 'Not started', tone: 'neutral' },
  PENDING: { label: 'Pending', tone: 'info' },
  APPROVED: { label: 'Approved', tone: 'success' },
  EXPIRING: { label: 'Expiring', tone: 'warning' },
  EXPIRED: { label: 'Expired', tone: 'danger' },
  REJECTED: { label: 'Rejected', tone: 'danger' },
  NOT_REQUIRED: { label: 'Not required', tone: 'neutral' },
};

export const REGISTRY_STATUS = {
  NOT_REGISTERED: { label: 'Not registered', tone: 'neutral' },
  SUBMITTED: { label: 'Submitted', tone: 'info' },
  REGISTERED: { label: 'Registered', tone: 'success' },
  RESULTS_DUE: { label: 'Results due', tone: 'warning' },
  RESULTS_POSTED: { label: 'Results posted', tone: 'success' },
};

export const PHASES = ['Phase I', 'Phase I/II', 'Phase II', 'Phase III', 'Phase IV', 'Not applicable'];
export const STUDY_TYPES = ['Interventional', 'Observational'];

const DAY = 86400000;
const day = (d) => (d ? new Date(d) : null);
export const daysUntil = (d, now = new Date()) => (d ? Math.ceil((day(d) - now) / DAY) : null);

/** Ethics or regulatory approval state, taking the expiry date into account. */
export function approvalState(approval, now = new Date()) {
  if (!approval) return 'NOT_STARTED';
  const left = daysUntil(approval.expiry, now);
  if (approval.status === 'APPROVED' && left !== null) {
    if (left < 0) return 'EXPIRED';
    if (left <= 60) return 'EXPIRING';
  }
  return approval.status || 'NOT_STARTED';
}

export function enrolment(trial) {
  const target = Number(trial?.targetEnrollment) || 0;
  const enrolled = Number(trial?.enrolled) || 0;
  return { target, enrolled, pct: target ? Math.min(100, Math.round((enrolled / target) * 100)) : 0 };
}

/** Expected % enrolled by now if recruitment ran evenly between its dates. */
export function expectedEnrolmentPct(trial, now = new Date()) {
  const s = day(trial?.recruitmentStart || trial?.startDate);
  const e = day(trial?.recruitmentEnd || trial?.endDate);
  if (!s || !e || e <= s) return null;
  return Math.max(0, Math.min(100, Math.round(((now - s) / (e - s)) * 100)));
}

/**
 * What needs attention on a trial, most urgent first.
 * @returns {{ key, severity: 'high'|'medium'|'low', text }[]}
 */
export function trialFlags(trial, now = new Date()) {
  const flags = [];
  const open = TRIAL_STATUS[trial.status]?.open;
  if (!open) return flags;
  const ethics = approvalState(trial.ethics, now);
  const reg = approvalState(trial.regulatory, now);
  const running = ['RECRUITING', 'FOLLOW_UP'].includes(trial.status);
  if (ethics === 'EXPIRED' && running) flags.push({ key: 'ethics_expired', severity: 'high', text: 'Ethics approval expired while the trial is running' });
  else if (ethics === 'EXPIRING') flags.push({ key: 'ethics_expiring', severity: 'medium', text: `Ethics approval expires in ${daysUntil(trial.ethics.expiry, now)} days` });
  if (reg === 'EXPIRED' && running) flags.push({ key: 'reg_expired', severity: 'high', text: 'Regulatory approval expired' });
  const sc = safetyCounts(trial, now);
  if (sc.overdue > 0) flags.push({ key: 'sae_overdue', severity: 'high', text: `${sc.overdue} SAE report${sc.overdue === 1 ? '' : 's'} past the reporting deadline` });
  if (running && trial.registry?.status === 'NOT_REGISTERED') flags.push({ key: 'not_registered', severity: 'high', text: 'Recruiting but not registered on PACTR / ClinicalTrials.gov' });
  if (sc.deviationsOpen > 0) flags.push({ key: 'deviations', severity: sc.majorDeviations ? 'high' : 'medium', text: `${sc.deviationsOpen} open protocol deviation${sc.deviationsOpen === 1 ? '' : 's'}${sc.majorDeviations ? ` (${sc.majorDeviations} major)` : ''}` });
  const gcpIssues = (trial.team || []).filter((m) => ['EXPIRED', 'MISSING'].includes(gcpState(m.gcpExpiry, now))).length;
  if (gcpIssues) flags.push({ key: 'gcp', severity: 'medium', text: `${gcpIssues} team member${gcpIssues === 1 ? '' : 's'} without valid GCP` });
  if (trial.status === 'RECRUITING') {
    const exp = expectedEnrolmentPct(trial, now);
    const { pct } = enrolment(trial);
    if (exp !== null && exp - pct > 20) flags.push({ key: 'slow', severity: 'medium', text: `Recruitment behind plan (${pct}% enrolled, ${exp}% expected)` });
  }
  const rank = { high: 0, medium: 1, low: 2 };
  return flags.sort((a, b) => rank[a.severity] - rank[b.severity]);
}

export function portfolioSummary(trials, now = new Date()) {
  const open = trials.filter((t) => TRIAL_STATUS[t.status]?.open);
  const flagged = open.filter((t) => trialFlags(t, now).length);
  const target = open.reduce((a, t) => a + enrolment(t).target, 0);
  const enrolled = open.reduce((a, t) => a + enrolment(t).enrolled, 0);
  return {
    total: trials.length,
    open: open.length,
    recruiting: trials.filter((t) => t.status === 'RECRUITING').length,
    inApproval: trials.filter((t) => t.status === 'IN_APPROVAL' || t.status === 'DRAFT').length,
    closed: trials.length - open.length,
    flagged: flagged.length,
    urgent: open.filter((t) => trialFlags(t, now).some((f) => f.severity === 'high')).length,
    enrolled,
    target,
    enrolledPct: target ? Math.round((enrolled / target) * 100) : 0,
  };
}

export function validateTrialDraft(d) {
  const errors = {};
  if (!String(d.title || '').trim()) errors.title = 'Give the trial a title';
  if (!d.phase) errors.phase = 'Choose a phase';
  if (!d.studyType) errors.studyType = 'Choose a study type';
  if (d.targetEnrollment !== '' && d.targetEnrollment !== undefined && !(Number(d.targetEnrollment) > 0)) errors.targetEnrollment = 'Enter a number above 0';
  if (d.startDate && d.endDate && new Date(d.endDate) <= new Date(d.startDate)) errors.endDate = 'End date must be after the start date';
  return { ok: !Object.keys(errors).length, errors };
}

const T = (o) => ({ sites: [], team: [], events: [], mine: true, ...o });

/** Sample trials shown until trials are stored in the database. */
export const SAMPLE_TRIALS = [
  T({
    id: 'ct-001', code: 'CT-2026-001', title: 'Efficacy and safety of XYZ-401 for uncomplicated P. falciparum malaria in adults', shortTitle: 'XYZ-401 malaria trial',
    pi: 'Dr. Amina Okonkwo', department: 'Infectious Diseases', phase: 'Phase III', studyType: 'Interventional', status: 'RECRUITING',
    condition: 'Uncomplicated P. falciparum malaria', intervention: 'XYZ-401, oral 400 mg daily for 3 days', sponsor: 'Global Health Research Fund',
    startDate: '2026-02-01', endDate: '2027-12-31', recruitmentStart: '2026-03-01', recruitmentEnd: '2027-03-01', targetEnrollment: 500, enrolled: 182,
    sites: [{ name: 'Kisumu County Referral Hospital', target: 250, enrolled: 104 }, { name: 'Kakamega County Referral Hospital', target: 250, enrolled: 78 }],
    ethics: { status: 'APPROVED', committee: 'KNH-UoN ERC', reference: 'P412/06/2025', expiry: '2027-01-10' },
    regulatory: { status: 'APPROVED', authority: 'Pharmacy and Poisons Board', reference: 'PPB/ECCT/25/012', expiry: '2027-02-01' },
    registry: { status: 'REGISTERED', pactr: 'PACTR202602001234', nct: null },
    events: [
      { id: 'ev-101', type: 'SAE', title: 'Hospitalisation for severe anaemia', participant: 'KIS-0042', site: 'Kisumu County Referral Hospital', onset: '2026-11-08', awareOn: '2026-11-09', severity: 'Serious', related: 'Possibly related', expected: false, status: 'OPEN' },
      { id: 'ev-102', type: 'SAE', title: 'Seizure (febrile) in participant', participant: 'KAK-0017', site: 'Kakamega County Referral Hospital', onset: '2026-11-20', awareOn: '2026-11-21', severity: 'Life-threatening', related: 'Unlikely related', expected: false, status: 'OPEN' },
      { id: 'ev-103', type: 'SAE', title: 'Pneumonia requiring admission', participant: 'KIS-0011', site: 'Kisumu County Referral Hospital', onset: '2026-09-02', awareOn: '2026-09-02', severity: 'Serious', related: 'Not related', expected: true, status: 'CLOSED', reportedOn: '2026-09-08' },
      { id: 'ev-104', type: 'DEVIATION', title: 'Day-7 visit done outside the ±2-day window', participant: 'KAK-0009', site: 'Kakamega County Referral Hospital', onset: '2026-10-28', awareOn: '2026-10-30', severity: 'Minor', status: 'OPEN', capa: 'Visit reminders by SMS two days before' },
    ],
    team: [{ name: 'Dr. Amina Okonkwo', role: 'Principal investigator', duties: ['Overall responsibility', 'Informed consent', 'Eligibility', 'SAE assessment'], gcpExpiry: '2027-08-01', email: 'a.okonkwo@example.org' }, { name: 'Peter Otieno', role: 'Study coordinator', duties: ['Data entry', 'Regulatory files', 'Drug accountability'], gcpExpiry: '2026-12-15', email: 'p.otieno@example.org' }, { name: 'Faith Achieng', role: 'Research nurse', duties: ['Informed consent', 'Sample collection', 'Vital signs'], gcpExpiry: '2027-05-20', email: 'f.achieng@example.org' }],
  }),
  T({
    id: 'ct-002', code: 'CT-2026-002', title: 'Short-course regimen for drug-resistant tuberculosis: a pragmatic randomised trial', shortTitle: 'DR-TB short course',
    pi: 'Dr. Samuel Mwangi', department: 'Respiratory Medicine', phase: 'Phase II', studyType: 'Interventional', status: 'RECRUITING',
    condition: 'Rifampicin-resistant tuberculosis', intervention: '6-month BPaLM regimen', sponsor: 'National TB Programme',
    startDate: '2025-09-01', endDate: '2027-08-31', recruitmentStart: '2025-10-01', recruitmentEnd: '2026-10-01', targetEnrollment: 200, enrolled: 96,
    sites: [{ name: 'Kenyatta National Hospital', target: 200, enrolled: 96 }],
    ethics: { status: 'APPROVED', committee: 'KNH-UoN ERC', reference: 'P210/03/2025', expiry: '2026-12-20' },
    regulatory: { status: 'APPROVED', authority: 'Pharmacy and Poisons Board', reference: 'PPB/ECCT/25/004', expiry: '2027-03-01' },
    registry: { status: 'REGISTERED', pactr: null, nct: 'NCT06123456' },
    events: [
      { id: 'ev-201', type: 'DEVIATION', title: 'Consent form version 2.0 used after 3.0 approval', participant: 'KNH-0058', site: 'Kenyatta National Hospital', onset: '2026-10-14', awareOn: '2026-10-20', severity: 'Major', status: 'OPEN', capa: 'Re-consent with v3.0; retrain staff' },
      { id: 'ev-202', type: 'DEVIATION', title: 'Missed ECG at week 4', participant: 'KNH-0061', site: 'Kenyatta National Hospital', onset: '2026-11-03', awareOn: '2026-11-05', severity: 'Minor', status: 'OPEN' },
      { id: 'ev-203', type: 'SAE', title: 'QT prolongation > 500 ms', participant: 'KNH-0044', site: 'Kenyatta National Hospital', onset: '2026-08-12', awareOn: '2026-08-12', severity: 'Serious', related: 'Probably related', expected: true, status: 'REPORTED', reportedOn: '2026-08-18' },
    ],
    mine: true,
    team: [{ name: 'Dr. Samuel Mwangi', role: 'Principal investigator', duties: ['Overall responsibility', 'Eligibility', 'SAE assessment'], gcpExpiry: '2027-02-10' }, { name: 'Grace Njeri', role: 'Pharmacist', duties: ['Drug dispensing', 'Drug accountability'], gcpExpiry: '2026-09-30' }],
  }),
  T({
    id: 'ct-003', code: 'CT-2026-003', title: 'Single-dose HPV vaccination in adolescent girls: immunogenicity at 24 months', shortTitle: 'Single-dose HPV',
    pi: 'Dr. Mary Wanjiru', department: 'Paediatrics', phase: 'Phase IV', studyType: 'Interventional', status: 'IN_APPROVAL',
    condition: 'HPV infection prevention', intervention: 'Single dose 9-valent HPV vaccine', sponsor: 'Ministry of Health',
    startDate: '2027-01-15', endDate: '2029-01-15', targetEnrollment: 300, enrolled: 0,
    ethics: { status: 'PENDING', committee: 'KNH-UoN ERC', reference: null, expiry: null },
    regulatory: { status: 'NOT_STARTED', authority: 'Pharmacy and Poisons Board' },
    registry: { status: 'NOT_REGISTERED' },
    team: [{ name: 'Dr. Mary Wanjiru', role: 'Principal investigator', duties: ['Overall responsibility'], gcpExpiry: '2028-01-12' }],
  }),
  T({
    id: 'ct-004', code: 'CT-2025-014', title: 'Community-based hypertension management with task sharing', shortTitle: 'Task-sharing hypertension',
    pi: 'Dr. John Kamau', department: 'Internal Medicine', phase: 'Not applicable', studyType: 'Interventional', status: 'SUSPENDED',
    condition: 'Hypertension', intervention: 'Nurse-led titration protocol', sponsor: 'County Government',
    startDate: '2025-03-01', endDate: '2026-12-31', recruitmentStart: '2025-04-01', recruitmentEnd: '2026-04-01', targetEnrollment: 300, enrolled: 90,
    ethics: { status: 'APPROVED', committee: 'Moi University IREC', reference: '0004512', expiry: '2026-10-30' },
    regulatory: { status: 'NOT_REQUIRED' },
    registry: { status: 'REGISTERED', pactr: 'PACTR202503004567' },
    events: [
      { id: 'ev-401', type: 'DEVIATION', title: 'Participants enrolled after ethics approval expired', participant: '—', site: 'Eldoret', onset: '2026-11-02', awareOn: '2026-11-04', severity: 'Major', status: 'OPEN', capa: 'Enrolment paused; renewal submitted' },
    ],
    mine: false,
    team: [{ name: 'Dr. John Kamau', role: 'Principal investigator', duties: ['Overall responsibility'], gcpExpiry: '2026-11-01' }, { name: 'Lucy Wambui', role: 'Clinical officer', duties: ['Blood pressure titration'], gcpExpiry: null }],
  }),
  T({
    id: 'ct-005', code: 'CT-2026-007', title: 'AI-assisted triage in emergency departments: stepped-wedge evaluation', shortTitle: 'AI triage (TRIAGE-KE)',
    pi: 'Joy Owango', department: 'Emergency Medicine', phase: 'Not applicable', studyType: 'Interventional', status: 'RECRUITING',
    condition: 'Emergency triage accuracy', intervention: 'AI-assisted triage decision support', sponsor: 'Private Industry Sponsor',
    startDate: '2026-10-25', endDate: '2028-04-24', recruitmentStart: '2026-12-01', recruitmentEnd: '2027-08-31', targetEnrollment: 3600, enrolled: 0,
    ethics: { status: 'APPROVED', committee: 'NACOSTI / NREIB', reference: 'NREIB/ERC/2026/0417', expiry: '2028-10-05' },
    regulatory: { status: 'NOT_REQUIRED' },
    registry: { status: 'NOT_REGISTERED' },
    mine: false,
    team: [{ name: 'Joy Owango', role: 'Principal investigator', duties: ['Overall responsibility', 'Data management plan'], gcpExpiry: '2027-10-01' }, { name: 'Stephen Gaikia', role: 'Co-investigator', duties: ['Site liaison'], gcpExpiry: '2026-12-31' }],
  }),
  T({
    id: 'ct-006', code: 'CT-2026-011', title: 'Probiotic supplementation to prevent necrotising enterocolitis in preterm infants', shortTitle: 'Probiotics for NEC',
    pi: 'Dr. Grace Akinyi', department: 'Neonatology', phase: 'Phase III', studyType: 'Interventional', status: 'DRAFT',
    condition: 'Necrotising enterocolitis', intervention: 'Multi-strain probiotic', sponsor: null,
    startDate: '2027-03-01', endDate: '2029-03-01', targetEnrollment: 420, enrolled: 0,
    ethics: null, regulatory: null, registry: { status: 'NOT_REGISTERED' },
    team: [{ name: 'Dr. Grace Akinyi', role: 'Principal investigator', duties: ['Overall responsibility'], gcpExpiry: '2027-04-04' }],
  }),
  T({
    id: 'ct-007', code: 'CT-2024-003', title: 'Maternal iron supplementation and infant neurodevelopment', shortTitle: 'Maternal iron',
    pi: 'Dr. Grace Akinyi', department: 'Obstetrics', phase: 'Phase III', studyType: 'Interventional', status: 'COMPLETED',
    condition: 'Maternal anaemia', intervention: 'Daily iron 60 mg', sponsor: 'Wellcome Trust',
    startDate: '2023-01-10', endDate: '2025-12-15', targetEnrollment: 600, enrolled: 600,
    ethics: { status: 'APPROVED', committee: 'KNH-UoN ERC', reference: 'P101/01/2023', expiry: '2026-01-10' },
    regulatory: { status: 'APPROVED', authority: 'Pharmacy and Poisons Board', reference: 'PPB/ECCT/23/002', expiry: '2026-01-10' },
    registry: { status: 'RESULTS_DUE', pactr: 'PACTR202301009876', resultsDue: '2026-12-15' },
    closure: { reason: 'Completed as planned', date: '2025-12-15', lesson: 'Community health volunteers doubled retention at 12 months.' },
    team: [{ name: 'Dr. Grace Akinyi', role: 'Principal investigator' }],
  }),
  T({
    id: 'ct-008', code: 'CT-2024-009', title: 'Zinc adjunct therapy for severe pneumonia in children under five', shortTitle: 'Zinc for pneumonia',
    pi: 'Dr. Samuel Mwangi', department: 'Paediatrics', phase: 'Phase III', studyType: 'Interventional', status: 'TERMINATED',
    condition: 'Severe pneumonia', intervention: 'Zinc 20 mg daily', sponsor: 'NIH',
    startDate: '2024-02-01', endDate: '2025-06-30', targetEnrollment: 400, enrolled: 152,
    ethics: { status: 'APPROVED', committee: 'KNH-UoN ERC', reference: 'P330/11/2023', expiry: '2025-11-30' },
    regulatory: { status: 'APPROVED', authority: 'Pharmacy and Poisons Board', reference: 'PPB/ECCT/24/001', expiry: '2025-11-30' },
    registry: { status: 'RESULTS_POSTED', nct: 'NCT05987654' },
    closure: { reason: 'Futility at interim analysis', date: '2025-01-20', lesson: 'Set the interim analysis earlier for adjunct therapies.' },
    team: [{ name: 'Dr. Samuel Mwangi', role: 'Principal investigator' }],
  }),
];

export function sampleTrials({ mine = false } = {}) {
  return SAMPLE_TRIALS.filter((t) => !mine || t.mine).map((t) => ({ ...t }));
}

/**
 * Sample registry / CTMS records, keyed by trial ID, used by "Register a trial" to
 * mimic pulling a trial's metadata from PACTR, ClinicalTrials.gov or the CTMS.
 * Replace `lookupTrialRecord` with a real API call later.
 */
export const SAMPLE_REGISTRY_RECORDS = {
  'CT-2025-28': {
    source: 'Institution CTMS', title: 'Efficacy and safety of novel antimalarial compound XYZ-401 in adults with uncomplicated Plasmodium falciparum malaria', shortTitle: 'XYZ-401 adult malaria',
    phase: 'Phase II', studyType: 'Interventional', condition: 'Uncomplicated P. falciparum malaria', intervention: 'XYZ-401, oral 400 mg daily for 3 days',
    sponsor: 'Global Health Research Fund', targetEnrollment: 240, startDate: '2027-02-01', endDate: '2028-07-31', registryStatus: 'NOT_REGISTERED',
  },
  PACTR202611000123456: {
    source: 'PACTR', title: 'Heat-stable carbetocin versus oxytocin for preventing postpartum haemorrhage after vaginal birth in Kenyan county hospitals', shortTitle: 'Carbetocin for PPH',
    phase: 'Phase IV', studyType: 'Interventional', condition: 'Postpartum haemorrhage', intervention: 'Heat-stable carbetocin 100 µg IM',
    sponsor: 'Ministry of Health, Kenya', targetEnrollment: 1200, startDate: '2027-01-10', endDate: '2028-12-20', registryStatus: 'REGISTERED',
  },
  NCT06654321: {
    source: 'ClinicalTrials.gov', title: 'Point-of-care HbA1c testing to improve glycaemic control in type 2 diabetes in primary care: a cluster randomised trial', shortTitle: 'POC HbA1c in primary care',
    phase: 'Not applicable', studyType: 'Interventional', condition: 'Type 2 diabetes', intervention: 'Point-of-care HbA1c testing with same-day review',
    sponsor: 'University of Nairobi', targetEnrollment: 900, startDate: '2027-03-01', endDate: '2029-02-28', registryStatus: 'REGISTERED',
  },
};

export const normaliseTrialId = (id) => String(id || '').trim().toUpperCase().replace(/\s+/g, '');

/** Where an ID would be looked up, from its shape. */
export function trialIdSource(id) {
  const v = normaliseTrialId(id);
  if (/^PACTR\d{15}$/.test(v)) return 'PACTR';
  if (/^NCT\d{8}$/.test(v)) return 'ClinicalTrials.gov';
  if (/^CT-\d{4}-\d+$/.test(v)) return 'Institution CTMS';
  return null;
}

/** Look a trial up by ID. Returns { ok, record } or { ok:false, error }. */
export function lookupTrialRecord(id) {
  const v = normaliseTrialId(id);
  if (!v) return { ok: false, error: 'Enter a trial ID' };
  const source = trialIdSource(v);
  if (!source) return { ok: false, error: 'Use a PACTR number (PACTR + 15 digits), an NCT number (NCT + 8 digits) or a CTMS ID (CT-YYYY-NN)' };
  const record = SAMPLE_REGISTRY_RECORDS[v];
  if (!record) return { ok: false, error: `No record found for ${v} on ${source}. Fill in the details yourself.` };
  return { ok: true, id: v, record: { ...record, source } };
}

// ---- approvals, registry and team views ---------------------------------------------

export const GCP_STATUS = {
  VALID: { label: 'Valid', tone: 'success' },
  EXPIRING: { label: 'Expiring', tone: 'warning' },
  EXPIRED: { label: 'Expired', tone: 'danger' },
  MISSING: { label: 'No certificate', tone: 'danger' },
};

export function gcpState(expiry, now = new Date()) {
  if (!expiry) return 'MISSING';
  const left = daysUntil(expiry, now);
  if (left < 0) return 'EXPIRED';
  if (left <= 90) return 'EXPIRING';
  return 'VALID';
}

/** One row per approval (ethics and regulatory) of each open trial. */
export function approvalRows(trials, now = new Date()) {
  const rows = [];
  for (const t of trials) {
    if (!TRIAL_STATUS[t.status]?.open) continue;
    for (const [kind, a] of [['Ethics', t.ethics], ['Regulatory', t.regulatory]]) {
      if (kind === 'Regulatory' && a?.status === 'NOT_REQUIRED') continue;
      const state = approvalState(a, now);
      rows.push({
        id: `${t.id}-${kind}`, trial: t, kind, state,
        body: a?.committee || a?.authority || (kind === 'Ethics' ? 'Ethics committee not chosen' : 'Pharmacy and Poisons Board'),
        reference: a?.reference || null, expiry: a?.expiry || null, daysLeft: daysUntil(a?.expiry, now),
      });
    }
  }
  const rank = { EXPIRED: 0, EXPIRING: 1, NOT_STARTED: 2, PENDING: 3, REJECTED: 4, APPROVED: 5 };
  return rows.sort((a, b) => (rank[a.state] ?? 9) - (rank[b.state] ?? 9) || (a.daysLeft ?? 1e9) - (b.daysLeft ?? 1e9));
}

/** Registry position of each trial, with what to do next. */
export function registryRows(trials, now = new Date()) {
  return trials.map((t) => {
    const r = t.registry || { status: 'NOT_REGISTERED' };
    const running = ['RECRUITING', 'FOLLOW_UP'].includes(t.status);
    let action = null;
    let urgent = false;
    if (r.status === 'NOT_REGISTERED') {
      action = running ? 'Register now: recruitment has started' : 'Register before the first participant is enrolled';
      urgent = running;
    } else if (r.status === 'SUBMITTED') action = 'Waiting for the registry to issue a number';
    else if (r.status === 'RESULTS_DUE') {
      const left = daysUntil(r.resultsDue, now);
      action = left !== null && left < 0 ? `Results ${-left} days overdue` : `Post results by ${new Date(r.resultsDue).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}`;
      urgent = left !== null && left < 30;
    }
    return { id: t.id, trial: t, status: r.status, number: r.pactr || r.nct || null, registry: r.pactr ? 'PACTR' : r.nct ? 'ClinicalTrials.gov' : null, action, urgent };
  });
}

/** One row per person per trial, with GCP state. */
export function teamRows(trials, now = new Date()) {
  const rows = [];
  for (const t of trials) {
    if (!TRIAL_STATUS[t.status]?.open) continue;
    for (const m of t.team || []) {
      rows.push({ id: `${t.id}-${m.name}`, trial: t, ...m, duties: m.duties || [], gcp: gcpState(m.gcpExpiry, now), gcpDaysLeft: daysUntil(m.gcpExpiry, now) });
    }
  }
  const rank = { MISSING: 0, EXPIRED: 1, EXPIRING: 2, VALID: 3 };
  return rows.sort((a, b) => rank[a.gcp] - rank[b.gcp] || a.name.localeCompare(b.name));
}

// ---- safety and recruitment --------------------------------------------------------

/**
 * SAE reporting deadline to the ethics committee / regulator, counted from the day the
 * team became aware: 7 days for fatal or life-threatening events, 15 days otherwise.
 * Protocol deviations: report major ones within 7 days; minor ones go in the log.
 */
export function eventDeadline(ev) {
  if (!ev?.awareOn) return null;
  const days = ev.type === 'SAE' ? (['Fatal', 'Life-threatening'].includes(ev.severity) ? 7 : 15) : ev.severity === 'Major' ? 7 : null;
  if (days === null) return null;
  const d = new Date(ev.awareOn);
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

export function eventState(ev, now = new Date()) {
  if (ev.status === 'CLOSED') return 'CLOSED';
  if (ev.status === 'REPORTED') return 'REPORTED';
  const due = eventDeadline(ev);
  if (!due) return 'OPEN';
  const left = daysUntil(due, now);
  if (left < 0) return 'OVERDUE';
  if (left <= 3) return 'DUE_SOON';
  return 'TO_REPORT';
}

export const EVENT_STATE = {
  OVERDUE: { label: 'Report overdue', tone: 'danger' },
  DUE_SOON: { label: 'Report due soon', tone: 'warning' },
  TO_REPORT: { label: 'To report', tone: 'info' },
  OPEN: { label: 'Open', tone: 'progress' },
  REPORTED: { label: 'Reported', tone: 'success' },
  CLOSED: { label: 'Closed', tone: 'neutral' },
};

export function safetyCounts(trial, now = new Date()) {
  const evs = trial?.events || [];
  const states = evs.map((e) => [e, eventState(e, now)]);
  return {
    saesOpen: states.filter(([e, st]) => e.type === 'SAE' && st !== 'CLOSED').length,
    overdue: states.filter(([, st]) => st === 'OVERDUE').length,
    deviationsOpen: states.filter(([e, st]) => e.type === 'DEVIATION' && st !== 'CLOSED').length,
    majorDeviations: states.filter(([e, st]) => e.type === 'DEVIATION' && e.severity === 'Major' && st !== 'CLOSED').length,
  };
}

export function eventRows(trials, now = new Date()) {
  const rank = { OVERDUE: 0, DUE_SOON: 1, TO_REPORT: 2, OPEN: 3, REPORTED: 4, CLOSED: 5 };
  return trials.flatMap((t) => (t.events || []).map((e) => ({ ...e, trial: t, state: eventState(e, now), deadline: eventDeadline(e), daysLeft: daysUntil(eventDeadline(e), now) })))
    .sort((a, b) => rank[a.state] - rank[b.state] || (a.daysLeft ?? 1e9) - (b.daysLeft ?? 1e9));
}

/** Recruitment position: on track / behind / ahead, and what's needed per month. */
export function recruitmentRow(trial, now = new Date()) {
  const { target, enrolled, pct } = enrolment(trial);
  const expected = expectedEnrolmentPct(trial, now);
  const end = trial.recruitmentEnd || trial.endDate;
  const monthsLeft = end ? Math.max(0, (new Date(end) - now) / (DAY * 30.44)) : null;
  const remaining = Math.max(0, target - enrolled);
  let pace = 'NOT_STARTED';
  if (trial.status === 'SUSPENDED') pace = 'PAUSED';
  else if (enrolled >= target && target) pace = 'COMPLETE';
  else if (expected === null || expected === 0) pace = enrolled ? 'ON_TRACK' : 'NOT_STARTED';
  else if (expected - pct > 20) pace = 'BEHIND';
  else if (pct - expected > 10) pace = 'AHEAD';
  else pace = 'ON_TRACK';
  return { trial, target, enrolled, pct, expected, remaining, perMonth: monthsLeft && remaining ? Math.ceil(remaining / Math.max(monthsLeft, 0.5)) : null, pace };
}

export const PACE = {
  BEHIND: { label: 'Behind plan', tone: 'danger' },
  ON_TRACK: { label: 'On track', tone: 'success' },
  AHEAD: { label: 'Ahead of plan', tone: 'success' },
  NOT_STARTED: { label: 'Not started', tone: 'neutral' },
  PAUSED: { label: 'Paused', tone: 'warning' },
  COMPLETE: { label: 'Target reached', tone: 'success' },
};

export function recruitmentRows(trials, now = new Date()) {
  const rank = { BEHIND: 0, PAUSED: 1, ON_TRACK: 2, AHEAD: 3, NOT_STARTED: 4, COMPLETE: 5 };
  return trials.filter((t) => ['RECRUITING', 'FOLLOW_UP', 'SUSPENDED', 'APPROVED'].includes(t.status)).map((t) => recruitmentRow(t, now)).sort((a, b) => rank[a.pace] - rank[b.pace]);
}

/** Every attention flag across trials, for the research office's compliance view. */
export function complianceRows(trials, now = new Date()) {
  const rank = { high: 0, medium: 1, low: 2 };
  return trials.flatMap((t) => trialFlags(t, now).map((f) => ({ ...f, id: `${t.id}-${f.key}`, trial: t }))).sort((a, b) => rank[a.severity] - rank[b.severity]);
}

// ---- results, outputs and documents ------------------------------------------------

export const OUTPUT_TYPES = ['Publication', 'Dataset', 'Results summary', 'Policy brief', 'Conference abstract'];

/** Sample outputs linked to trials. */
export const SAMPLE_OUTPUTS = [
  { id: 'out-1', trialId: 'ct-007', type: 'Publication', title: 'Maternal iron supplementation and infant neurodevelopment at 12 months: a randomised trial', venue: 'The Lancet Global Health', date: '2026-06-02', doi: '10.1016/S2214-109X(26)00123-4' },
  { id: 'out-2', trialId: 'ct-007', type: 'Dataset', title: 'Maternal iron trial: de-identified participant data', venue: 'Zenodo', date: '2026-07-15', doi: '10.5281/zenodo.1234567' },
  { id: 'out-3', trialId: 'ct-008', type: 'Results summary', title: 'Zinc adjunct for severe pneumonia: summary results', venue: 'ClinicalTrials.gov', date: '2025-12-01', url: 'https://clinicaltrials.gov/study/NCT05987654' },
  { id: 'out-4', trialId: 'ct-008', type: 'Publication', title: 'Futility of zinc adjunct therapy in childhood severe pneumonia: interim analysis', venue: 'BMJ Global Health', date: '2026-03-20', doi: '10.1136/bmjgh-2026-012345' },
  { id: 'out-5', trialId: 'ct-001', type: 'Conference abstract', title: 'Early safety of XYZ-401 in adults with malaria', venue: 'ASTMH 2026', date: '2026-10-30' },
];

export function outputsFor(trialId, outputs = SAMPLE_OUTPUTS) {
  return outputs.filter((o) => o.trialId === trialId);
}

/**
 * Results position of each trial: what has been produced and what's still owed
 * (registry summary results within 12 months of completion; a publication).
 */
export function resultsRows(trials, outputs = SAMPLE_OUTPUTS, now = new Date()) {
  return trials.map((t) => {
    const outs = outputsFor(t.id, outputs);
    const closed = !TRIAL_STATUS[t.status]?.open;
    const r = t.registry || {};
    const resultsDue = r.status === 'RESULTS_DUE' ? r.resultsDue : null;
    const left = daysUntil(resultsDue, now);
    let next = null;
    let tone = 'neutral';
    if (resultsDue) { next = left < 0 ? `Registry results ${-left} days overdue` : `Post registry results by ${new Date(resultsDue).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}`; tone = left < 30 ? 'danger' : 'warning'; }
    else if (closed && !outs.some((o) => o.type === 'Publication')) { next = 'Publish the main results'; tone = 'warning'; }
    else if (closed) { next = 'Done'; tone = 'success'; }
    else next = outs.length ? 'Interim outputs only' : 'Trial still running';
    return { id: t.id, trial: t, outputs: outs, publications: outs.filter((o) => o.type === 'Publication').length, datasets: outs.filter((o) => o.type === 'Dataset').length, closed, next, tone };
  });
}

export const DOC_TYPES = ['Protocol', 'Informed consent form', 'Participant information sheet', "Investigator's brochure", 'Ethics approval letter', 'Regulatory approval', 'Case report form', 'Monitoring report', 'Delegation log'];

/** Sample trial master file documents, built from the sample trials. */
export function sampleDocuments(trials = SAMPLE_TRIALS) {
  const docs = [];
  for (const t of trials) {
    if (t.status === 'DRAFT') continue;
    const base = t.startDate || '2026-01-01';
    const add = (type, version, status, date, extra = {}) => docs.push({ id: `${t.id}-${type}-${version}`, trialId: t.id, trial: t, type, name: `${t.code} ${type} v${version}`, version, status, date, ...extra });
    add('Protocol', '1.0', 'SUPERSEDED', base);
    add('Protocol', '2.0', t.status === 'IN_APPROVAL' ? 'AWAITING_APPROVAL' : 'CURRENT', t.ethics?.expiry ? base : null);
    add('Informed consent form', '3.0', t.status === 'IN_APPROVAL' ? 'AWAITING_APPROVAL' : 'CURRENT', base, { language: 'English, Kiswahili' });
    if (t.ethics?.status === 'APPROVED') add('Ethics approval letter', '1', 'CURRENT', base, { expiry: t.ethics.expiry });
    if (t.regulatory?.status === 'APPROVED') add('Regulatory approval', '1', 'CURRENT', base, { expiry: t.regulatory.expiry });
    if (['RECRUITING', 'FOLLOW_UP', 'SUSPENDED'].includes(t.status)) add('Delegation log', '4', 'CURRENT', '2026-11-01');
  }
  return docs;
}

export const DOC_STATUS = {
  CURRENT: { label: 'Current', tone: 'success' },
  AWAITING_APPROVAL: { label: 'Awaiting approval', tone: 'info' },
  SUPERSEDED: { label: 'Superseded', tone: 'neutral' },
  EXPIRED: { label: 'Expired', tone: 'danger' },
};

export function documentState(doc, now = new Date()) {
  if (doc.status === 'CURRENT' && doc.expiry && daysUntil(doc.expiry, now) < 0) return 'EXPIRED';
  return doc.status;
}
