-- Project budgets and expenses (#179)
ALTER TYPE "StoredFileModule" ADD VALUE 'PROJECT_EXPENSE_RECEIPT';

CREATE TYPE "ProjectExpenseStatus" AS ENUM ('SUBMITTED', 'APPROVED', 'REJECTED', 'VOID');

CREATE TABLE "project_budget_lines" (
    "id" TEXT NOT NULL,
    "proposalId" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "description" TEXT,
    "amount" DECIMAL(15,2) NOT NULL,
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "project_budget_lines_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "project_budget_lines_proposalId_idx" ON "project_budget_lines"("proposalId");

CREATE TABLE "project_expenses" (
    "id" TEXT NOT NULL,
    "proposalId" TEXT NOT NULL,
    "budgetLineId" TEXT,
    "spentOn" TIMESTAMP(3) NOT NULL,
    "description" TEXT NOT NULL,
    "amount" DECIMAL(15,2) NOT NULL,
    "currency" TEXT NOT NULL,
    "payee" TEXT,
    "reference" TEXT,
    "receiptFileId" TEXT,
    "status" "ProjectExpenseStatus" NOT NULL DEFAULT 'SUBMITTED',
    "source" TEXT NOT NULL DEFAULT 'OFFICE',
    "submittedById" TEXT NOT NULL,
    "decidedById" TEXT,
    "decidedAt" TIMESTAMP(3),
    "decisionNote" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "project_expenses_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "project_expenses_proposalId_status_idx" ON "project_expenses"("proposalId", "status");
CREATE INDEX "project_expenses_status_idx" ON "project_expenses"("status");

ALTER TABLE "project_budget_lines" ADD CONSTRAINT "project_budget_lines_proposalId_fkey" FOREIGN KEY ("proposalId") REFERENCES "proposals"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "project_expenses" ADD CONSTRAINT "project_expenses_proposalId_fkey" FOREIGN KEY ("proposalId") REFERENCES "proposals"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "project_expenses" ADD CONSTRAINT "project_expenses_budgetLineId_fkey" FOREIGN KEY ("budgetLineId") REFERENCES "project_budget_lines"("id") ON DELETE SET NULL ON UPDATE CASCADE;
