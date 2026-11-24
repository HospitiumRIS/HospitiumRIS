-- Auto-review workflows belong to an institution (#9)
ALTER TABLE "auto_review_workflows" ADD COLUMN "institutionId" TEXT;
CREATE INDEX "auto_review_workflows_institutionId_idx" ON "auto_review_workflows"("institutionId");
ALTER TABLE "auto_review_workflows" ADD CONSTRAINT "auto_review_workflows_institutionId_fkey" FOREIGN KEY ("institutionId") REFERENCES "institutions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Backfill from the creator: their linked institution, else the institution they own.
UPDATE "auto_review_workflows" w
SET "institutionId" = COALESCE(
  u."secondaryInstitutionId",
  (SELECT i."id" FROM "institutions" i WHERE i."userId" = u."id" ORDER BY i."createdAt" LIMIT 1)
)
FROM "users" u
WHERE u."id" = w."createdBy" AND w."institutionId" IS NULL;

-- Workflows with no creator: if the platform has exactly one institution, it owns them.
UPDATE "auto_review_workflows"
SET "institutionId" = (SELECT "id" FROM "institutions" LIMIT 1)
WHERE "institutionId" IS NULL AND (SELECT COUNT(*) FROM "institutions") = 1;
