export async function generateComplianceReportPdf(reportId, reportTitle, analyticsData = null) {
  const { jsPDF } = await import('jspdf');
  const {
    complianceRiskAlerts,
    regulatoryFrameworks,
    auditTrailTrend,
  } = await import('@/data/complianceReportsMockData');

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
    doc.text('HospitiumRIS — Compliance Analytics', margin, 16);
    doc.setFontSize(11);
    doc.setFont(undefined, 'normal');
    doc.text(title, margin, 28);
    doc.setTextColor(0, 0, 0);
    y = 48;
  };

  const addLine = (label, value) => {
    if (y > 270) {
      doc.addPage();
      y = 20;
    }
    doc.setFontSize(10);
    doc.setFont(undefined, 'bold');
    doc.text(`${label}:`, margin, y);
    doc.setFont(undefined, 'normal');
    const lines = doc.splitTextToSize(String(value), maxWidth - 55);
    doc.text(lines, margin + 50, y);
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

  addHeader(reportTitle);
  doc.setFontSize(9);
  doc.text(`Generated: ${new Date().toLocaleString()}`, margin, y);
  y += 10;

  const overview = analyticsData?.overview;
  const requirements = analyticsData?.complianceRequirements;
  const review = analyticsData?.reviewMetrics;

  if (overview) {
    addSection('Overview');
    addLine('Total proposals', overview.totalProposals);
    addLine('Ethics approved', overview.approvedEthics);
    addLine('Pending ethics', overview.pendingEthics);
    addLine('Compliance rate', `${overview.complianceRate}%`);
    addLine('Approval rate', `${overview.approvalRate}%`);
    y += 4;
  }

  switch (reportId) {
    case 'ethics-pipeline':
      addSection('Monthly Trends');
      (analyticsData?.monthlyTrends || []).forEach((t) => {
        addLine(t.month, `Approved: ${t.approved}, Pending: ${t.pending}, Rejected: ${t.rejected}`);
      });
      break;

    case 'department-compliance':
      addSection('Department Compliance');
      (analyticsData?.complianceByDepartment || []).slice(0, 10).forEach((d) => {
        addLine(d.department, `${d.complianceRate}% (${d.totalProposals} proposals)`);
      });
      break;

    case 'committee-performance':
      addSection('Ethics Committees');
      (analyticsData?.ethicsCommittees || []).forEach((c) => {
        addLine(c.committee, `Total: ${c.totalProposals}, Approved: ${c.approved}, Pending: ${c.pending}`);
      });
      break;

    case 'requirement-scorecard':
      if (requirements) {
        addSection('Requirements');
        addLine('Ethics approval', `${requirements.ethicsApproval}%`);
        addLine('Data management', `${requirements.dataManagement}%`);
        addLine('Informed consent', `${requirements.informedConsent}%`);
        addLine('Documentation', `${requirements.documentation}%`);
      }
      break;

    case 'risk-regulatory':
      if (review) {
        addSection('Review Metrics');
        addLine('Average review time', `${review.averageReviewTime} days`);
        addLine('Fastest review', `${review.fastestReview} days`);
        addLine('Overdue reviews', review.overdueReviews);
      }
      addSection('Risk Alerts');
      complianceRiskAlerts.forEach((r) => addLine(r.title, `${r.severity.toUpperCase()} — ${r.detail}`));
      addSection('Regulatory Frameworks');
      regulatoryFrameworks.forEach((f) => addLine(f.framework, `${f.compliance}% (target ${f.target}%)`));
      addSection('Audit Trail');
      auditTrailTrend.forEach((a) => addLine(a.month, `${a.audits} audits, ${a.findings} findings, ${a.resolved} resolved`));
      break;

    default:
      addLine('Note', 'Report data not available.');
  }

  doc.setFontSize(8);
  doc.setTextColor(120, 120, 120);
  doc.text('Institutional compliance report — review with legal/ethics office before external distribution.', margin, 285);

  const filename = reportTitle.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
  doc.save(`${filename}-compliance-report.pdf`);
}
