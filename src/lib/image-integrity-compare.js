import prisma from './prisma';
import imachek from './imachek';

const MAX_COMPARE_CASES = 10;

/**
 * Start an ImaChek cross-case comparison on a set of local records.
 * The first eligible case is the anchor; ImaChek compares it against the rest
 * (max 10), which is how same-author / cross-paper reuse is detected.
 */
export async function startCaseComparison(records, { compareGlobal = true } = {}) {
  const eligible = (records || []).filter(
    (record) => record?.externalCaseId && record.status === 'COMPLETED'
  );

  if (eligible.length < 2) {
    const error = new Error('Select at least two completed analyses to compare.');
    error.status = 400;
    throw error;
  }
  if (eligible.length > MAX_COMPARE_CASES) {
    const error = new Error(`You can compare at most ${MAX_COMPARE_CASES} cases at once.`);
    error.status = 400;
    throw error;
  }

  const primary = eligible[0];
  const externalIds = eligible.map((record) => record.externalCaseId);
  const repository = compareGlobal ? ['global'] : [];

  await imachek.compareCases(primary.externalCaseId, {
    repository,
    case: externalIds,
  });

  const updated = await prisma.imageIntegrityCase.update({
    where: { id: primary.id },
    data: {
      status: 'PROCESSING',
      analysisStatus: 'processing',
      analysisProgress: 5,
      analysisTarget: { case: externalIds, repository },
      analysisStartedAt: new Date(),
      analysisCompletedAt: null,
      comparedGlobalRepository: compareGlobal || primary.comparedGlobalRepository,
      errorMessage: null,
    },
  });

  return {
    primary: updated,
    comparedCount: eligible.length,
    externalIds,
  };
}

export async function loadRelatedCases(analysisTarget) {
  const externalIds = Array.isArray(analysisTarget?.case)
    ? analysisTarget.case.filter(Boolean)
    : [];
  if (externalIds.length === 0) return [];

  return prisma.imageIntegrityCase.findMany({
    where: { externalCaseId: { in: externalIds } },
    select: {
      id: true,
      title: true,
      fileName: true,
      status: true,
      externalCaseId: true,
      submittedById: true,
      submittedBy: {
        select: { id: true, givenName: true, familyName: true, email: true },
      },
    },
    orderBy: { createdAt: 'desc' },
  });
}
