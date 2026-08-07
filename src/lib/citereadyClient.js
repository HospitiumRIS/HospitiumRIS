/**
 * Server-side CiteReady API client.
 *
 * Wraps the CiteReady Third-Party Integration Guide (Read-Only) v2:
 * - Part 1, Option A: password login (POST /auth/login -> APIPara bearer token)
 * - Part 2: read-only Items / Folders / Search endpoints
 * - Part 1, Option B: OAuth 2.0 / OIDC (scaffolded, needs real client credentials)
 *
 * Kept server-only so tokens never touch the browser and so we don't depend
 * on CiteReady's CORS policy for browser-side fetches.
 */

const ENVIRONMENTS = {
  testing: 'https://dev-api.citeready.com',
  production: 'https://apiv2.citeready.com',
};

export function getBaseUrl(environment = 'testing') {
  // Per-request environment choice wins; CITEREADY_BASE_URL is only a manual
  // override for local testing against a non-standard endpoint.
  return ENVIRONMENTS[environment] || process.env.CITEREADY_BASE_URL || ENVIRONMENTS.testing;
}

/**
 * Option A: Password login. Returns a bearer token (APIPara) good for ~7 days.
 * Per the guide, this is a login token for the read-only API only -- it is
 * NOT an OIDC token and should not be used against /oauth/userinfo.
 */
export async function loginWithPassword({ email, password, environment = 'testing' }) {
  const baseUrl = getBaseUrl(environment);

  const body = new URLSearchParams();
  body.set('email', email);
  body.set('password', password);

  const res = await fetch(`${baseUrl}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: body.toString(),
  });

  const data = await res.json().catch(() => ({}));

  if (!res.ok || data.Status !== 'success' || !data.APIPara) {
    const message = data.error_description || data.message || 'CiteReady login failed. Check your email and password.';
    throw new Error(message);
  }

  // Token is issued with a 7-day expiration per the guide.
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

  return { token: data.APIPara, expiresAt };
}

/**
 * GET /api/v1/folders
 */
export async function getFolders({ token, environment = 'testing' }) {
  const baseUrl = getBaseUrl(environment);
  const res = await authedFetch(`${baseUrl}/api/v1/folders`, token);
  return res.record || null;
}

/**
 * GET /api/v1/items
 */
export async function getItems({ token, environment = 'testing', folderID = 1, recursive = false, page = 0, pageSize = 50 }) {
  const baseUrl = getBaseUrl(environment);
  const params = new URLSearchParams({
    folderID: String(folderID),
    recursive: String(Boolean(recursive)),
    page: String(page),
    pageSize: String(Math.min(pageSize, 200)),
    type: 'csl',
  });
  const res = await authedFetch(`${baseUrl}/api/v1/items?${params}`, token);
  return { items: res.items || [], total: res.total || 0, totalPages: res.totalPages || 0 };
}

/**
 * GET /api/v1/search
 */
export async function searchItems({ token, environment = 'testing', q, folderID, page = 0, pageSize = 50 }) {
  const baseUrl = getBaseUrl(environment);
  const params = new URLSearchParams({
    q: q || '',
    page: String(page),
    pageSize: String(Math.min(pageSize, 200)),
    type: 'csl',
  });
  if (folderID) params.set('folderID', String(folderID));
  const res = await authedFetch(`${baseUrl}/api/v1/search?${params}`, token);
  return { items: res.items || [], total: res.total || 0 };
}

async function authedFetch(url, token) {
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` },
  });

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    if (res.status === 401) {
      const err = new Error('CiteReady session expired. Please reconnect.');
      err.code = 'CITEREADY_UNAUTHORIZED';
      throw err;
    }
    throw new Error(data.error_description || data.error || `CiteReady request failed (${res.status})`);
  }

  return data;
}

/**
 * Map a CiteReady CSL-JSON item to this app's publication shape (same shape
 * the Zotero/PubMed/etc. import tabs produce, so it flows through the same
 * /api/publications/import endpoint unchanged).
 */
export function mapCslItemToPublication(item) {
  const authors = (item.author || [])
    .map((a) => (a.literal ? a.literal : `${a.given || ''} ${a.family || ''}`.trim()))
    .filter(Boolean);

  const year = item.issued?.['date-parts']?.[0]?.[0] || null;

  return {
    id: item.id || item.uuid || item.itemid,
    title: item.title || 'Untitled',
    type: mapCslType(item.type),
    authors,
    journal: item['container-title'] || null,
    year,
    doi: item.DOI || null,
    isbn: item.ISBN || null,
    url: item.URL || null,
    abstract: item.abstract || '',
    keywords: [],
    volume: item.volume || null,
    pages: item.page || null,
    publisher: item.publisher || null,
    source: 'CiteReady',
    citereadyUuid: item.uuid || null,
    citereadyItemId: item.itemid || null,
    citereadyAccessCode: item.accesscode || null,
  };
}

function mapCslType(cslType) {
  const mapping = {
    'article-journal': 'article',
    'paper-conference': 'conference',
    'chapter': 'book-chapter',
    'book': 'book',
    'thesis': 'thesis',
    'report': 'report',
    'webpage': 'other',
    'patent': 'other',
    'article-preprint': 'preprint',
  };
  return mapping[cslType] || 'other';
}
