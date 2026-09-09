export const complianceRiskAlerts = [
  {
    id: 'overdue-reviews',
    severity: 'high',
    title: 'Overdue ethics reviews',
    detail: 'Proposals pending review beyond the 30-day SLA require immediate committee action.',
    action: 'Escalate to committee chairs',
  },
  {
    id: 'missing-dmp',
    severity: 'medium',
    title: 'Incomplete data management plans',
    detail: 'Several active proposals lack an approved DMP — a common funder compliance gap.',
    action: 'Notify principal investigators',
  },
  {
    id: 'consent-gap',
    severity: 'medium',
    title: 'Informed consent documentation',
    detail: 'Consent procedures not documented for a subset of human-subjects proposals.',
    action: 'Schedule compliance review',
  },
  {
    id: 'doc-expiry',
    severity: 'low',
    title: 'Ethics approval renewals due',
    detail: 'Annual ethics renewals approaching for long-running clinical studies.',
    action: 'Send renewal reminders',
  },
];

export const regulatoryFrameworks = [
  { framework: 'GDPR / Data Protection', compliance: 88, target: 95, status: 'attention' },
  { framework: 'ICH-GCP (Clinical Trials)', compliance: 92, target: 90, status: 'good' },
  { framework: 'Institutional Ethics Policy', compliance: 85, target: 90, status: 'attention' },
  { framework: 'FAIR Data Principles', compliance: 76, target: 85, status: 'attention' },
  { framework: 'Biosafety & Biosecurity', compliance: 94, target: 90, status: 'good' },
];

export const auditTrailTrend = [
  { month: 'Jun', audits: 4, findings: 2, resolved: 2 },
  { month: 'Jul', audits: 5, findings: 3, resolved: 3 },
  { month: 'Aug', audits: 3, findings: 1, resolved: 1 },
  { month: 'Sep', audits: 6, findings: 4, resolved: 3 },
  { month: 'Oct', audits: 5, findings: 2, resolved: 2 },
  { month: 'Nov', audits: 7, findings: 3, resolved: 2 },
];

export const COMPLIANCE_REPORT_CATALOG = [
  {
    id: 'ethics-pipeline',
    title: 'Ethics review pipeline',
    description: 'Track submissions, approvals, rejections, and pending reviews over time.',
    raised: '25 Nov',
  },
  {
    id: 'department-compliance',
    title: 'Compliance by department',
    description: 'Compare ethics, data management, and consent compliance across departments.',
    raised: '25 Nov',
  },
  {
    id: 'committee-performance',
    title: 'Committee performance',
    description: 'Workload and outcome distribution across ethics review committees.',
    raised: '25 Nov',
  },
  {
    id: 'requirement-scorecard',
    title: 'Requirement fulfillment scorecard',
    description: 'Holistic view of ethics approval, DMP, consent, and documentation coverage.',
    raised: '25 Nov',
  },
  {
    id: 'risk-regulatory',
    title: 'Risk & regulatory readiness',
    description: 'Overdue reviews, audit findings, and alignment with regulatory frameworks.',
    raised: '25 Nov',
  },
];
