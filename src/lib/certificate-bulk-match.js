/**
 * Bulk certificate upload matching (#100). Pure: works on file names only, so the
 * browser can preview the match before uploading anything.
 */

export const BULK_LIMITS = { maxFiles: 200, maxFileBytes: 5 * 1024 * 1024 };
export const ALLOWED_EXTENSIONS = ['pdf', 'png', 'jpg', 'jpeg'];

/** Last path segment only: names from a ZIP can carry folders or "../". */
export function baseName(name) {
  return String(name || '').split(/[\\/]/).pop().trim();
}

export function extensionOf(name) {
  const m = /\.([a-z0-9]+)$/i.exec(baseName(name));
  return m ? m[1].toLowerCase() : '';
}

/** Files in a ZIP worth considering: not folders, not macOS/Windows clutter. */
export function isCandidateZipEntry(path) {
  const p = String(path || '');
  if (!p || p.endsWith('/')) return false;
  if (p.startsWith('__MACOSX/') || p.includes('/__MACOSX/')) return false;
  const name = baseName(p);
  return !name.startsWith('.') && name.toLowerCase() !== 'thumbs.db' && name.toLowerCase() !== 'desktop.ini';
}

const tokens = (text) => String(text || '')
  .toLowerCase()
  .normalize('NFKD')
  .replace(/[̀-ͯ]/g, '')
  .split(/[^a-z0-9]+/)
  .filter(Boolean);

function emailInName(stem) {
  const direct = /[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}/i.exec(stem);
  if (direct) return direct[0].toLowerCase();
  const at = /([a-z0-9._%+-]+)_at_([a-z0-9.-]+\.[a-z]{2,})/i.exec(stem);
  return at ? `${at[1]}@${at[2]}`.toLowerCase() : null;
}

/** "file,email" CSV (header optional) -> Map(lowercased base name -> email). */
export function parseMappingCsv(text) {
  const map = new Map();
  for (const raw of String(text || '').split(/\r?\n/)) {
    const line = raw.trim();
    if (!line) continue;
    const [file, email] = line.split(/[,;\t]/).map((x) => x.trim().replace(/^"|"$/g, ''));
    if (!file || !email || !email.includes('@')) continue; // skips the header row too
    map.set(baseName(file).toLowerCase(), email.toLowerCase());
  }
  return map;
}

/**
 * @param {Array<{ name: string, size: number }>} files
 * @param {Array<{ registrationId, email, givenName, familyName, status, hasCertificate }>} participants
 * @param {{ mappingCsv?: string }} [options]
 * @returns {{ ok: true, rows, counts } | { ok: false, error }}
 *   row.result: matched | ambiguous | unmatched | not_completed | duplicate | invalid
 */
export function planBulkUpload(files, participants, { mappingCsv = '' } = {}) {
  if (!Array.isArray(files) || files.length === 0) return { ok: false, error: 'Add some certificate files' };
  if (files.length > BULK_LIMITS.maxFiles) return { ok: false, error: `Up to ${BULK_LIMITS.maxFiles} files at a time` };

  const mapping = parseMappingCsv(mappingCsv);
  const byEmail = new Map(participants.map((p) => [String(p.email || '').toLowerCase(), p]));
  const named = participants.map((p) => ({ p, words: [...new Set([...tokens(p.givenName), ...tokens(p.familyName)])].filter((w) => w.length >= 2) }));

  const used = new Map(); // registrationId -> first file name
  const rows = files.map((f) => {
    const name = baseName(f.name);
    const row = { name, size: f.size, result: 'unmatched', registrationId: null, candidates: [], how: null, reason: null };
    const ext = extensionOf(name);
    if (!ALLOWED_EXTENSIONS.includes(ext)) return { ...row, result: 'invalid', reason: `.${ext || '?'} files are not accepted (PDF, PNG or JPEG)` };
    if (!f.size) return { ...row, result: 'invalid', reason: 'Empty file' };
    if (f.size > BULK_LIMITS.maxFileBytes) return { ...row, result: 'invalid', reason: 'Larger than 5 MB' };

    const stem = name.replace(/\.[^.]+$/, '');
    let participant = null;
    const mapped = mapping.get(name.toLowerCase());
    if (mapped) {
      participant = byEmail.get(mapped) || null;
      row.how = 'mapping';
      if (!participant) return { ...row, reason: `${mapped} (from the mapping file) is not a participant` };
    }
    if (!participant) {
      const email = emailInName(stem);
      if (email && byEmail.has(email)) {
        participant = byEmail.get(email);
        row.how = 'email';
      }
    }
    if (!participant) {
      const fileWords = new Set(tokens(stem));
      const hits = named
        .map(({ p, words }) => ({ p, score: words.length && words.every((w) => fileWords.has(w)) ? words.length : 0 }))
        .filter((h) => h.score > 0)
        .sort((a, b) => b.score - a.score);
      if (hits.length === 1 || (hits.length > 1 && hits[0].score > hits[1].score)) {
        participant = hits[0].p;
        row.how = 'name';
      } else if (hits.length > 1) {
        return { ...row, result: 'ambiguous', candidates: hits.filter((h) => h.score === hits[0].score).map((h) => h.p.registrationId), reason: 'Matches more than one participant' };
      }
    }
    if (!participant) return { ...row, reason: 'No participant matches this file name' };

    if (participant.status !== 'COMPLETED') {
      return { ...row, result: 'not_completed', registrationId: participant.registrationId, reason: 'Participant has not completed the training' };
    }
    if (used.has(participant.registrationId)) {
      return { ...row, result: 'duplicate', registrationId: participant.registrationId, reason: `Same participant as ${used.get(participant.registrationId)}` };
    }
    used.set(participant.registrationId, name);
    return { ...row, result: 'matched', registrationId: participant.registrationId, replaces: Boolean(participant.hasCertificate) };
  });

  const counts = {};
  for (const r of rows) counts[r.result] = (counts[r.result] || 0) + 1;
  return { ok: true, rows, counts };
}

/** Does the content look like the type its extension claims? (magic bytes) */
export function sniffMatchesExtension(bytes, name) {
  const b = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes);
  const ext = extensionOf(name);
  if (ext === 'pdf') return b[0] === 0x25 && b[1] === 0x50 && b[2] === 0x44 && b[3] === 0x46; // %PDF
  if (ext === 'png') return b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4e && b[3] === 0x47;
  if (ext === 'jpg' || ext === 'jpeg') return b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff;
  return false;
}
