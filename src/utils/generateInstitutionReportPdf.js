export async function generateInstitutionReportPdf(reportId, reportTitle) {
  const { jsPDF } = await import('jspdf');
  const {
    institutePerformanceData,
    citationTrackingData,
    workStatusData,
    publicationsByFacultyData,
    publicationTypeData,
  } = await import('@/data/institutionReportsMockData');

  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 18;
  const maxWidth = pageWidth - margin * 2;
  let y = 20;

  const addHeader = (title) => {
    doc.setFillColor(139, 108, 188);
    doc.rect(0, 0, pageWidth, 36, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(16);
    doc.setFont(undefined, 'bold');
    doc.text('HospitiumRIS — Institution Analytics', margin, 16);
    doc.setFontSize(11);
    doc.setFont(undefined, 'normal');
    doc.text(title, margin, 28);
    doc.setTextColor(0, 0, 0);
    y = 48;
  };

  const addLine = (label, value, bold = false) => {
    if (y > 270) {
      doc.addPage();
      y = 20;
    }
    doc.setFont(undefined, bold ? 'bold' : 'normal');
    doc.setFontSize(10);
    doc.text(`${label}:`, margin, y);
    doc.setFont(undefined, 'normal');
    const lines = doc.splitTextToSize(String(value), maxWidth - 60);
    doc.text(lines, margin + 55, y);
    y += Math.max(7, lines.length * 6) + 2;
  };

  const addSection = (title) => {
    if (y > 250) {
      doc.addPage();
      y = 20;
    }
    doc.setFontSize(12);
    doc.setFont(undefined, 'bold');
    doc.setTextColor(139, 108, 188);
    doc.text(title, margin, y);
    doc.setTextColor(0, 0, 0);
    y += 10;
  };

  const addParagraph = (text) => {
    doc.setFontSize(9);
    doc.setFont(undefined, 'normal');
    const lines = doc.splitTextToSize(text, maxWidth);
    if (y + lines.length * 5 > 280) {
      doc.addPage();
      y = 20;
    }
    doc.text(lines, margin, y);
    y += lines.length * 5 + 4;
  };

  addHeader(reportTitle);
  addParagraph(`Generated: ${new Date().toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' })}`);
  y += 4;

  switch (reportId) {
    case 'institute-performance':
      addSection('Performance Insights');
      institutePerformanceData.insights.forEach((item) => {
        addLine(item.area, `${item.status.toUpperCase()} — ${item.detail} (Score: ${item.score}/100)`);
      });
      addSection('Benchmark Comparison');
      institutePerformanceData.benchmarks.forEach((b) => {
        addLine(b.metric, `Institute: ${b.institute} | Peer: ${b.peer} | National: ${b.national}`);
      });
      break;

    case 'citation-tracking':
      addSection('Top Researchers by Citations');
      citationTrackingData.byResearcher.slice(0, 8).forEach((r, i) => {
        addLine(`${i + 1}. ${r.name}`, `${r.citations} citations, h-index ${r.hIndex}, +${r.trend}% YoY`);
      });
      addSection('Most Cited Works');
      citationTrackingData.topWorks.forEach((w, i) => {
        addLine(`${i + 1}.`, `${w.title} (${w.citations} citations, ${w.year})`);
      });
      break;

    case 'work-status':
      addSection('Current Pipeline');
      workStatusData.pipeline.forEach((p) => addLine(p.status, `${p.count} works`));
      addSection('Conversion Rates');
      workStatusData.conversionRates.forEach((c) => {
        addLine(c.stage, `${c.rate}% (target: ${c.target}%)`);
      });
      break;

    case 'publications-faculty':
      addSection('Publications by Faculty');
      publicationsByFacultyData.byFaculty.forEach((f) => {
        addLine(f.faculty, `${f.publications} publications, +${f.trend}% trend, ${f.researchers} researchers`);
      });
      addSection('Top Research Areas');
      publicationsByFacultyData.byResearchArea.slice(0, 8).forEach((a, i) => {
        addLine(`${i + 1}. ${a.area}`, `${a.count} pubs (${a.faculty}), +${a.yoy}% YoY`);
      });
      break;

    case 'publication-type':
      addSection('Output by Publication Type');
      publicationTypeData.byType.forEach((t) => {
        const detail = t.avgIF
          ? `${t.count} (${t.share}%), avg IF ${t.avgIF}, Q1 ${t.q1Share}%`
          : `${t.count} (${t.share}%)`;
        addLine(t.type, `${detail} — Credibility: ${t.credibility}`);
      });
      addSection('Journal Quality Criteria');
      publicationTypeData.journalQualityCriteria.forEach((c) => {
        addLine(`${c.criterion} (${c.weight})`, c.threshold);
      });
      break;

    default:
      addParagraph('Report data not available.');
  }

  doc.setFontSize(8);
  doc.setTextColor(120, 120, 120);
  doc.text('Mock data for demonstration. Connect live module data for production reports.', margin, 285);

  const filename = reportTitle.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
  doc.save(`${filename}-report.pdf`);
}
