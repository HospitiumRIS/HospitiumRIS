import { Prisma } from '@prisma/client';

export async function persistProposalBudgetFields(client, proposalId, { budgetCurrency, budgetDocuments } = {}) {
  const docs = Array.isArray(budgetDocuments) ? budgetDocuments : [];
  const currency = budgetCurrency || null;

  if (docs.length === 0) {
    await client.$executeRaw`
      UPDATE proposals
      SET
        "budgetCurrency" = ${currency},
        "budgetDocuments" = ARRAY[]::jsonb[],
        "updatedAt" = NOW()
      WHERE id = ${proposalId}
    `;
    return;
  }

  const docsArraySql = Prisma.join(
    docs.map((doc) => Prisma.sql`${JSON.stringify(doc)}::jsonb`)
  );

  await client.$executeRaw`
    UPDATE proposals
    SET
      "budgetCurrency" = ${currency},
      "budgetDocuments" = ARRAY[${docsArraySql}]::jsonb[],
      "updatedAt" = NOW()
    WHERE id = ${proposalId}
  `;
}

export async function readProposalBudgetFields(client, proposalId) {
  try {
    const rows = await client.$queryRaw`
      SELECT "budgetCurrency", "budgetDocuments" FROM proposals WHERE id = ${proposalId}
    `;
    const row = rows?.[0] || {};
    return {
      budgetCurrency: row.budgetCurrency || null,
      budgetDocuments: Array.isArray(row.budgetDocuments) ? row.budgetDocuments : [],
    };
  } catch (error) {
    console.error('Failed to read proposal budget fields:', error);
    return { budgetCurrency: null, budgetDocuments: [] };
  }
}

export function collectBudgetDocuments(proposalData = {}, uploadedBudgetDocuments = [], existingDocuments = []) {
  const saved = Array.isArray(proposalData.savedBudgetDocuments)
    ? proposalData.savedBudgetDocuments
    : existingDocuments;
  return [...saved, ...(uploadedBudgetDocuments || [])];
}
