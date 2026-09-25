/**
 * Extract StoredFile id from `/api/files/{id}` reference URLs.
 */
export function parseStoredFileUrl(url) {
  if (!url || typeof url !== 'string') return null;
  const match = url.match(/^\/api\/files\/([^/?#]+)/);
  return match ? match[1] : null;
}
