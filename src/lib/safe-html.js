/**
 * Rich-text fields (abstract, objectives, methodology...) are stored as editor HTML.
 * `sanitizeHtml` keeps a small allowlist of formatting tags with no attributes (links
 * keep a safe http(s)/mailto href), so the HTML can be rendered without scripts, event
 * handlers or styles. `htmlToText` gives plain text for tooltips, snippets and exports.
 */

const ALLOWED = new Set(['p', 'br', 'strong', 'b', 'em', 'i', 'u', 's', 'ul', 'ol', 'li', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'blockquote', 'sub', 'sup', 'a', 'code', 'pre', 'span', 'div', 'table', 'thead', 'tbody', 'tr', 'th', 'td', 'hr']);
const VOID = new Set(['br', 'hr']);

const ENTITIES = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ', '#39': "'", ndash: '–', mdash: '—', hellip: '…', rsquo: '’', lsquo: '‘', ldquo: '“', rdquo: '”', ge: '≥', le: '≤', alpha: 'α', kappa: 'κ', asymp: '≈', times: '×' };

export function decodeEntities(text) {
  return String(text ?? '').replace(/&(#x?[0-9a-f]+|[a-z]+[0-9]*);/gi, (match, code) => {
    const key = code.toLowerCase();
    if (key.startsWith('#x')) return String.fromCodePoint(parseInt(key.slice(2), 16) || 32);
    if (key.startsWith('#')) {
      const n = parseInt(key.slice(1), 10);
      return n === 39 ? "'" : String.fromCodePoint(n || 32);
    }
    return ENTITIES[key] ?? match;
  });
}

export const looksLikeHtml = (value) => typeof value === 'string' && /<\/?[a-z][^>]*>/i.test(value);

function safeHref(attrs) {
  const m = String(attrs || '').match(/href\s*=\s*("([^"]*)"|'([^']*)'|([^\s>]+))/i);
  const href = decodeEntities((m && (m[2] ?? m[3] ?? m[4])) || '').trim();
  return /^(https?:\/\/|mailto:)/i.test(href) ? href.replace(/"/g, '%22') : null;
}

export function sanitizeHtml(html) {
  if (!html) return '';
  let s = String(html)
    .replace(/<!--[\s\S]*?-->/g, '')
    .replace(/<(script|style|iframe|object|embed|noscript|template|svg|math)\b[\s\S]*?<\/\1\s*>/gi, '')
    .replace(/<(script|style|iframe|object|embed|noscript|template|svg|math)\b[^>]*>/gi, '');
  s = s.replace(/<\s*(\/?)\s*([a-z][a-z0-9]*)\b([^>]*)>/gi, (_, close, rawTag, attrs) => {
    const tag = rawTag.toLowerCase();
    if (!ALLOWED.has(tag)) return '';
    if (close) return VOID.has(tag) ? '' : `</${tag}>`;
    if (VOID.has(tag)) return `<${tag}>`;
    if (tag === 'a') {
      const href = safeHref(attrs);
      return href ? `<a href="${href}" target="_blank" rel="noopener noreferrer">` : '<a>';
    }
    return `<${tag}>`;
  });
  // Any '<' left over is text, not a tag.
  return s.replace(/<(?![a-z/])/gi, '&lt;');
}

export function htmlToText(html) {
  if (!html) return '';
  return decodeEntities(
    String(html)
      .replace(/<(script|style)\b[\s\S]*?<\/\1\s*>/gi, '')
      .replace(/<\s*(br|\/p|\/li|\/h[1-6]|\/div|\/tr)\s*\/?>/gi, '\n')
      .replace(/<li[^>]*>/gi, '• ')
      .replace(/<[^>]+>/g, ''),
  )
    .replace(/[ \t\f\v ]+/g, ' ')
    .replace(/\s*\n\s*/g, '\n')
    .replace(/\n{2,}/g, '\n')
    .trim();
}

export function isEmptyHtml(value) {
  return htmlToText(value) === '';
}

/** Plain-text snippet on one line, cut at a word boundary. */
export function snippet(html, max = 280) {
  const text = htmlToText(html).replace(/\s+/g, ' ');
  if (text.length <= max) return text;
  const cut = text.slice(0, max);
  return `${cut.slice(0, Math.max(cut.lastIndexOf(' '), max - 20)).trim()}…`;
}
