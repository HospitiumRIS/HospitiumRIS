import prisma from './prisma';
import { computeResearcherOutputs } from './researcher-output';

/**
 * Researcher compliance report (GET /api/researcher/analytics/compliance).
 *
 * Sections (all from the researcher's own records):
 *  - Ethics / IRB applications: status, risk, approvals expiring or expired, turnaround
 *  - Project compliance: each proposal the researcher leads or co-investigates, checked for
 *    ethics clearance, data management plan, consent procedure, data security and documentation
 *  - Image integrity: every ImaChek submission with its analysis outcome and findings
 *  - Funder obligations: grant reports, grant milestones and award contracts
 *  - Training & certification
 *  - Action list generated from the above
 *
 * Keys used by services/complianceInsightsService.js are preserved.
 */

const ETHICS_STATUS_ORDER = [
  'DRAFT', 'SUBMITTED', 'UNDER_REVIEW', 'APPROVED', 'CONDITIONAL_APPROVAL',
  'REVISION_REQUESTED', 'REJECTED', 'WITHDRAWN', 'EXPIRED',
];
const ETHICS_ACTIVE_APPROVAL_STATUSES = ['APPROVED', 'CONDITIONAL_APPROVAL'];
const IMAGE_INTEGRITY_STATUS_ORDER = ['UPLOADING', 'UPLOADED', 'PROCESSING', 'COMPLETED', 'FAILED'];
const EXPIRY_WINDOW_DAYS = 90;
const OBLIGATION_WINDOW_DAYS = 30;
const DAY = 86400000;

const clean = (v) => String(v || '').trim();
const hasText = (v) => clean(String(v || '').replace(/<[^>]+>/g, ' ').replace(/&nbsp;/g, ' ')).length > 0;
const daysBetween = (from, to) => Math.round((new Date(to) - new Date(from)) / DAY);

function classifyEthics(rawStatus, expiryDate, now) {
  const v = clean(rawStatus).toLowerCase().replace(/[_-]+/g, ' ');
  if (!v) return 'missing';
  if (v.includes('not required') || v.includes('exempt') || v.includes('waiv')) return 'not_required';
  if (v.includes('expir')) return 'expired';
  if (v.includes('reject') || v.includes('declin') || v.includes('denied')) return 'rejected';
  if (v.includes('withdraw')) return 'withdrawn';
  if (v.includes('condition')) return expiryDate && new Date(expiryDate) < now ? 'expired' : 'conditional';
  if (v.includes('revision')) return 'revision';
  if (v.includes('approv') && !v.includes('pending') && !v.includes('not')) return expiryDate && new Date(expiryDate) < now ? 'expired' : 'approved';
  if (v.includes('draft')) return 'missing';
  return 'pending';
}
const ETHICS_LABELS = {
  approved: 'Approved', conditional: 'Conditional approval', pending: 'Pending review', revision: 'Revision requested',
  rejected: 'Rejected', expired: 'Expired', withdrawn: 'Withdrawn', not_required: 'Not required', missing: 'No ethics record',
};
const CLEARED = new Set(['approved', 'conditional', 'not_required']);

function imageOutcome(c) {
  if (c.status === 'FAILED') return { key: 'failed', label: 'Analysis failed' };
  if (c.status !== 'COMPLETED') return { key: 'in_progress', label: c.status === 'PROCESSING' ? 'Analysing' : 'Uploading' };
  const findings = (c.manipulationCount || 0) + (c.similarityCount || 0);
  if (!findings) return { key: 'clean', label: 'No issues found' };
  const high = Number(c.similarityLevel?.high || 0);
  if ((c.manipulationCount || 0) > 0 || high > 0) return { key: 'review', label: 'Needs review' };
  return { key: 'minor', label: 'Minor similarities' };
}

export async function getComplianceMetrics(userId) {
  const now = new Date();
  const expiryWindowEnd = new Date(now.getTime() + EXPIRY_WINDOW_DAYS * DAY);

  const user = await prisma.user.findUnique({ where: { id: userId }, select: { id: true, email: true, orcidId: true } });

  // ---------------- Ethics applications ----------------
  const ethicsApplications = await prisma.ethicsApplication.findMany({
    where: { userId },
    select: {
      id: true, title: true, status: true, riskLevel: true, referenceNumber: true, committeeName: true,
      submittedDate: true, approvalDate: true, expiryDate: true, approvalConditions: true,
      vulnerablePopulations: true, consentWaiverRequested: true, dataAnonymization: true, createdAt: true,
    },
    orderBy: { createdAt: 'desc' },
  });

  const ethicsStatusCounts = ETHICS_STATUS_ORDER.map((status) => ({
    status: status.replace(/_/g, ' '),
    key: status,
    count: ethicsApplications.filter((e) => e.status === status).length,
  }));
  const activeApprovals = ethicsApplications.filter((e) => ETHICS_ACTIVE_APPROVAL_STATUSES.includes(e.status) && (!e.expiryDate || new Date(e.expiryDate) > now));
  const expiringSoon = activeApprovals.filter((e) => e.expiryDate && new Date(e.expiryDate) <= expiryWindowEnd);
  const expiredApprovals = ethicsApplications.filter((e) => e.status === 'EXPIRED' || (ETHICS_ACTIVE_APPROVAL_STATUSES.includes(e.status) && e.expiryDate && new Date(e.expiryDate) <= now));
  const pendingEthics = ethicsApplications.filter((e) => ['SUBMITTED', 'UNDER_REVIEW'].includes(e.status));
  const decidedWithDates = ethicsApplications.filter((e) => e.submittedDate && e.approvalDate);
  const avgEthicsTurnaroundDays = decidedWithDates.length
    ? Math.round(decidedWithDates.reduce((sum, e) => sum + (new Date(e.approvalDate) - new Date(e.submittedDate)) / DAY, 0) / decidedWithDates.length)
    : null;
  const expiringApprovals = expiringSoon
    .map((e) => ({ id: e.id, title: e.title, expiryDate: e.expiryDate, status: e.status, daysLeft: daysBetween(now, e.expiryDate) }))
    .sort((a, b) => new Date(a.expiryDate) - new Date(b.expiryDate));
  const riskLevelCounts = ['MINIMAL', 'LOW', 'MODERATE', 'HIGH']
    .map((level) => ({ level, count: ethicsApplications.filter((e) => e.riskLevel === level).length }))
    .filter((r) => r.count > 0);
  const ethicsRegister = ethicsApplications.map((e) => ({
    id: e.id,
    title: e.title,
    status: e.status,
    statusLabel: e.status.replace(/_/g, ' '),
    reference: e.referenceNumber,
    committee: e.committeeName,
    riskLevel: e.riskLevel,
    submittedDate: e.submittedDate,
    approvalDate: e.approvalDate,
    expiryDate: e.expiryDate,
    daysToExpiry: e.expiryDate ? daysBetween(now, e.expiryDate) : null,
    conditions: e.approvalConditions || null,
  }));

  const totalEthicsApps = ethicsApplications.length;
  const anonymizationCount = ethicsApplications.filter((e) => e.dataAnonymization).length;
  const anonymizationRate = totalEthicsApps ? (anonymizationCount / totalEthicsApps) * 100 : null;
  const consentWaiverCount = ethicsApplications.filter((e) => e.consentWaiverRequested).length;
  const vulnerablePopulationCount = ethicsApplications.filter((e) => e.vulnerablePopulations).length;

  // ---------------- Project compliance (PI + co-investigator) ----------------
  let projectRows = [];
  if (user) {
    const outputs = await computeResearcherOutputs([user], { withItems: true });
    const roleById = new Map((outputs.get(user.id)?.items?.proposals || []).map((p) => [p.id, p.role]));
    if (roleById.size) {
      const proposals = await prisma.proposal.findMany({
        where: { id: { in: [...roleById.keys()] }, status: { not: 'DRAFT' } },
        select: {
          id: true, title: true, status: true, startDate: true, endDate: true, createdAt: true,
          ethicsApprovalStatus: true, ethicsApprovalReference: true, consentProcedures: true,
          dataSecurityMeasures: true, ethicsDocuments: true, dataManagementPlan: true,
          ethicsLinks: { select: { ethicsApplication: { select: { id: true, status: true, referenceNumber: true, expiryDate: true, documents: true } } } },
          grantApplications: {
            select: {
              id: true, applicationTitle: true, grantorName: true, status: true,
              milestones: { select: { id: true, title: true, dueDate: true, completedDate: true, status: true } },
              award: { select: { id: true, contractSigned: true, endDate: true, reports: { select: { id: true, reportType: true, dueDate: true, submittedDate: true, status: true } } } },
            },
          },
        },
      });
      projectRows = proposals.map((p) => {
        const app = p.ethicsLinks?.[0]?.ethicsApplication || null;
        const ethics = classifyEthics(app?.status || p.ethicsApprovalStatus, app?.expiryDate, now);
        const humanSubjects = ethics !== 'not_required';
        const checks = {
          ethics: CLEARED.has(ethics),
          dataPlan: (p.dataManagementPlan || []).length > 0,
          consent: humanSubjects ? hasText(p.consentProcedures) : null,
          dataSecurity: hasText(p.dataSecurityMeasures),
          documentation: humanSubjects ? ((p.ethicsDocuments || []).length + (app?.documents || []).length) > 0 : null,
        };
        const applicable = Object.values(checks).filter((v) => v !== null);
        const score = applicable.length ? Math.round((applicable.filter(Boolean).length / applicable.length) * 100) : 100;
        const missing = Object.entries(checks).filter(([, v]) => v === false).map(([k]) => k);
        return {
          id: p.id,
          title: p.title,
          role: roleById.get(p.id) === 'pi' ? 'Principal investigator' : 'Co-investigator',
          proposalStatus: p.status,
          ethics,
          ethicsLabel: ETHICS_LABELS[ethics],
          ethicsReference: app?.referenceNumber || p.ethicsApprovalReference || null,
          ethicsExpiry: app?.expiryDate || null,
          checks,
          missing,
          score,
          grants: p.grantApplications || [],
        };
      }).sort((a, b) => a.score - b.score);
    }
  }
  const projectComplianceScore = projectRows.length ? Math.round(projectRows.reduce((s, r) => s + r.score, 0) / projectRows.length) : null;
  const requirementCoverage = [
    ['ethics', 'Ethics clearance'], ['dataPlan', 'Data management plan'], ['consent', 'Consent procedure'],
    ['dataSecurity', 'Data security measures'], ['documentation', 'Ethics documentation'],
  ].map(([key, label]) => {
    const applicable = projectRows.filter((r) => r.checks[key] !== null);
    const met = applicable.filter((r) => r.checks[key]).length;
    return { key, label, met, applicable: applicable.length, rate: applicable.length ? Math.round((met / applicable.length) * 100) : null };
  });

  // ---------------- Funder obligations ----------------
  const ownGrantApps = await prisma.grantApplication.findMany({
    where: { userId },
    select: {
      id: true, proposalId: true, applicationTitle: true, grantorName: true, status: true,
      milestones: { select: { id: true, title: true, dueDate: true, completedDate: true, status: true } },
      award: { select: { id: true, contractSigned: true, endDate: true, reports: { select: { id: true, reportType: true, dueDate: true, submittedDate: true, status: true } } } },
    },
  });
  const grantMap = new Map();
  ownGrantApps.forEach((g) => grantMap.set(g.id, { ...g, proposalTitle: null }));
  projectRows.forEach((r) => r.grants.forEach((g) => { if (!grantMap.has(g.id)) grantMap.set(g.id, { ...g, proposalId: r.id, proposalTitle: r.title }); }));
  const obligations = [];
  grantMap.forEach((g) => {
    (g.award?.reports || []).forEach((rep) => {
      if (rep.submittedDate || ['SUBMITTED', 'APPROVED'].includes(clean(rep.status).toUpperCase())) return;
      const days = daysBetween(now, rep.dueDate);
      if (days <= OBLIGATION_WINDOW_DAYS) {
        const type = clean(rep.reportType);
        obligations.push({ kind: 'Report', item: type ? `${type.charAt(0)}${type.slice(1).toLowerCase()} report` : 'Funder report', grant: g.applicationTitle, funder: g.grantorName, proposalId: g.proposalId, dueDate: rep.dueDate, daysUntilDue: days, overdue: days < 0 });
      }
    });
    (g.milestones || []).forEach((ms) => {
      if (!ms.dueDate || ms.completedDate || clean(ms.status).toUpperCase() === 'COMPLETED') return;
      const days = daysBetween(now, ms.dueDate);
      if (days <= OBLIGATION_WINDOW_DAYS) obligations.push({ kind: 'Milestone', item: ms.title, grant: g.applicationTitle, funder: g.grantorName, proposalId: g.proposalId, dueDate: ms.dueDate, daysUntilDue: days, overdue: days < 0 });
    });
    if (g.award && !g.award.contractSigned) {
      obligations.push({ kind: 'Contract', item: 'Award contract not signed', grant: g.applicationTitle, funder: g.grantorName, proposalId: g.proposalId, dueDate: null, daysUntilDue: null, overdue: true });
    }
  });
  obligations.sort((a, b) => (a.daysUntilDue ?? -9999) - (b.daysUntilDue ?? -9999));

  // ---------------- Image integrity submissions ----------------
  const imageIntegrityCases = await prisma.imageIntegrityCase.findMany({
    where: { submittedById: userId },
    select: {
      id: true, title: true, doi: true, fileName: true, fileFormat: true, status: true, analysisStatus: true,
      analysisProgress: true, errorMessage: true, manipulationCount: true, similarityCount: true, similarityLevel: true,
      classification: true, pageAmount: true, croppedAmount: true, comparedGlobalRepository: true,
      reportUrl: true, reportExpiresAt: true, createdAt: true, analysisStartedAt: true, analysisCompletedAt: true,
      collection: { select: { name: true } },
    },
    orderBy: { createdAt: 'desc' },
  });
  const imageIntegrityStatusCounts = IMAGE_INTEGRITY_STATUS_ORDER.map((status) => ({ status, count: imageIntegrityCases.filter((c) => c.status === status).length }));
  const completedCases = imageIntegrityCases.filter((c) => c.status === 'COMPLETED');
  const flaggedCases = completedCases.filter((c) => (c.manipulationCount || 0) > 0 || (c.similarityCount || 0) > 0);
  const imageIntegrityCleanRate = completedCases.length ? ((completedCases.length - flaggedCases.length) / completedCases.length) * 100 : null;
  const flaggedCaseList = flaggedCases.map((c) => ({ id: c.id, title: c.title, manipulationCount: c.manipulationCount || 0, similarityCount: c.similarityCount || 0 })).slice(0, 10);
  const submissions = imageIntegrityCases.map((c) => {
    const outcome = imageOutcome(c);
    return {
      id: c.id,
      title: c.title,
      doi: c.doi,
      fileName: c.fileName,
      fileFormat: c.fileFormat,
      collection: c.collection?.name || null,
      status: c.status,
      outcome: outcome.key,
      outcomeLabel: outcome.label,
      progress: c.analysisProgress || 0,
      errorMessage: c.status === 'FAILED' ? c.errorMessage : null,
      manipulationCount: c.manipulationCount ?? null,
      similarityCount: c.similarityCount ?? null,
      similarityLevel: c.similarityLevel || null,
      classification: c.classification || null,
      pageAmount: c.pageAmount ?? null,
      croppedAmount: c.croppedAmount ?? null,
      comparedGlobalRepository: c.comparedGlobalRepository,
      submittedAt: c.createdAt,
      completedAt: c.analysisCompletedAt,
      turnaroundHours: c.analysisStartedAt && c.analysisCompletedAt ? Math.max(0, Math.round((new Date(c.analysisCompletedAt) - new Date(c.analysisStartedAt)) / 3600000)) : null,
      reportAvailable: Boolean(c.reportUrl && c.reportExpiresAt && new Date(c.reportExpiresAt) > now),
    };
  });
  const classificationTotals = {};
  completedCases.forEach((c) => {
    Object.entries(c.classification || {}).forEach(([k, v]) => {
      const n = Number(v) || 0;
      if (n) classificationTotals[k] = (classificationTotals[k] || 0) + n;
    });
  });
  const imagesAnalysed = completedCases.reduce((s, c) => s + (c.croppedAmount || 0), 0);
  const outcomeCounts = ['clean', 'minor', 'review', 'in_progress', 'failed'].map((key) => ({
    key,
    label: { clean: 'No issues found', minor: 'Minor similarities', review: 'Needs review', in_progress: 'In progress', failed: 'Analysis failed' }[key],
    count: submissions.filter((s) => s.outcome === key).length,
  }));

  // ---------------- Training ----------------
  const registrations = await prisma.trainingRegistration.findMany({
    where: { userId },
    include: {
      training: { select: { title: true, startDate: true, endDate: true } },
      certificate: { select: { id: true, issuedAt: true } },
    },
    orderBy: { registeredAt: 'desc' },
  });
  const totalRegistrations = registrations.length;
  const completedRegistrations = registrations.filter((r) => r.status === 'COMPLETED');
  const cancelledRegistrations = registrations.filter((r) => r.status === 'CANCELLED').length;
  const activeRegistrations = registrations.filter((r) => r.status === 'REGISTERED');
  const trainingCompletionRate = totalRegistrations ? (completedRegistrations.length / totalRegistrations) * 100 : null;
  const certificatesHeld = registrations.filter((r) => r.certificate).length;
  const overdueTrainings = activeRegistrations
    .filter((r) => r.training?.endDate && new Date(r.training.endDate) < now)
    .map((r) => ({ title: r.training.title, endDate: r.training.endDate }));
  const upcomingTrainings = activeRegistrations
    .filter((r) => r.training?.startDate && new Date(r.training.startDate) >= now)
    .map((r) => ({ title: r.training.title, startDate: r.training.startDate }))
    .sort((a, b) => new Date(a.startDate) - new Date(b.startDate))
    .slice(0, 8);
  const trainingStatusCounts = [
    { status: 'Completed', count: completedRegistrations.length },
    { status: 'Registered', count: activeRegistrations.length },
    { status: 'Cancelled', count: cancelledRegistrations },
  ].filter((s) => s.count > 0);
  const certificates = registrations.filter((r) => r.certificate).map((r) => ({ title: r.training?.title, issuedAt: r.certificate.issuedAt, id: r.certificate.id }));

  // ---------------- Actions ----------------
  const actions = [];
  if (expiredApprovals.length) actions.push({ severity: 'high', title: `${expiredApprovals.length} ethics approval${expiredApprovals.length === 1 ? ' has' : 's have'} expired`, detail: 'Pause data collection on these studies until clearance is renewed.', link: '/researcher/ethics/applications', items: expiredApprovals.map((e) => e.title).slice(0, 5) });
  const overdueObligations = obligations.filter((o) => o.overdue);
  if (overdueObligations.length) actions.push({ severity: 'high', title: `${overdueObligations.length} overdue funder obligation${overdueObligations.length === 1 ? '' : 's'}`, detail: 'Grant reports, milestones or contracts are past due.', link: '/researcher/projects/proposals/grant-tracker', items: overdueObligations.map((o) => `${o.item} · ${o.grant}`).slice(0, 5) });
  const reviewCases = submissions.filter((s) => s.outcome === 'review');
  if (reviewCases.length) actions.push({ severity: 'high', title: `${reviewCases.length} image integrity report${reviewCases.length === 1 ? ' needs' : 's need'} review`, detail: 'Possible manipulation or high similarity was detected. Review each finding before publication or submission.', link: '/researcher/image-integrity', items: reviewCases.map((s) => s.title).slice(0, 5) });
  const unclearedProjects = projectRows.filter((r) => !r.checks.ethics && ['APPROVED', 'UNDER_REVIEW', 'SUBMITTED'].includes(r.proposalStatus));
  if (unclearedProjects.length) actions.push({ severity: 'high', title: `${unclearedProjects.length} active project${unclearedProjects.length === 1 ? '' : 's'} without ethics clearance`, detail: 'Link an approved ethics application or record that ethics review is not required.', link: '/researcher/projects/proposals/list', items: unclearedProjects.map((r) => r.title).slice(0, 5) });
  if (expiringSoon.length) actions.push({ severity: 'medium', title: `${expiringSoon.length} ethics approval${expiringSoon.length === 1 ? '' : 's'} expiring within ${EXPIRY_WINDOW_DAYS} days`, detail: 'Submit renewal applications before the expiry date.', link: '/researcher/ethics/applications', items: expiringApprovals.map((e) => `${e.title} (${e.daysLeft} days)`).slice(0, 5) });
  const missingDmp = projectRows.filter((r) => !r.checks.dataPlan);
  if (missingDmp.length) actions.push({ severity: 'medium', title: `${missingDmp.length} project${missingDmp.length === 1 ? '' : 's'} without a data management plan`, detail: 'Most funders and the institution expect a DMP before data collection.', link: '/researcher/projects/proposals/list', items: missingDmp.map((r) => r.title).slice(0, 5) });
  if (overdueTrainings.length) actions.push({ severity: 'medium', title: `${overdueTrainings.length} training course${overdueTrainings.length === 1 ? '' : 's'} not completed`, detail: 'The course end date has passed without completion.', link: '/researcher/training', items: overdueTrainings.map((t) => t.title).slice(0, 5) });
  const failedCases = submissions.filter((s) => s.outcome === 'failed');
  if (failedCases.length) actions.push({ severity: 'low', title: `${failedCases.length} image integrity submission${failedCases.length === 1 ? '' : 's'} failed`, detail: 'Resubmit the file to get an analysis report.', link: '/researcher/image-integrity', items: failedCases.map((s) => s.title).slice(0, 5) });

  // Overall standing: share of applicable checks passed across all areas.
  const checks = [
    ...projectRows.map((r) => r.score / 100),
    ...(activeApprovals.length + expiredApprovals.length ? [activeApprovals.length / (activeApprovals.length + expiredApprovals.length)] : []),
    ...(completedCases.length ? [(completedCases.length - reviewCases.length) / completedCases.length] : []),
    ...(totalRegistrations ? [(totalRegistrations - overdueTrainings.length) / totalRegistrations] : []),
  ];
  const complianceScore = checks.length ? Math.round((checks.reduce((s, v) => s + v, 0) / checks.length) * 100) : null;

  return {
    overview: {
      complianceScore,
      openActions: actions.length,
      highPriorityActions: actions.filter((a) => a.severity === 'high').length,
      activeEthicsApprovals: activeApprovals.length,
      pendingEthics: pendingEthics.length,
      expiringSoon: expiringSoon.length,
      expiredApprovals: expiredApprovals.length,
      avgEthicsTurnaroundDays,
      anonymizationRate,
      projects: projectRows.length,
      projectComplianceScore,
      imageSubmissions: imageIntegrityCases.length,
      imageIntegrityCleanRate,
      flaggedImageCases: flaggedCases.length,
      imagesNeedingReview: reviewCases.length,
      funderObligations: obligations.length,
      overdueFunderObligations: overdueObligations.length,
      trainingCompletionRate,
      certificatesHeld,
      overdueTrainings: overdueTrainings.length,
    },
    thresholds: { expiryWindowDays: EXPIRY_WINDOW_DAYS, obligationWindowDays: OBLIGATION_WINDOW_DAYS },
    actions,
    ethics: {
      statusCounts: ethicsStatusCounts,
      riskLevelCounts,
      expiringApprovals,
      totalApplications: totalEthicsApps,
      register: ethicsRegister,
    },
    projects: {
      register: projectRows.map(({ grants, ...r }) => r),
      requirementCoverage,
      score: projectComplianceScore,
    },
    funder: { obligations },
    dataProtection: { totalApplications: totalEthicsApps, anonymizationCount, anonymizationRate, consentWaiverCount, vulnerablePopulationCount },
    imageIntegrity: {
      statusCounts: imageIntegrityStatusCounts,
      outcomeCounts,
      totalCases: imageIntegrityCases.length,
      completedCases: completedCases.length,
      flaggedCases: flaggedCaseList,
      cleanRate: imageIntegrityCleanRate,
      imagesAnalysed,
      classificationTotals,
      submissions,
    },
    training: {
      statusCounts: trainingStatusCounts,
      totalRegistrations,
      completionRate: trainingCompletionRate,
      certificatesHeld,
      certificates,
      overdueTrainings,
      upcomingTrainings,
    },
    meta: { estimatedFields: [], generatedAt: new Date().toISOString() },
  };
}
