/**
 * Compliance summary PDF built from the live /api/institution/analytics/compliance payload.
 */
const fmtPct = (v) => (v === null || v === undefined ? 'n/a' : `${v}%`);
const fmtDate = (v) => (v ? new Date(v).toLocaleDateString('en-US', { dateStyle: 'medium' }) : 'n/a');

export async function generateComplianceReportPdf(reportId, reportTitle, data) {
  if (!data) throw new Error('Compliance data is not loaded yet');
  const { jsPDF } = await import('jspdf');
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 18;
  const maxWidth = pageWidth - margin * 2;
  let y = 20;

  const ensure = (needed = 10) => { if (y + needed > 278) { doc.addPage(); y = 20; } };
  const section = (title) => {
    ensure(20);
    y += 2;
    doc.setFontSize(12);
    doc.setFont(undefined, 'bold');
    doc.setTextColor(109, 84, 153);
    doc.text(title, margin, y);
    doc.setDrawColor(226, 232, 240);
    doc.line(margin, y + 2, pageWidth - margin, y + 2);
    doc.setTextColor(0, 0, 0);
    y += 9;
  };
  const line = (label, value) => {
    const lines = doc.splitTextToSize(String(value), maxWidth - 66);
    const labelLines = doc.splitTextToSize(String(label), 62);
    const h = Math.max(lines.length, labelLines.length) * 5 + 3;
    ensure(h);
    doc.setFontSize(9.5);
    doc.setFont(undefined, 'bold');
    doc.text(labelLines, margin, y);
    doc.setFont(undefined, 'normal');
    doc.text(lines, margin + 66, y);
    y += h;
  };
  const para = (text) => {
    doc.setFontSize(9);
    doc.setFont(undefined, 'normal');
    const lines = doc.splitTextToSize(text, maxWidth);
    ensure(lines.length * 5 + 3);
    doc.text(lines, margin, y);
    y += lines.length * 5 + 3;
  };

  doc.setFillColor(139, 108, 188);
  doc.rect(0, 0, pageWidth, 34, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(15);
  doc.setFont(undefined, 'bold');
  doc.text(`${data.institution?.name || 'Institution'}: compliance report`, margin, 15);
  doc.setFontSize(10);
  doc.setFont(undefined, 'normal');
  doc.text(reportTitle || 'Compliance summary', margin, 26);
  doc.setTextColor(0, 0, 0);
  y = 44;
  para(`Reporting period ${fmtDate(data.range.start)} to ${fmtDate(data.range.end)}. Generated ${new Date().toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' })}.`);

  const o = data.overview;
  section('Summary');
  line('Compliance health score', o.healthScore === null ? 'n/a' : `${o.healthScore} / 100`);
  line('Active portfolio', `${o.portfolio} proposals (${o.fullyCompliant} fully compliant)`);
  line('Ethics clearance', `${fmtPct(o.clearanceRate)} (${o.cleared} cleared)`);
  line('Awaiting ethics decision', `${o.pending} (${o.overdueReviews} past the ${data.thresholds.reviewSlaDays}-day target)`);
  line('Clearances expired / expiring', `${o.expired} expired, ${o.expiringSoon} within ${data.thresholds.expiryWarningDays} days`);
  line('Overdue funder obligations', o.overdueGrantItems);
  line('Ethics review time', o.medianReviewDays === null ? 'n/a' : `median ${o.medianReviewDays} days, average ${o.averageReviewDays} days`);

  section('Action required');
  if (data.actions.length) {
    data.actions.forEach((a) => {
      line(`[${a.severity.toUpperCase()}] ${a.title}`, `${a.detail} Next step: ${a.action}.`);
      (a.items || []).slice(0, 8).forEach((item) => line('', `• ${item.title} (${item.principalInvestigator || 'PI not set'})`));
    });
  } else {
    para('No open compliance issues for this period.');
  }

  section('Requirement coverage');
  data.requirements.forEach((r) => line(r.label, r.applicable ? `${fmtPct(r.rate)} (${r.met} of ${r.applicable})` : 'Not applicable'));

  section('Ethics status');
  data.ethicsBreakdown.forEach((e) => line(e.label, e.count));

  if (data.committees.length) {
    section('Committees');
    data.committees.forEach((c) => line(c.committee, `${c.total} applications, ${c.approved} approved, ${c.pending} pending, ${c.rejected} rejected; median review ${c.medianReviewDays ?? 'n/a'} days`));
  }

  if (data.departments.length) {
    section('Departments');
    data.departments.forEach((d) => line(d.department, `score ${d.score}; ${d.proposals} proposals; ethics ${fmtPct(d.clearanceRate)}; DMP ${fmtPct(d.dmpRate)}`));
  }

  if (data.grantObligations.length) {
    section('Funder obligations');
    data.grantObligations.slice(0, 30).forEach((ob) => line(ob.item, `${ob.grant} (${ob.grantor}): ${ob.dueDate ? `due ${fmtDate(ob.dueDate)}` : 'action needed'}${ob.overdue ? ', OVERDUE' : ''}`));
  }

  const pages = doc.getNumberOfPages();
  for (let i = 1; i <= pages; i += 1) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(120, 120, 120);
    doc.text(`HospitiumRIS · live institutional data · page ${i} of ${pages}`, margin, 290);
  }
  doc.save(`compliance-report-${data.range.start.slice(0, 10)}-to-${data.range.end.slice(0, 10)}.pdf`);
}
