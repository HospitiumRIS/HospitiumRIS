/**
 * PDF export for the institution Dashboards & Reports.
 * Uses the live payload from /api/institution/analytics/reports (passed in by the
 * dashboard), so the PDF always matches what is on screen for the chosen period.
 */
const fmtPct = (value) => (value === null || value === undefined ? 'n/a' : `${value}%`);
const fmtDate = (value) => new Date(value).toLocaleDateString('en-US', { dateStyle: 'medium' });

export async function generateInstitutionReportPdf(reportId, reportTitle, data) {
  if (!data) throw new Error('Report data is not loaded yet');
  const { jsPDF } = await import('jspdf');

  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 18;
  const maxWidth = pageWidth - margin * 2;
  let y = 20;

  const ensureSpace = (needed = 10) => {
    if (y + needed > 278) {
      doc.addPage();
      y = 20;
    }
  };

  const addHeader = (title) => {
    doc.setFillColor(139, 108, 188);
    doc.rect(0, 0, pageWidth, 36, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(16);
    doc.setFont(undefined, 'bold');
    doc.text(`HospitiumRIS: ${data.institution?.name || 'Institution'} analytics`, margin, 16);
    doc.setFontSize(11);
    doc.setFont(undefined, 'normal');
    doc.text(title, margin, 28);
    doc.setTextColor(0, 0, 0);
    y = 48;
  };

  const addLine = (label, value) => {
    const lines = doc.splitTextToSize(String(value), maxWidth - 62);
    ensureSpace(Math.max(7, lines.length * 6) + 2);
    doc.setFontSize(10);
    doc.setFont(undefined, 'bold');
    doc.text(doc.splitTextToSize(`${label}`, 58), margin, y);
    doc.setFont(undefined, 'normal');
    doc.text(lines, margin + 62, y);
    y += Math.max(7, lines.length * 6) + 2;
  };

  const addSection = (title) => {
    ensureSpace(20);
    y += 2;
    doc.setFontSize(12);
    doc.setFont(undefined, 'bold');
    doc.setTextColor(139, 108, 188);
    doc.text(title, margin, y);
    doc.setTextColor(0, 0, 0);
    y += 9;
  };

  const addParagraph = (text) => {
    doc.setFontSize(9);
    doc.setFont(undefined, 'normal');
    const lines = doc.splitTextToSize(text, maxWidth);
    ensureSpace(lines.length * 5 + 4);
    doc.text(lines, margin, y);
    y += lines.length * 5 + 4;
  };

  const empty = (rows, message = 'No activity recorded in this period.') => {
    if (!rows || !rows.length) addParagraph(message);
    return !rows || !rows.length;
  };

  addHeader(reportTitle);
  addParagraph(
    `Period: ${fmtDate(data.range.start)} to ${fmtDate(data.range.end)} (compared with ${fmtDate(data.range.previousStart)} to ${fmtDate(data.range.previousEnd)}). `
    + `Generated ${new Date().toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' })}.`
  );

  switch (reportId) {
    case 'institute-performance': {
      const perf = data.performance;
      addSection('Performance indicators');
      perf.insights.forEach((item) => {
        const status = item.status === 'better' ? 'Improving' : item.status === 'worse' ? 'Declining' : 'No comparison';
        addLine(item.area, `${status}: ${item.detail}`);
      });
      addSection('This period vs previous period');
      perf.comparison.forEach((row) => addLine(row.metric, `${row.current} (previous: ${row.previous})`));
      addLine('Outputs per researcher', `${perf.perResearcher.outputs} (previous: ${perf.perResearcher.previousOutputs})`);
      addSection('Output by month');
      perf.monthlyOutput.forEach((row) => addLine(row.month, `${row.publications} publications, ${row.manuscripts} manuscripts, ${row.proposals} proposals`));
      break;
    }

    case 'citation-tracking': {
      const c = data.citations;
      addSection('Summary');
      addLine('Total citations', c.totals.citations);
      addLine('Average h-index', c.totals.averageHIndex);
      addLine('Researchers with citation data', `${c.totals.researchersWithProfiles} of ${c.totals.researchers}`);
      addSection('Researchers by citations');
      if (!empty(c.byResearcher)) {
        c.byResearcher.forEach((r, i) => addLine(`${i + 1}. ${r.name}`, `${r.citations} citations, h-index ${r.hIndex}, ${r.works} works (${r.department})`));
      }
      addSection('Most active researchers this period');
      if (!empty(c.mostActive)) {
        c.mostActive.forEach((r, i) => addLine(`${i + 1}. ${r.name}`, `${r.publications} publications, ${r.manuscripts} manuscripts, ${r.proposals} proposals`));
      }
      if (c.notCaptured?.length) addParagraph(`Not captured yet: ${c.notCaptured.join(', ')}.`);
      break;
    }

    case 'work-status': {
      const ws = data.workStatus;
      [['Manuscripts', ws.manuscripts], ['Project proposals', ws.proposals]].forEach(([label, block]) => {
        addSection(`${label}: current pipeline (${block.total})`);
        if (!empty(block.total ? block.pipeline : [])) {
          block.pipeline.forEach((p) => addLine(p.status, p.count));
        }
        addSection(`${label}: conversion rates`);
        block.conversion.forEach((c) => addLine(c.stage, `${fmtPct(c.rate)} (previous period: ${fmtPct(c.previous)})`));
      });
      if (ws.proposals.medianDecisionDays !== null) addLine('Median days to decision', ws.proposals.medianDecisionDays);
      break;
    }

    case 'publications-faculty': {
      const f = data.faculty;
      addSection('Output by faculty / department');
      if (!empty(f.byFaculty)) {
        f.byFaculty.forEach((row) => addLine(
          row.faculty,
          `${row.researchers} researchers; ${row.publications} publications, ${row.manuscripts} manuscripts, ${row.proposals} proposals${row.trend !== null ? `; ${row.trend > 0 ? '+' : ''}${row.trend}% vs previous` : ''}`
        ));
      }
      addSection('Top research areas');
      if (!empty(f.byResearchArea)) {
        f.byResearchArea.slice(0, 12).forEach((a, i) => addLine(`${i + 1}. ${a.area}`, `${a.count} items (${a.publications} pubs, ${a.manuscripts} manuscripts, ${a.proposals} proposals), mainly ${a.faculty}`));
      }
      break;
    }

    case 'publication-type': {
      const t = data.publicationType;
      addSection('Output by type');
      if (!empty(t.byType)) {
        t.byType.forEach((row) => addLine(row.type, `${row.published} published (${row.share}%), ${row.inProgress} in progress, DOI coverage ${fmtPct(row.doiCoverage)}`));
      }
      addSection('Top journals');
      if (!empty(t.topJournals, 'No journal names recorded in this period.')) {
        t.topJournals.forEach((j, i) => addLine(`${i + 1}.`, `${j.journal} (${j.count})`));
      }
      if (t.notCaptured?.length) addParagraph(`Not captured yet: ${t.notCaptured.join(', ')}.`);
      break;
    }

    default:
      addParagraph('Report data not available.');
  }

  const pages = doc.getNumberOfPages();
  for (let i = 1; i <= pages; i += 1) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(120, 120, 120);
    doc.text(`Live data from HospitiumRIS · page ${i} of ${pages}`, margin, 290);
  }

  const filename = reportTitle.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
  doc.save(`${filename}-${data.range.start.slice(0, 10)}-to-${data.range.end.slice(0, 10)}.pdf`);
}
