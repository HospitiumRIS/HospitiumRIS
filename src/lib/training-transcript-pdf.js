/**
 * Training transcript PDF (#108). Server-side, jsPDF. A4 portrait, one row per
 * training, with totals and CPD per accreditation body.
 */

import { jsPDF } from 'jspdf';
import { TRANSCRIPT_STATUS_LABELS } from './training-transcript.js';

const PURPLE = [139, 108, 188];
const fmt = (v) => (v ? new Date(v).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' }) : '-');

/**
 * @param {{ person: { name, email, institution? }, rows, totals, cpd, yearLabel, generatedAt? }} args
 * @returns {Buffer}
 */
export function renderTranscriptPdf({ person, rows, totals, cpd, yearLabel, generatedAt = new Date() }) {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  const W = 210;
  const M = 14;
  let y = 0;

  const header = () => {
    doc.setFillColor(...PURPLE);
    doc.rect(0, 0, W, 26, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(16);
    doc.text('Training transcript', M, 12);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9.5);
    doc.text([person.name, person.email, person.institution].filter(Boolean).join('  ·  '), M, 19);
    doc.text(yearLabel, W - M, 12, { align: 'right' });
    doc.setTextColor(30, 41, 59);
    y = 34;
  };
  const footer = () => {
    const pages = doc.getNumberOfPages();
    for (let i = 1; i <= pages; i += 1) {
      doc.setPage(i);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(100, 116, 139);
      doc.text(`Generated ${fmt(generatedAt)} by HospitiumRIS. Certificates can be checked at /verify/certificate.`, M, 290);
      doc.text(`Page ${i} of ${pages}`, W - M, 290, { align: 'right' });
    }
  };

  header();

  // Totals
  doc.setFontSize(9);
  const boxes = [
    ['Trainings', String(totals.trainings)],
    ['Completed', String(totals.completed)],
    ['Contact hours', String(totals.contactHours)],
    ['CPD hours', String(totals.cpdHours)],
    ['CPD points', String(totals.cpdPoints)],
  ];
  const bw = (W - 2 * M - 4 * 3) / 5;
  boxes.forEach(([label, value], i) => {
    const x = M + i * (bw + 3);
    doc.setDrawColor(226, 232, 240);
    doc.roundedRect(x, y, bw, 16, 2, 2, 'S');
    doc.setTextColor(100, 116, 139);
    doc.setFont('helvetica', 'normal');
    doc.text(label, x + 3, y + 5.5);
    doc.setTextColor(30, 41, 59);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(13);
    doc.text(value, x + 3, y + 12.5);
    doc.setFontSize(9);
  });
  y += 24;

  // Table
  const cols = [
    { key: 'title', label: 'Training', w: 62 },
    { key: 'dates', label: 'Dates', w: 30 },
    { key: 'status', label: 'Status', w: 21 },
    { key: 'hours', label: 'Hours', w: 13 },
    { key: 'cpd', label: 'CPD', w: 18 },
    { key: 'cert', label: 'Certificate', w: 38 },
  ];
  const drawHead = () => {
    doc.setFillColor(243, 240, 249);
    doc.rect(M, y - 4.5, W - 2 * M, 7, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(30, 41, 59);
    let x = M + 1.5;
    for (const c of cols) { doc.text(c.label, x, y); x += c.w; }
    y += 6;
    doc.setFont('helvetica', 'normal');
  };
  drawHead();
  if (!rows.length) {
    doc.setTextColor(100, 116, 139);
    doc.text('No trainings in this period.', M + 1.5, y + 2);
    y += 8;
  }
  for (const r of rows) {
    const cells = {
      title: doc.splitTextToSize([r.title, r.code].filter(Boolean).join(' · '), cols[0].w - 2),
      dates: doc.splitTextToSize(`${fmt(r.startDate)} – ${fmt(r.endDate)}`, cols[1].w - 2),
      status: doc.splitTextToSize(`${TRANSCRIPT_STATUS_LABELS[r.status] || r.status}${r.completedAt && r.status === 'COMPLETED' ? `\n${fmt(r.completedAt)}` : ''}`, cols[2].w - 2),
      hours: [String(r.contactHours || 0)],
      cpd: doc.splitTextToSize([r.cpdHours ? `${r.cpdHours} h` : null, r.cpdPoints ? `${r.cpdPoints} pts` : null].filter(Boolean).join('\n') || '-', cols[4].w - 2),
      cert: doc.splitTextToSize([r.certificateNumber, r.accreditationBody].filter(Boolean).join('\n') || '-', cols[5].w - 2),
    };
    const lines = Math.max(...Object.values(cells).map((c) => c.length));
    const h = lines * 3.8 + 2.5;
    if (y + h > 280) {
      doc.addPage();
      header();
      drawHead();
    }
    doc.setFontSize(8.5);
    doc.setTextColor(30, 41, 59);
    let x = M + 1.5;
    for (const c of cols) { doc.text(cells[c.key], x, y); x += c.w; }
    y += h;
    doc.setDrawColor(241, 245, 249);
    doc.line(M, y - 3.5, W - M, y - 3.5);
  }

  // CPD by accreditation body
  if (cpd.length) {
    if (y + 12 + cpd.length * 5 > 280) { doc.addPage(); header(); }
    y += 4;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.text('CPD by year and accreditation body', M, y);
    y += 6;
    doc.setFontSize(9);
    for (const c of cpd) {
      doc.setFont('helvetica', 'normal');
      doc.text(`${c.year}  ·  ${c.body}`, M + 1.5, y);
      doc.setFont('helvetica', 'bold');
      doc.text(`${c.hours} h${c.points ? ` · ${c.points} pts` : ''}  (${c.trainings} training${c.trainings === 1 ? '' : 's'})`, W - M, y, { align: 'right' });
      y += 5;
    }
  }

  footer();
  return Buffer.from(doc.output('arraybuffer'));
}
