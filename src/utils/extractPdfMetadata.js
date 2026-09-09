/**
 * Best-effort extraction of DOI / authors / title / subject from a PDF
 * by scanning the raw file bytes (Info dictionary + common text patterns).
 * Not a full PDF parser — works for many publisher PDFs, fails gracefully.
 */

const DOI_REGEX = /\b(10\.\d{4,9}\/[-._;()/:A-Z0-9]+)\b/gi;

function decodePdfLiteral(raw = '') {
  return raw
    .replace(/\\([nrtbf()\\])/g, (_, ch) => {
      const map = { n: '\n', r: '\r', t: '\t', b: '\b', f: '\f', '(': '(', ')': ')', '\\': '\\' };
      return map[ch] ?? ch;
    })
    .replace(/\\(\d{1,3})/g, (_, oct) => String.fromCharCode(parseInt(oct, 8)))
    .trim();
}

function findInfoField(text, fieldName) {
  // /Author (John Doe) — simple literal string (handles common escaped chars)
  const litRe = new RegExp(`/${fieldName}\\s*\\(([\\s\\S]*?)\\)(?=\\s*[/%]|\\s*>>)`, 'i');
  const lit = text.match(litRe);
  if (lit?.[1] != null) {
    return decodePdfLiteral(lit[1]);
  }

  const hex = text.match(new RegExp(`/${fieldName}\\s*<([0-9A-Fa-f]+)>`, 'i'));
  if (hex?.[1]) {
    try {
      const bytes = hex[1].match(/.{1,2}/g)?.map((b) => parseInt(b, 16)) || [];
      // UTF-16BE BOM FE FF
      if (bytes[0] === 0xfe && bytes[1] === 0xff) {
        let out = '';
        for (let i = 2; i + 1 < bytes.length; i += 2) {
          out += String.fromCharCode((bytes[i] << 8) | bytes[i + 1]);
        }
        return out.trim();
      }
      return new TextDecoder('utf-8').decode(Uint8Array.from(bytes)).replace(/\0/g, '').trim();
    } catch {
      return '';
    }
  }

  return '';
}

function splitAuthors(authorField) {
  if (!authorField) return [];
  return authorField
    .split(/\s*;\s*|\s+and\s+|\s*,\s*(?=[A-Z][^,]*(?:\s+[A-Z]|$))/i)
    .map((a) => a.replace(/\s+/g, ' ').trim())
    .filter((a) => a.length > 1 && a.length < 120);
}

function pickBestDoi(candidates = []) {
  const cleaned = [
    ...new Set(
      candidates
        .map((d) => d.replace(/[.,;:)\]}>]+$/g, '').trim())
        .filter((d) => /^10\.\d{4,9}\//.test(d))
    ),
  ];
  // Prefer longer / more specific DOIs
  cleaned.sort((a, b) => b.length - a.length);
  return cleaned[0] || '';
}

/**
 * @param {File|Blob} file
 * @returns {Promise<{ doi: string, authors: string[], title: string, description: string, source: string }>}
 */
export async function extractPdfMetadata(file) {
  const empty = { doi: '', authors: [], title: '', description: '', source: 'pdf' };
  if (!file) return empty;

  const name = (file.name || '').toLowerCase();
  if (!name.endsWith('.pdf') && file.type !== 'application/pdf') return empty;

  // Read up to ~2MB from the start — enough for Info dict + first-page DOI text
  const maxBytes = Math.min(file.size || 0, 2 * 1024 * 1024);
  const buffer = await file.slice(0, maxBytes || file.size).arrayBuffer();
  const text = new TextDecoder('latin1').decode(buffer);

  const infoAuthor = findInfoField(text, 'Author');
  const infoTitle = findInfoField(text, 'Title');
  const infoSubject = findInfoField(text, 'Subject');

  const doiMatches = text.match(DOI_REGEX) || [];
  const doi = pickBestDoi(doiMatches);

  const authors = splitAuthors(infoAuthor);

  return {
    doi,
    authors,
    title: infoTitle && infoTitle.toLowerCase() !== 'untitled' ? infoTitle : '',
    description: infoSubject || '',
    source: 'pdf',
  };
}

export function normalizeDoi(doi = '') {
  return doi.trim().replace(/^https?:\/\/(dx\.)?doi\.org\//i, '');
}
