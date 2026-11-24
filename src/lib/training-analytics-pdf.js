/**
 * Training analytics PDF report (#138). Server-side, jsPDF, A4 portrait.
 */

import { jsPDF } from 'jspdf';

const PURPLE = [139, 108, 188];
const DARK = [30, 41, 59];
const MUTED = [100, 116, 139];
const RED = [185, 28, 28];
const show = (v, suffix = '') => (v === null || v === undefined ? '-' : `${v}${suffix}`);
const fmt = (v) => new Date(v).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' });

function changeText(c) {
  if (!c || c.change === null) return 'no earlier data';
  const sign = c.change > 0 ? '+' : '';
  return `${sign}${c.change}${c.unit === 'pt' ? ' pt' : '%'} vs previous`;
}

/**
 * @param {{ report, institution, filtersLabel, generatedAt? }} args
 * @returns {Buffer}
 */
export function renderAnalyticsPdf({ report, institution, filtersLabel, generatedAt = new Date() }) {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  const W = 210;
  const M = 14;
  let y = 0;

  const header = () => {
    doc.setFillColor(...PURPLE);
    doc.rect(0, 0, W, 24, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(15);
    doc.text('Training analytics', M, 11);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.text([institution, `${fmt(report.period.from)} – ${fmt(report.period.to)}`].filter(Boolean).join('  ·  '), M, 18);
    if (filtersLabel) doc.text(filtersLabel, W - M, 18, { align: 'right' });
    y = 32;
  };
  const ensure = (h) => {
    if (y + h > 282) {
      doc.addPage();
      header();
    }
  };
  const heading = (text) => {
    ensure(14);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11.5);
    doc.setTextColor(...DARK);
    doc.text(text, M, y);
    y += 6;
  };
  const table = (cols, rows) => {
    const drawHead = () => {
      doc.setFillColor(243, 240, 249);
      doc.rect(M, y - 4.2, W - 2 * M, 6.4, 'F');
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8.3);
      doc.setTextColor(...DARK);
      let x = M + 1.5;
      for (const c of cols) { doc.text(c.label, c.align === 'right' ? x + c.w - 3 : x, y, { align: c.align || 'left' }); x += c.w; }
      y += 5.5;
      doc.setFont('helvetica', 'normal');
    };
    ensure(14);
    drawHead();
    if (!rows.length) {
      doc.setTextColor(...MUTED);
      doc.text('No data', M + 1.5, y);
      y += 6;
      return;
    }
    for (const row of rows) {
      const cells = cols.map((c) => doc.splitTextToSize(String(row[c.key] ?? '-'), c.w - 3));
      const h = Math.max(...cells.map((c) => c.length)) * 3.7 + 1.8;
      if (y + h > 282) { doc.addPage(); header(); drawHead(); }
      doc.setFontSize(8.3);
      doc.setTextColor(...DARK);
      let x = M + 1.5;
      cols.forEach((c, i) => { doc.text(cells[i], c.align === 'right' ? x + c.w - 3 : x, y, { align: c.align || 'left' }); x += c.w; });
      y += h;
      doc.setDrawColor(241, 245, 249);
      doc.line(M, y - 3.2, W - M, y - 3.2);
    }
    y += 3;
  };

  header();

  // KPI tiles (purple, like the page)
  const k = report.kpis;
  const c = report.comparison || {};
  const tiles = [
    ['Trainings run', show(k.trainings), c.trainings],
    ['Enrolments', show(k.enrolments), c.enrolments],
    ['Attendance', show(k.attendanceRate, '%'), c.attendanceRate],
    ['No-shows', show(k.noShowRate, '%'), c.noShowRate],
    ['Completion', show(k.completionRate, '%'), c.completionRate],
    ['Certificates', show(k.certificates), c.certificates],
    ['CPD hours', show(k.cpdHours), c.cpdHours],
    ['Fill rate', show(report.capacity?.fillRate, '%'), null],
  ];
  const tw = (W - 2 * M - 3 * 3) / 4;
  tiles.forEach(([label, value, cmp], i) => {
    const x = M + (i % 4) * (tw + 3);
    const ty = y + Math.floor(i / 4) * 23;
    doc.setFillColor(...PURPLE);
    doc.roundedRect(x, ty, tw, 20, 2, 2, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.text(label, x + 3, ty + 5);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(15);
    doc.text(value, x + 3, ty + 12.5);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    if (cmp !== null) doc.text(changeText(cmp), x + 3, ty + 17.2);
  });
  y += 2 * 23 + 4;

  // Needs attention
  if (report.attention?.length) {
    heading(`Needs attention (${report.attention.length})`);
    doc.setFontSize(8.8);
    for (const a of report.attention.slice(0, 12)) {
      ensure(6);
      doc.setFillColor(...(a.severity === 'high' ? RED : a.severity === 'medium' ? [217, 119, 6] : MUTED));
      doc.circle(M + 1.5, y - 1.2, 1, 'F');
      doc.setTextColor(...DARK);
      doc.setFont('helvetica', 'bold');
      doc.text(a.title, M + 4.5, y);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(...MUTED);
      doc.text(doc.splitTextToSize(a.detail || '', 95)[0] || '', 110, y);
      y += 5.2;
    }
    if (report.attention.length > 12) {
      doc.text(`and ${report.attention.length - 12} more on the analytics page`, M + 4.5, y);
      y += 5;
    }
    y += 3;
  }

  // Feedback, compliance, capacity, gain summary line
  heading('At a glance');
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(...DARK);
  const glance = [
    `Feedback: ${show(k.averageRating)} average rating, NPS ${k.nps === null || k.nps === undefined ? '-' : k.nps}, ${k.feedbackResponses} responses`,
    `Mandatory: ${show(report.compliance?.percentCompliant, '%')} compliant, ${report.compliance?.overdue ?? 0} overdue of ${report.compliance?.assigned ?? 0} assigned`,
    report.capacity ? `Capacity: ${report.capacity.taken} of ${report.capacity.offered} places taken, ${report.capacity.waitlisted} waiting, ${report.capacity.pending} awaiting approval, ${report.capacity.cancelled} cancelled` : null,
    report.prePost?.averageGain !== null && report.prePost?.averageGain !== undefined ? `Learning gain: +${report.prePost.averageGain} points from pre-test to post-test (${report.prePost.participants} participants)` : null,
  ].filter(Boolean);
  for (const line of glance) { ensure(5); doc.text(line, M, y); y += 5; }
  y += 3;

  heading('By month');
  table(
    [{ key: 'key', label: 'Month', w: 30 }, { key: 'trainings', label: 'Trainings', w: 22, align: 'right' }, { key: 'enrolments', label: 'Enrolments', w: 25, align: 'right' },
      { key: 'att', label: 'Attendance', w: 26, align: 'right' }, { key: 'comp', label: 'Completion', w: 26, align: 'right' }, { key: 'certificates', label: 'Certificates', w: 25, align: 'right' }, { key: 'cpdHours', label: 'CPD h', w: 28, align: 'right' }],
    (report.byMonth || []).map((m) => ({ ...m, att: show(m.attendanceRate, '%'), comp: show(m.completionRate, '%') })),
  );

  heading('By department');
  table(
    [{ key: 'key', label: 'Department', w: 52 }, { key: 'trainings', label: 'Trainings', w: 20, align: 'right' }, { key: 'enrolments', label: 'Enrolments', w: 24, align: 'right' },
      { key: 'att', label: 'Attendance', w: 24, align: 'right' }, { key: 'ns', label: 'No-show', w: 20, align: 'right' }, { key: 'comp', label: 'Completion', w: 24, align: 'right' }, { key: 'cpdHours', label: 'CPD h', w: 18, align: 'right' }],
    (report.byDepartment || []).map((m) => ({ ...m, att: show(m.attendanceRate, '%'), ns: show(m.noShowRate, '%'), comp: show(m.completionRate, '%') })),
  );

  if (report.facilitators?.length) {
    heading('Facilitators');
    table(
      [{ key: 'name', label: 'Facilitator', w: 70 }, { key: 'trainings', label: 'Trainings', w: 25, align: 'right' }, { key: 'sessionsHeld', label: 'Sessions', w: 25, align: 'right' },
        { key: 'att', label: 'Attendance', w: 32, align: 'right' }, { key: 'rating', label: 'Rating', w: 30, align: 'right' }],
      report.facilitators.map((f) => ({ ...f, att: show(f.attendanceRate, '%'), rating: show(f.averageRating) })),
    );
  }

  heading('Trainings');
  table(
    [{ key: 'title', label: 'Training', w: 66 }, { key: 'start', label: 'Start', w: 24 }, { key: 'enrolments', label: 'Enrol.', w: 16, align: 'right' },
      { key: 'att', label: 'Attend.', w: 19, align: 'right' }, { key: 'comp', label: 'Compl.', w: 19, align: 'right' }, { key: 'certificates', label: 'Certs', w: 18, align: 'right' }, { key: 'rating', label: 'Rating', w: 20, align: 'right' }],
    (report.trainings || []).map((t) => ({ ...t, start: fmt(t.startDate), att: show(t.attendanceRate, '%'), comp: show(t.completionRate, '%'), rating: show(t.averageRating) })),
  );

  ensure(10);
  doc.setFontSize(7.5);
  doc.setTextColor(...MUTED);
  doc.text(doc.splitTextToSize('Attendance counts present and late marks against every enrolment for every session held. No-shows are enrolments with no present or late mark. Completion is of decided outcomes. Changes compare with the previous period of the same length.', W - 2 * M), M, y);

  const pages = doc.getNumberOfPages();
  for (let i = 1; i <= pages; i += 1) {
    doc.setPage(i);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(...MUTED);
    doc.text(`Generated ${fmt(generatedAt)} by HospitiumRIS`, M, 290);
    doc.text(`Page ${i} of ${pages}`, W - M, 290, { align: 'right' });
  }
  return Buffer.from(doc.output('arraybuffer'));
}
