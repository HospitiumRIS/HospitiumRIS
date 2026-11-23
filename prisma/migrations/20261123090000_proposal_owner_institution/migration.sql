-- Tenant isolation: record who created a proposal and which institution it belongs to.
-- Additive and nullable; existing rows are backfilled separately.

-- AlterTable
ALTER TABLE "proposals" ADD COLUMN "createdById" TEXT;
ALTER TABLE "proposals" ADD COLUMN "institutionId" TEXT;

-- CreateIndex
CREATE INDEX "proposals_createdById_idx" ON "proposals"("createdById");
CREATE INDEX "proposals_institutionId_status_idx" ON "proposals"("institutionId", "status");

-- AddForeignKey
ALTER TABLE "proposals" ADD CONSTRAINT "proposals_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "proposals" ADD CONSTRAINT "proposals_institutionId_fkey" FOREIGN KEY ("institutionId") REFERENCES "institutions"("id") ON DELETE SET NULL ON UPDATE CASCADE;
