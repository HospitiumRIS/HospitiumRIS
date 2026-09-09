import prisma from './prisma';
import imachek, { isImaChekConfigured, normalizeAnalysisPayload } from './imachek';

function resultPatch(latest, record) {
  return {
    analysisStatus: latest.analysisStatus,
    analysisProgress: latest.analysisProgress ?? record.analysisProgress,
    manipulationCount: latest.manipulationCount ?? record.manipulationCount,
    similarityCount: latest.similarityCount ?? record.similarityCount,
    similarityLevel: latest.similarityLevel ?? record.similarityLevel,
    classification: latest.classification ?? record.classification,
    pageAmount: latest.pageAmount ?? record.pageAmount,
    croppedAmount: latest.croppedAmount ?? record.croppedAmount,
    analysisTarget: latest.analysisTarget ?? record.analysisTarget,
    analysisCompletedAt: latest.analysisCompletedAt
      ? new Date(latest.analysisCompletedAt)
      : latest.isCompleted
      ? new Date()
      : record.analysisCompletedAt,
    errorMessage: null,
  };
}

/** Fill page/crop/target fields from Get Single Case Info once analysis finishes. */
async function enrichFromCaseInfo(record) {
  if (!record?.externalCaseId) return record;
  try {
    const info = await imachek.getCaseInfo(record.externalCaseId);
    const latest = normalizeAnalysisPayload(info);
    if (!latest) return record;
    return await prisma.imageIntegrityCase.update({
      where: { id: record.id },
      data: resultPatch(latest, record),
    });
  } catch (error) {
    console.error(`ImaChek case info enrich failed for ${record.id}:`, error);
    return record;
  }
}

/**
 * Pull the latest ImaChek status for one local case and persist it.
 * No-ops when not configured, already terminal, or missing an external id
 * unless `{ force: true }` is passed (used after cross-case compare / refresh).
 */
export async function refreshIntegrityCaseFromImaChek(record, { force = false } = {}) {
  if (!record?.externalCaseId || !isImaChekConfigured()) return record;
  if (!force && (record.status === 'COMPLETED' || record.status === 'FAILED')) return record;

  try {
    const statusResult = await imachek.getAnalysisStatus(record.externalCaseId);
    const latest = normalizeAnalysisPayload(statusResult);
    if (!latest) return record;

    if (latest.isFailed) {
      return await prisma.imageIntegrityCase.update({
        where: { id: record.id },
        data: {
          status: 'FAILED',
          analysisStatus: latest.analysisStatus,
          errorMessage: `ImaChek analysis ended with status "${latest.analysisStatus}".`,
        },
      });
    }

    const updated = await prisma.imageIntegrityCase.update({
      where: { id: record.id },
      data: {
        status: latest.isCompleted ? 'COMPLETED' : 'PROCESSING',
        ...resultPatch(latest, record),
      },
    });

    if (latest.isCompleted) {
      return enrichFromCaseInfo(updated);
    }
    return updated;
  } catch (error) {
    console.error(`ImaChek status refresh failed for case ${record.id}:`, error);
    return record;
  }
}

/** Refresh every non-terminal case in a list (bounded parallelism). */
export async function refreshIntegrityCasesFromImaChek(cases = []) {
  const active = cases.filter(
    (c) => c.status === 'UPLOADING' || c.status === 'PROCESSING'
  );
  if (active.length === 0) return cases;

  const refreshedById = new Map();
  await Promise.all(
    active.map(async (record) => {
      const updated = await refreshIntegrityCaseFromImaChek(record);
      refreshedById.set(record.id, updated);
    })
  );

  return cases.map((c) => {
    const updated = refreshedById.get(c.id);
    if (!updated) return c;
    return {
      ...updated,
      submittedBy: c.submittedBy || updated.submittedBy,
    };
  });
}
