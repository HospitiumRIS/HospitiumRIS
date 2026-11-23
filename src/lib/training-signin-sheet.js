/**
 * Printable sign-in sheet for one session (#95), built with jsPDF (works in Node).
 */

import { jsPDF } from 'jspdf';

const PURPLE = [139, 108, 188];

function local(date, timeZone, options) {
  return new Intl.DateTimeFormat('en-GB', { timeZone, ...options }).format(new Date(date));
}

const fullName = (user) => [user?.givenName, user?.familyName].filter(Boolean).join(' ') || user?.email || '';

/**
 * @param {object} args
 * @param {object} args.training     { title, institutionName? }
 * @param {object} args.session      { title, startsAt, endsAt, venue? }
 * @param {object[]} args.participants  [{ user: { givenName, familyName, email } }]
 * @param {string} [args.timeZone]
 * @returns {Buffer}
 */
export function buildSignInSheetPdf({ training, session, participants, timeZone = 'Africa/Nairobi' }) {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  const margin = 14;
  const cols = [
    { label: '#', w: 10 },
    { label: 'Name', w: 52 },
    { label: 'Email', w: 58 },
    { label: 'Time in', w: 20 },
    { label: 'Signature', w: pageW - margin * 2 - 140 },
  ];
  const rowH = 9;

  const sorted = [...(participants || [])].sort((a, b) =>
    `${a.user?.familyName || ''} ${a.user?.givenName || ''}`.localeCompare(`${b.user?.familyName || ''} ${b.user?.givenName || ''}`)
  );
  // A few blank lines for walk-ins.
  const lines = [...sorted.map((p) => ({ name: fullName(p.user), email: p.user?.email || '' })), ...Array(5).fill({ name: '', email: '' })];

  const dateLine = `${local(session.startsAt, timeZone, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })} · ${local(session.startsAt, timeZone, { hour: '2-digit', minute: '2-digit' })} – ${local(session.endsAt, timeZone, { hour: '2-digit', minute: '2-digit' })}`;

  const header = () => {
    doc.setFillColor(...PURPLE);
    doc.rect(0, 0, pageW, 4, 'F');
    doc.setTextColor(30, 16, 53);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(15);
    doc.text('Attendance sign-in sheet', margin, 16);
    doc.setFontSize(11);
    doc.text(doc.splitTextToSize(training.title || '', pageW - margin * 2)[0], margin, 23);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.text(`${session.title}  ·  ${dateLine}`, margin, 29);
    if (session.venue) doc.text(`Venue: ${session.venue}`, margin, 34);
    let x = margin;
    const y = session.venue ? 40 : 35;
    doc.setFillColor(243, 240, 250);
    doc.rect(margin, y, pageW - margin * 2, rowH, 'F');
    doc.setFont('helvetica', 'bold');
    for (const c of cols) {
      doc.text(c.label, x + 2, y + 6);
      x += c.w;
    }
    doc.setFont('helvetica', 'normal');
    return y + rowH;
  };

  const footer = (page, pages) => {
    doc.setFontSize(9);
    doc.setTextColor(100, 116, 139);
    doc.text('Facilitator name and signature: ______________________________', margin, pageH - 12);
    doc.text(`Page ${page} of ${pages}`, pageW - margin, pageH - 12, { align: 'right' });
    doc.setTextColor(30, 16, 53);
  };

  let y = header();
  const bottom = pageH - 20;
  lines.forEach((line, i) => {
    if (y + rowH > bottom) {
      doc.addPage();
      y = header();
    }
    let x = margin;
    doc.setDrawColor(226, 232, 240);
    doc.rect(margin, y, pageW - margin * 2, rowH);
    const values = [line.name || line.email ? String(i + 1) : '', line.name, line.email, '', ''];
    doc.setFontSize(9.5);
    cols.forEach((c, idx) => {
      if (idx > 0) doc.line(x, y, x, y + rowH);
      const text = doc.splitTextToSize(values[idx] || '', c.w - 3)[0] || '';
      doc.text(text, x + 2, y + 6);
      x += c.w;
    });
    y += rowH;
  });

  const pages = doc.getNumberOfPages();
  for (let p = 1; p <= pages; p += 1) {
    doc.setPage(p);
    footer(p, pages);
  }

  return Buffer.from(doc.output('arraybuffer'));
}
