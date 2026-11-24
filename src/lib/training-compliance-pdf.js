/**
 * Training compliance PDF report (#140). Server-side, jsPDF, A4 landscape so the
 * people × requirements matrix fits.
 */

import { jsPDF } from 'jspdf';
import { REQUIREMENT_STATE_LABELS } from './training-requirements.js';

const PURPLE = [139, 108, 188];
const DARK = [30, 41, 59];
const MUTED = [100, 116, 139];
const CELL = {
  COMPLIANT: [220, 252, 231], EXPIRING: [254, 243, 199], DUE: [224, 231, 255], OVERDUE: [254, 226, 226],
  EXPIRED: [254, 226, 226], MISSING: [241, 245, 249], EXEMPT: [243, 240, 249], NOT_REQUIRED: [255, 255, 255],
};
const show = (v, suffix = '') => (v === null || v === undefined ? '-' : `${v}${suffix}`);
const fmt = (v) => (v ? new Date(v).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' }) : '-');

/**
 * @param {{ data, institution?, generatedAt? }} args  data = loadCompliance() result
 * @returns {Buffer}
 */
export function renderCompliancePdf({ data, institution, generatedAt = new Date() }) {
  const doc = new jsPDF({ unit: 'mm', format: 'a4', orientation: 'landscape' });
  const W = 297;
  const H = 210;
  const M = 12;
  const BOTTOM = H - 12;
  let y = 0;

  const header = () => {
    doc.setFillColor(...PURPLE);
    doc.rect(0, 0, W, 22, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(15);
    doc.text('Training compliance', M, 10.5);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.text([institution, `As of ${fmt(generatedAt)}`].filter(Boolean).join('  ·  '), M, 17);
    y = 30;
  };
  const ensure = (h) => { if (y + h > BOTTOM) { doc.addPage(); header(); } };
  const heading = (text) => {
    ensure(14);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11.5);
    doc.setTextColor(...DARK);
    doc.text(text, M, y);
    y += 6;
  };
  const table = (cols, rows, fill = null) => {
    const drawHead = () => {
      doc.setFillColor(243, 240, 249);
      doc.rect(M, y - 4.2, W - 2 * M, 6.4, 'F');
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8);
      doc.setTextColor(...DARK);
      let x = M + 1.5;
      for (const c of cols) { doc.text(doc.splitTextToSize(c.label, c.w - 2)[0], c.align === 'right' ? x + c.w - 3 : x, y, { align: c.align || 'left' }); x += c.w; }
      y += 5.5;
      doc.setFont('helvetica', 'normal');
    };
    ensure(14);
    drawHead();
    if (!rows.length) { doc.setTextColor(...MUTED); doc.text('None', M + 1.5, y); y += 6; return; }
    for (const row of rows) {
      const cells = cols.map((c) => doc.splitTextToSize(String(row[c.key] ?? '-'), c.w - 3));
      const h = Math.max(...cells.map((c) => c.length)) * 3.6 + 1.8;
      if (y + h > BOTTOM) { doc.addPage(); header(); drawHead(); }
      let x = M;
      if (fill) cols.forEach((c) => { const color = fill(row, c); if (color) { doc.setFillColor(...color); doc.rect(x, y - 3.6, c.w, h, 'F'); } x += c.w; });
      doc.setFontSize(8);
      doc.setTextColor(...DARK);
      x = M + 1.5;
      cols.forEach((c, i) => { doc.text(cells[i], c.align === 'right' ? x + c.w - 3 : x, y, { align: c.align || 'left' }); x += c.w; });
      y += h;
      doc.setDrawColor(226, 232, 240);
      doc.line(M, y - 3.4, W - M, y - 3.4);
    }
    y += 3;
  };

  header();
  const t = data.matrix.totals;
  const prev = data.previousPercent;
  const change = t.percent !== null && prev !== null && prev !== undefined ? Math.round((t.percent - prev) * 10) / 10 : null;
  const assigned = data.assigned?.totals || {};
  const tiles = [
    ['Compliant', show(t.percent, '%'), change === null ? 'no earlier data' : `${change > 0 ? '+' : ''}${change} pt vs last month`],
    ['Overdue', show(t.OVERDUE + (assigned.overdue || 0)), 'requirements + assigned'],
    ['Not done or expired', show(t.MISSING + t.EXPIRED), 'not enrolled'],
    ['Expiring in 30 days', show(t.EXPIRING), 'still compliant'],
    ['Exempt', show(t.EXEMPT), 'left out of the %'],
  ];
  const tw = (W - 2 * M - 4 * 3) / 5;
  tiles.forEach(([label, value, sub], i) => {
    const x = M + i * (tw + 3);
    doc.setFillColor(...PURPLE);
    doc.roundedRect(x, y, tw, 20, 2, 2, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.text(label, x + 3, y + 5);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(15);
    doc.text(value, x + 3, y + 12.5);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.text(sub, x + 3, y + 17.2);
  });
  y += 27;

  if (data.attention?.length) {
    heading(`Needs attention (${data.attention.length})`);
    doc.setFontSize(8.8);
    for (const a of data.attention.slice(0, 10)) {
      ensure(6);
      doc.setFillColor(...(a.severity === 'high' ? [185, 28, 28] : a.severity === 'medium' ? [217, 119, 6] : MUTED));
      doc.circle(M + 1.5, y - 1.2, 1, 'F');
      doc.setTextColor(...DARK);
      doc.text(a.title, M + 4.5, y);
      y += 5.2;
    }
    y += 2;
  }

  heading('By requirement');
  table([
    { key: 'title', label: 'Requirement', w: 70 },
    { key: 'scope', label: 'Applies to', w: 55 },
    { key: 'valid', label: 'Valid for', w: 22 },
    { key: 'required', label: 'Required', w: 18, align: 'right' },
    { key: 'COMPLIANT', label: 'Compliant', w: 20, align: 'right' },
    { key: 'EXPIRING', label: 'Expiring', w: 18, align: 'right' },
    { key: 'DUE', label: 'Enrolled', w: 18, align: 'right' },
    { key: 'OVERDUE', label: 'Overdue', w: 18, align: 'right' },
    { key: 'gaps', label: 'Not done', w: 18, align: 'right' },
    { key: 'pct', label: '%', w: 16, align: 'right' },
  ], data.matrix.byRequirement.map((r) => ({
    ...r,
    scope: r.departments.length ? r.departments.join(', ') : 'Everyone',
    valid: r.validityMonths ? `${r.validityMonths} months` : 'No expiry',
    gaps: r.MISSING + r.EXPIRED,
    pct: show(r.percent, '%'),
  })));

  heading('By department');
  table([
    { key: 'key', label: 'Department', w: 90 },
    { key: 'people', label: 'People', w: 25, align: 'right' },
    { key: 'required', label: 'Required', w: 25, align: 'right' },
    { key: 'compliant', label: 'Compliant', w: 25, align: 'right' },
    { key: 'overdue', label: 'Overdue', w: 25, align: 'right' },
    { key: 'gaps', label: 'Not done', w: 25, align: 'right' },
    { key: 'pct', label: '%', w: 20, align: 'right' },
  ], data.matrix.byDepartment.map((d) => ({ ...d, pct: show(d.percent, '%') })));

  const reqs = data.requirements.filter((r) => r.isActive).slice(0, 8);
  const rows = data.matrix.rows.filter((r) => Object.values(r.cells).some((c) => c.state !== 'NOT_REQUIRED'));
  if (reqs.length && rows.length) {
    doc.addPage();
    header();
    heading(`Compliance matrix (${rows.length} people${data.requirements.filter((r) => r.isActive).length > 8 ? ', first 8 requirements' : ''})`);
    const rest = W - 2 * M - 60 - 40 - 14;
    const cw = rest / reqs.length;
    table([
      { key: 'name', label: 'Name', w: 60 },
      { key: 'department', label: 'Department', w: 40 },
      ...reqs.map((r) => ({ key: `r:${r.id}`, label: r.title, w: cw, req: r.id })),
      { key: 'pct', label: '%', w: 14, align: 'right' },
    ], rows.map((row) => ({
      ...row,
      department: row.department || '-',
      pct: show(row.percent, '%'),
      ...Object.fromEntries(reqs.map((r) => {
        const c = row.cells[r.id];
        if (c.state === 'NOT_REQUIRED') return [`r:${r.id}`, ''];
        const extra = c.until ? ` ${fmt(c.until)}` : c.dueDate ? ` ${fmt(c.dueDate)}` : '';
        return [`r:${r.id}`, `${REQUIREMENT_STATE_LABELS[c.state]}${extra}`];
      })),
    })), (row, col) => (col.req ? CELL[row.cells[col.req].state] : null));
  }

  const overdue = (data.assigned?.people || []).filter((p) => p.state === 'OVERDUE');
  if (overdue.length) {
    heading(`Overdue assigned trainings (${overdue.length})`);
    table([
      { key: 'name', label: 'Name', w: 60 },
      { key: 'department', label: 'Department', w: 45 },
      { key: 'trainingTitle', label: 'Training', w: 110 },
      { key: 'due', label: 'Due', w: 30 },
      { key: 'days', label: 'Days late', w: 28, align: 'right' },
    ], overdue.slice(0, 200).map((p) => ({ ...p, department: p.department || '-', due: fmt(p.dueDate), days: p.daysLeft === null ? '-' : Math.abs(p.daysLeft) })));
  }

  const pages = doc.getNumberOfPages();
  for (let i = 1; i <= pages; i += 1) {
    doc.setPage(i);
    doc.setFontSize(7.5);
    doc.setTextColor(...MUTED);
    doc.text(`Generated ${fmt(generatedAt)} · HospitiumRIS · page ${i} of ${pages}`, W / 2, H - 6, { align: 'center' });
  }
  return Buffer.from(doc.output('arraybuffer'));
}
