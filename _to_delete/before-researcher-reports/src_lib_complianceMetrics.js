import prisma from './prisma';

const ETHICS_STATUS_ORDER = [
  'DRAFT', 'SUBMITTED', 'UNDER_REVIEW', 'APPROVED', 'CONDITIONAL_APPROVAL',
  'REVISION_REQUESTED', 'REJECTED', 'WITHDRAWN', 'EXPIRED'
];
const ETHICS_ACTIVE_APPROVAL_STATUSES = ['APPROVED', 'CONDITIONAL_APPROVAL'];
const IMAGE_INTEGRITY_STATUS_ORDER = ['UPLOADING', 'UPLOADED', 'PROCESSING', 'COMPLETED', 'FAILED'];
const EXPIRY_WINDOW_DAYS = 90;

export async function getComplianceMetrics(userId) {
  const now = new Date();
  const expiryWindowEnd = new Date(now.getTime() + EXPIRY_WINDOW_DAYS * 86400000);

  // --- Ethics / IRB applications (real, direct userId link) ---
  const ethicsApplications = await prisma.ethicsApplication.findMany({
    where: { userId },
    select: {
      id: true,
      title: true,
      status: true,
      riskLevel: true,
      submittedDate: true,
      approvalDate: true,
      expiryDate: true,
      vulnerablePopulations: true,
      consentWaiverRequested: true,
      dataAnonymization: true,
      createdAt: true
    },
    orderBy: { createdAt: 'desc' }
  });

  const ethicsStatusCounts = ETHICS_STATUS_ORDER.map((status) => ({
    status: status.replace(/_/g, ' '),
    count: ethicsApplications.filter((e) => e.status === status).length
  }));

  const activeApprovals = ethicsApplications.filter(
    (e) => ETHICS_ACTIVE_APPROVAL_STATUSES.includes(e.status) && (!e.expiryDate || new Date(e.expiryDate) > now)
  );
  const expiringSoon = activeApprovals.filter(
    (e) => e.expiryDate && new Date(e.expiryDate) <= expiryWindowEnd
  );
  const expiredApprovals = ethicsApplications.filter(
    (e) => e.status === 'EXPIRED' || (ETHICS_ACTIVE_APPROVAL_STATUSES.includes(e.status) && e.expiryDate && new Date(e.expiryDate) <= now)
  );

  const decidedWithDates = ethicsApplications.filter((e) => e.submittedDate && e.approvalDate);
  const avgEthicsTurnaroundDays = decidedWithDates.length > 0
    ? Math.round(
        decidedWithDates.reduce((sum, e) => sum + (new Date(e.approvalDate) - new Date(e.submittedDate)) / 86400000, 0) /
        decidedWithDates.length
      )
    : null;

  const expiringApprovals = expiringSoon
    .map((e) => ({ id: e.id, title: e.title, expiryDate: e.expiryDate, status: e.status }))
    .sort((a, b) => new Date(a.expiryDate) - new Date(b.expiryDate));

  const riskLevelCounts = ['MINIMAL', 'LOW', 'MODERATE', 'HIGH']
    .map((level) => ({ level, count: ethicsApplications.filter((e) => e.riskLevel === level).length }))
    .filter((r) => r.count > 0);

  // --- Data protection & consent (real, aggregated from EthicsApplication) ---
  const totalEthicsApps = ethicsApplications.length;
  const anonymizationCount = ethicsApplications.filter((e) => e.dataAnonymization).length;
  const anonymizationRate = totalEthicsApps > 0 ? (anonymizationCount / totalEthicsApps) * 100 : null;
  const consentWaiverCount = ethicsApplications.filter((e) => e.consentWaiverRequested).length;
  const vulnerablePopulationCount = ethicsApplications.filter((e) => e.vulnerablePopulations).length;

  // --- Image integrity cases (real, direct submittedById link) ---
  const imageIntegrityCases = await prisma.imageIntegrityCase.findMany({
    where: { submittedById: userId },
    select: {
      id: true,
      title: true,
      status: true,
      manipulationCount: true,
      similarityCount: true,
      createdAt: true
    },
    orderBy: { createdAt: 'desc' }
  });

  const imageIntegrityStatusCounts = IMAGE_INTEGRITY_STATUS_ORDER.map((status) => ({
    status,
    count: imageIntegrityCases.filter((c) => c.status === status).length
  }));

  const completedCases = imageIntegrityCases.filter((c) => c.status === 'COMPLETED');
  const flaggedCases = completedCases.filter((c) => (c.manipulationCount || 0) > 0 || (c.similarityCount || 0) > 0);
  const imageIntegrityCleanRate = completedCases.length > 0
    ? ((completedCases.length - flaggedCases.length) / completedCases.length) * 100
    : null;

  const flaggedCaseList = flaggedCases
    .map((c) => ({ id: c.id, title: c.title, manipulationCount: c.manipulationCount || 0, similarityCount: c.similarityCount || 0 }))
    .slice(0, 10);

  // --- Training & certification (real, direct userId link) ---
  const registrations = await prisma.trainingRegistration.findMany({
    where: { userId },
    include: {
      training: { select: { title: true, startDate: true, endDate: true } },
      certificate: { select: { id: true, issuedAt: true } }
    },
    orderBy: { registeredAt: 'desc' }
  });

  const totalRegistrations = registrations.length;
  const completedRegistrations = registrations.filter((r) => r.status === 'COMPLETED');
  const cancelledRegistrations = registrations.filter((r) => r.status === 'CANCELLED').length;
  const activeRegistrations = registrations.filter((r) => r.status === 'REGISTERED');
  const trainingCompletionRate = totalRegistrations > 0 ? (completedRegistrations.length / totalRegistrations) * 100 : null;
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
    { status: 'Cancelled', count: cancelledRegistrations }
  ].filter((s) => s.count > 0);

  return {
    overview: {
      activeEthicsApprovals: activeApprovals.length,
      expiringSoon: expiringSoon.length,
      expiredApprovals: expiredApprovals.length,
      avgEthicsTurnaroundDays,
      anonymizationRate,
      imageIntegrityCleanRate,
      flaggedImageCases: flaggedCases.length,
      trainingCompletionRate,
      certificatesHeld,
      overdueTrainings: overdueTrainings.length
    },
    ethics: {
      statusCounts: ethicsStatusCounts,
      riskLevelCounts,
      expiringApprovals,
      totalApplications: totalEthicsApps
    },
    dataProtection: {
      totalApplications: totalEthicsApps,
      anonymizationCount,
      anonymizationRate,
      consentWaiverCount,
      vulnerablePopulationCount
    },
    imageIntegrity: {
      statusCounts: imageIntegrityStatusCounts,
      totalCases: imageIntegrityCases.length,
      completedCases: completedCases.length,
      flaggedCases: flaggedCaseList,
      cleanRate: imageIntegrityCleanRate
    },
    training: {
      statusCounts: trainingStatusCounts,
      totalRegistrations,
      completionRate: trainingCompletionRate,
      certificatesHeld,
      overdueTrainings,
      upcomingTrainings
    },
    meta: {
      estimatedFields: [],
      generatedAt: new Date().toISOString()
    }
  };
}
