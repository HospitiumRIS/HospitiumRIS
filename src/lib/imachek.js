/**
 * ImaChek API Client
 * ------------------------------------------------------------------
 * Thin server-side wrapper around the ImaChek v1 external API
 * (Automatic Image Detection System for Research Integrity).
 *
 * Docs summary (see ImaChek_API_Documentation.pdf):
 *  - POST   /v1/external/analysis                Upload file(s), starts analysis, returns { case_id }
 *  - GET    /v1/external/analysis/{case_id}       Poll analysis status/results
 *  - POST   /v1/external/analysis/{case_id}       Cross-case comparison analysis
 *  - GET    /v1/external/case/lists               List all cases (pagination via rows/last_evaluated_key)
 *  - GET    /v1/external/case/{case_id}           Full case info (classification, counts, timestamps)
 *  - DELETE /v1/external/case/{case_id}           Delete a case (only once analysis is not in progress)
 *  - POST   /v1/external/report/{case_id}         Generate a temporary (5 min TTL) shareable report URL
 *
 * All requests require header `X-API-Key: {IMACHEK_API_KEY}`.
 * Base URL is regional and configured via `IMACHEK_API_URL`.
 *
 * Until real credentials are configured, every method throws an
 * `ImaChekNotConfiguredError` so calling API routes can surface a clear,
 * actionable message instead of a confusing network failure.
 */

const IMACHEK_API_URL = process.env.IMACHEK_API_URL || '';
const IMACHEK_API_KEY = process.env.IMACHEK_API_KEY || '';

export class ImaChekNotConfiguredError extends Error {
  constructor() {
    super(
      'ImaChek is not configured. Set IMACHEK_API_URL and IMACHEK_API_KEY in your environment to enable image integrity checks.'
    );
    this.name = 'ImaChekNotConfiguredError';
    this.code = 'IMACHEK_NOT_CONFIGURED';
  }
}

export class ImaChekApiError extends Error {
  constructor(message, status, details) {
    super(message);
    this.name = 'ImaChekApiError';
    this.status = status;
    this.details = details;
  }
}

export function isImaChekConfigured() {
  return Boolean(IMACHEK_API_URL && IMACHEK_API_KEY);
}

function assertConfigured() {
  if (!isImaChekConfigured()) {
    throw new ImaChekNotConfiguredError();
  }
}

function buildUrl(path, query) {
  const url = new URL(`${IMACHEK_API_URL.replace(/\/$/, '')}${path}`);
  if (query) {
    Object.entries(query).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        url.searchParams.set(key, value);
      }
    });
  }
  return url.toString();
}

async function parseResponse(response) {
  const text = await response.text();
  let json = null;
  try {
    json = text ? JSON.parse(text) : null;
  } catch {
    // Non-JSON response (e.g. HTML error page) - keep raw text for debugging
  }

  if (!response.ok) {
    const message =
      json?.message || json?.error || text || `ImaChek API request failed (${response.status})`;
    throw new ImaChekApiError(message, response.status, json);
  }

  return json;
}

/**
 * Upload file(s) to ImaChek and kick off analysis.
 * @param {Object} params
 * @param {string} params.title
 * @param {string} [params.contributor]
 * @param {Blob|File} params.file - single file (Images, PDF, or ZIP per ImaChek rules)
 * @param {string} [params.fileName]
 * @param {boolean} [params.compareGlobal] - compare against the ImaChek global repository
 */
export async function uploadFile({ title, contributor, file, fileName, compareGlobal }) {
  assertConfigured();

  const form = new FormData();
  form.append('title', title);
  if (contributor) form.append('contributor', contributor);
  form.append('file[]', file, fileName || file.name || 'upload');
  if (compareGlobal) form.append('repository[]', 'global');

  const response = await fetch(buildUrl('/v1/external/analysis'), {
    method: 'POST',
    headers: { 'X-API-Key': IMACHEK_API_KEY },
    body: form,
  });

  return parseResponse(response);
}

/** Poll analysis status/results for a case. */
export async function getAnalysisStatus(caseId) {
  assertConfigured();
  const response = await fetch(buildUrl(`/v1/external/analysis/${caseId}`), {
    method: 'GET',
    headers: { 'X-API-Key': IMACHEK_API_KEY },
  });
  return parseResponse(response);
}

/** Run a cross-case comparison analysis (max 10 cases). */
export async function compareCases(caseId, { repository = ['global'], case: cases }) {
  assertConfigured();
  const response = await fetch(buildUrl(`/v1/external/analysis/${caseId}`), {
    method: 'POST',
    headers: { 'X-API-Key': IMACHEK_API_KEY, 'Content-Type': 'application/json' },
    body: JSON.stringify({ repository, case: cases }),
  });
  return parseResponse(response);
}

/** List all cases for the configured ImaChek account. */
export async function getCaseLists({ startDate, endDate, rows, lastEvaluatedKey } = {}) {
  assertConfigured();
  const response = await fetch(
    buildUrl('/v1/external/case/lists', {
      start_date: startDate,
      end_date: endDate,
      rows,
      last_evaluated_key: lastEvaluatedKey,
    }),
    { method: 'GET', headers: { 'X-API-Key': IMACHEK_API_KEY } }
  );
  return parseResponse(response);
}

/** Full case info (classification, counts, timestamps). */
export async function getCaseInfo(caseId) {
  assertConfigured();
  const response = await fetch(buildUrl(`/v1/external/case/${caseId}`), {
    method: 'GET',
    headers: { 'X-API-Key': IMACHEK_API_KEY },
  });
  return parseResponse(response);
}

/** Delete a case (fails if analysis is still in progress). */
export async function deleteCase(caseId) {
  assertConfigured();
  const response = await fetch(buildUrl(`/v1/external/case/${caseId}`), {
    method: 'DELETE',
    headers: { 'X-API-Key': IMACHEK_API_KEY },
  });
  return parseResponse(response);
}

/** Generate a temporary (5 min TTL) shareable web report for a completed case. */
export async function generateReport(caseId, { title, contributor } = {}) {
  assertConfigured();
  const response = await fetch(buildUrl(`/v1/external/report/${caseId}`), {
    method: 'POST',
    headers: { 'X-API-Key': IMACHEK_API_KEY, 'Content-Type': 'application/json' },
    body: JSON.stringify({ title, contributor }),
  });
  return parseResponse(response);
}

const imachek = {
  isImaChekConfigured,
  uploadFile,
  getAnalysisStatus,
  compareCases,
  getCaseLists,
  getCaseInfo,
  deleteCase,
  generateReport,
  ImaChekNotConfiguredError,
  ImaChekApiError,
};

export default imachek;
