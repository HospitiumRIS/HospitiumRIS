/**
 * Module catalogue for operations monitoring.
 *
 * Maps any page path or API path to the product module it belongs to, and
 * normalises routes so record IDs never end up in usage telemetry. This is
 * the single place to update when a new area of the app is added.
 */

export const OPS_MODULES = [
  { key: 'publications', label: 'Publications', enablementKey: 'publications' },
  { key: 'projects', label: 'Projects & Proposals', enablementKey: 'projects' },
  { key: 'ethics', label: 'Ethics', enablementKey: 'projects' },
  { key: 'grants', label: 'Grants', enablementKey: 'projects' },
  { key: 'clinical_trials', label: 'Clinical Trials', enablementKey: 'clinical_trials' },
  { key: 'image_integrity', label: 'Image Integrity', enablementKey: 'image_integrity' },
  { key: 'training', label: 'Training', enablementKey: 'training' },
  { key: 'administration', label: 'Administration', enablementKey: 'administration' },
  { key: 'analytics', label: 'Reports & Analytics', enablementKey: 'analytics' },
  { key: 'ai_assistant', label: 'AI Assistant', enablementKey: null },
  { key: 'profile', label: 'Profile & Settings', enablementKey: null },
  { key: 'institution_admin', label: 'Institution Admin', enablementKey: null },
  { key: 'foundation', label: 'Foundation', enablementKey: null },
  { key: 'network', label: 'Research Network', enablementKey: null },
  { key: 'dashboard', label: 'Dashboard', enablementKey: null },
  { key: 'other', label: 'Other', enablementKey: null },
];

const MODULE_LABELS = Object.fromEntries(OPS_MODULES.map((m) => [m.key, m.label]));

export function moduleLabel(key) {
  return MODULE_LABELS[key] || key;
}

// Ordered: first match wins, so more specific prefixes come first.
const RULES = [
  // Never tracked
  [/^\/api\/(auth|telemetry|notifications|health|cron|global-admin)(\/|$)/, null],
  [/^\/global-admin(\/|$)/, null],
  [/^\/(login|register|activate|resend-activation|select-interface|auth)(\/|$)/, null],

  [/^\/api\/ai(\/|$)/, 'ai_assistant'],
  [/^\/api\/publications\/submit-africarxiv/, 'publications'],

  [/^\/(researcher|institution)\/publications(\/|$)/, 'publications'],
  [/^\/api\/(publications|manuscripts|citations|citeready|orcid)(\/|$)/, 'publications'],
  [/^\/api\/institution\/publications(\/|$)/, 'publications'],

  [/^\/(researcher|institution)\/ethics(\/|$)/, 'ethics'],
  [/^\/api\/(ethics|institution\/ethics)(\/|$)/, 'ethics'],

  [/^\/api\/(grants|researcher\/grant-tracker)(\/|$)/, 'grants'],

  [/^\/(researcher|institution)\/(projects|proposals)(\/|$)/, 'projects'],
  [/^\/api\/(proposals|institution\/projects|institution\/proposal-review-pipeline|researcher\/project-health)(\/|$)/, 'projects'],

  [/^\/(researcher|institution)\/clinical-trials(\/|$)/, 'clinical_trials'],

  [/^\/(researcher|institution)\/image-integrity(\/|$)/, 'image_integrity'],
  [/^\/api\/(institution|researcher)\/image-integrity(\/|$)/, 'image_integrity'],

  [/^\/(researcher|institution)\/training(\/|$)/, 'training'],
  [/^\/api\/training(\/|$)/, 'training'],

  [/^\/(researcher|institution)\/analytics(\/|$)/, 'analytics'],
  [/^\/api\/(institution|researcher)\/analytics(\/|$)/, 'analytics'],

  [/^\/institution\/(administration|users|researchers|researcher|domains)(\/|$)/, 'administration'],
  [/^\/api\/institution\/(auto-review|researchers|users)(\/|$)/, 'administration'],

  [/^\/institution-admin(\/|$)/, 'institution_admin'],
  [/^\/api\/institution-admin(\/|$)/, 'institution_admin'],

  [/^\/foundation(\/|$)/, 'foundation'],
  [/^\/api\/foundation(\/|$)/, 'foundation'],

  [/^\/api\/network(\/|$)/, 'network'],

  [/^\/(researcher|institution)\/(profile|settings)(\/|$)/, 'profile'],
  [/^\/api\/(researcher\/(profile|account|onboarding)|institution\/profile|settings)(\/|$)/, 'profile'],

  [/^\/(researcher|institution|dashboard)\/?$/, 'dashboard'],
  [/^\/api\/researcher\/(stats|activities|deadlines|tasks)(\/|$)/, 'dashboard'],

  [/^\/(researcher|institution)(\/|$)/, 'other'],
  [/^\/api\//, 'other'],
];

/**
 * @param {string} pathname - page or API path (query string is ignored)
 * @returns {string|null} module key, or null when the path must not be tracked
 */
export function resolveModule(pathname) {
  if (typeof pathname !== 'string' || !pathname.startsWith('/')) return null;
  const path = pathname.split('?')[0].split('#')[0];
  for (const [pattern, moduleKey] of RULES) {
    if (pattern.test(path)) return moduleKey;
  }
  return null; // public marketing pages etc.
}

const ID_SEGMENT = /^(?:[0-9]+|[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}|(?=[A-Za-z_-]*\d)[A-Za-z0-9_-]{20,}|\d{4}-\d{4}-\d{4}-\d{3}[\dX])$/i;

/**
 * Replace anything that looks like a record identifier with ":id" so usage
 * telemetry never stores which specific record a person opened.
 */
export function normalizeRoute(pathname) {
  if (typeof pathname !== 'string') return '/';
  const path = pathname.split('?')[0].split('#')[0] || '/';
  const segments = path
    .split('/')
    .filter(Boolean)
    .slice(0, 8)
    .map((segment) => {
      let decoded = segment;
      try {
        decoded = decodeURIComponent(segment);
      } catch {
        // keep raw
      }
      if (ID_SEGMENT.test(decoded) || decoded.includes('@') || decoded.length > 40) return ':id';
      return decoded.replace(/[^A-Za-z0-9._-]/g, '');
    });
  return `/${segments.join('/')}`.slice(0, 200);
}

export function actionFromMethod(method) {
  switch (String(method || '').toUpperCase()) {
    case 'POST':
      return 'CREATE';
    case 'PUT':
    case 'PATCH':
      return 'UPDATE';
    case 'DELETE':
      return 'DELETE';
    default:
      return null;
  }
}
