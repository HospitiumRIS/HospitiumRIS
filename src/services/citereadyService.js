/**
 * Client-side helper for the CiteReady integration. All calls go to our own
 * Next.js API routes (src/app/api/citeready/*, src/app/api/settings/citeready)
 * which proxy to CiteReady server-side, so no token ever reaches the browser.
 */

export const getCiteReadyStatus = async () => {
  const res = await fetch('/api/settings/citeready', { credentials: 'include' });
  if (!res.ok) {
    return { isConfigured: false, oauthAvailable: false };
  }
  return res.json();
};

export const connectCiteReadyWithPassword = async ({ email, password, environment = 'testing' }) => {
  const res = await fetch('/api/citeready/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ email, password, environment }),
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || 'Failed to connect to CiteReady');
  }
  return data;
};

export const disconnectCiteReady = async () => {
  const res = await fetch('/api/settings/citeready', { method: 'DELETE', credentials: 'include' });
  if (!res.ok) {
    throw new Error('Failed to disconnect CiteReady');
  }
  return res.json();
};

export const fetchCiteReadyFolders = async () => {
  const res = await fetch('/api/citeready/folders', { credentials: 'include' });
  const data = await res.json();
  if (!res.ok) {
    const err = new Error(data.error || 'Failed to fetch CiteReady folders');
    err.code = data.code;
    throw err;
  }
  return data.record;
};

export const fetchCiteReadyItems = async ({ folderID, q, page = 0, pageSize = 50 } = {}) => {
  const params = new URLSearchParams();
  if (folderID) params.set('folderID', String(folderID));
  if (q) params.set('q', q);
  params.set('page', String(page));
  params.set('pageSize', String(pageSize));

  const res = await fetch(`/api/citeready/items?${params}`, { credentials: 'include' });
  const data = await res.json();
  if (!res.ok) {
    const err = new Error(data.error || 'Failed to fetch CiteReady items');
    err.code = data.code;
    throw err;
  }
  return data; // { publications, total }
};

/**
 * Flatten a CiteReady folder tree (as returned by /api/v1/folders) into a
 * simple list for a dropdown, matching the "All Items" + collections shape
 * ZoteroImport already uses.
 */
export const flattenCiteReadyFolders = (record) => {
  const flat = [{ folderID: 1, folderName: 'All Items', depth: 0 }];

  const walk = (folder, depth) => {
    if (!folder) return;
    (folder.folders || []).forEach((child) => {
      flat.push({ folderID: child.folderID, folderName: child.folderName, depth });
      walk(child, depth + 1);
    });
  };

  walk(record, 1);
  return flat;
};
