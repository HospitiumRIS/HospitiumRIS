export const INSTITUTION_MODULE_KEYS = [
  'publications',
  'projects',
  'clinical_trials',
  'image_integrity',
  'training',
  'administration',
  'analytics',
];

export const INSTITUTION_MODULES = [
  {
    key: 'publications',
    labelKey: 'institution.publications',
    defaultLabel: 'Publications',
    description: 'Manuscripts, proposals, and publication tracking',
  },
  {
    key: 'projects',
    labelKey: 'institution.projects',
    defaultLabel: 'Projects',
    description: 'Proposal review, ethics, and project tracking',
  },
  {
    key: 'clinical_trials',
    labelKey: 'institution.clinical_trials',
    defaultLabel: 'Clinical Trials',
    description: 'Trial portfolio, compliance, and operations',
  },
  {
    key: 'image_integrity',
    labelKey: 'institution.image_integrity',
    defaultLabel: 'Image Integrity',
    description: 'Integrity reports and usage oversight',
  },
  {
    key: 'training',
    labelKey: 'institution.training',
    defaultLabel: 'Training',
    description: 'Training programmes and certificates',
  },
  {
    key: 'administration',
    labelKey: 'institution.administration',
    defaultLabel: 'Administration',
    description: 'Researchers, users, and review automation',
  },
  {
    key: 'analytics',
    labelKey: 'institution.analytics',
    defaultLabel: 'Reports & Analytics',
    description: 'Institutional metrics and reports',
  },
];

export function defaultEnabledModules() {
  return [...INSTITUTION_MODULE_KEYS];
}

export function normalizeEnabledModules(value) {
  if (!Array.isArray(value)) {
    return defaultEnabledModules();
  }
  const allowed = new Set(INSTITUTION_MODULE_KEYS);
  return value.filter((key) => typeof key === 'string' && allowed.has(key));
}

export function resolveUserEnabledModules(user) {
  const raw = user?.institution?.enabledModules ?? user?.secondaryInstitution?.enabledModules;
  if (!Array.isArray(raw)) {
    return null;
  }
  return normalizeEnabledModules(raw);
}
