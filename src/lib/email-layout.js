/**
 * Shared branded email layout (decision D7, #97). Pure: builds HTML and plain text;
 * sending stays in src/lib/email.js. Same look as the account emails: logo, white card,
 * purple button, muted footer. Every value is escaped here, so callers pass plain text.
 */

export const BRAND_PURPLE = '#8b6cbc';

export function escapeHtml(value) {
  return String(value ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

function safeUrl(url) {
  const value = String(url || '');
  return /^https?:\/\//i.test(value) ? value : '';
}

/**
 * @param {object} email
 * @param {string} email.title        <title> and heading
 * @param {string} [email.preheader]  inbox preview text
 * @param {string} [email.greeting]   e.g. "Hi Jane,"
 * @param {string[]} [email.paragraphs]
 * @param {Array<[string, string]>} [email.details]  label/value rows in a grey box
 * @param {{ url: string, label: string }} [email.action]
 * @param {string} [email.note]       small text under the button
 * @param {string} [email.footer]
 * @param {string} email.baseUrl
 * @returns {{ html: string, text: string }}
 */
export function renderBrandedEmail({ title, preheader, greeting, paragraphs = [], details = [], action, note, footer, baseUrl }) {
  const base = String(baseUrl || '').replace(/\/$/, '');
  const url = safeUrl(action?.url);
  const p = (text) => `<p style="color:#374151;font-size:15px;line-height:1.6;margin:0 0 16px 0;">${escapeHtml(text)}</p>`;
  const detailRows = details.filter(([, v]) => v !== null && v !== undefined && v !== '');
  const detailHtml = detailRows.length
    ? `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f9fafb;border-radius:6px;margin:0 0 24px 0;">${detailRows
      .map(([k, v]) => `<tr><td style="padding:8px 16px;color:#6b7280;font-size:13px;width:34%;vertical-align:top;">${escapeHtml(k)}</td><td style="padding:8px 16px;color:#111827;font-size:14px;font-weight:600;">${escapeHtml(v)}</td></tr>`)
      .join('')}</table>`
    : '';

  const html = `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>${escapeHtml(title)}</title></head>
<body style="margin:0;padding:0;font-family:'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;background-color:#f8f9fa;">
  ${preheader ? `<div style="display:none;max-height:0;overflow:hidden;opacity:0;">${escapeHtml(preheader)}</div>` : ''}
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="padding:40px 20px;">
    <tr><td align="center">
      <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">
        <tr><td align="center" style="padding:0 0 32px 0;"><img src="${escapeHtml(base)}/hospitium-logo.png" alt="HospitiumRIS" style="max-width:160px;height:auto;" /></td></tr>
        <tr><td style="background:#ffffff;border-radius:8px;border:1px solid #e5e7eb;border-top:4px solid ${BRAND_PURPLE};padding:40px;">
          <h1 style="color:#111827;font-size:22px;font-weight:600;margin:0 0 16px 0;">${escapeHtml(title)}</h1>
          ${greeting ? p(greeting) : ''}
          ${paragraphs.map(p).join('\n          ')}
          ${detailHtml}
          ${url ? `<a href="${escapeHtml(url)}" style="display:inline-block;background:${BRAND_PURPLE};color:#ffffff;text-decoration:none;padding:12px 24px;border-radius:6px;font-weight:600;font-size:14px;">${escapeHtml(action.label || 'Open HospitiumRIS')}</a>` : ''}
          ${note ? `<p style="color:#6b7280;font-size:13px;line-height:1.6;margin:24px 0 0 0;">${escapeHtml(note)}</p>` : ''}
        </td></tr>
        <tr><td align="center" style="padding:24px 0 0 0;color:#9ca3af;font-size:12px;">${escapeHtml(footer || 'This message was sent by HospitiumRIS. You can change email notifications in your profile settings.')}</td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;

  const text = [
    title,
    '',
    greeting,
    ...paragraphs,
    ...(detailRows.length ? ['', ...detailRows.map(([k, v]) => `${k}: ${v}`)] : []),
    ...(url ? ['', `${action.label || 'Open HospitiumRIS'}: ${url}`] : []),
    ...(note ? ['', note] : []),
  ].filter((line) => line !== undefined && line !== null).join('\n');

  return { html, text };
}
