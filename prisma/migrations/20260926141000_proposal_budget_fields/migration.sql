-- Budget currency and uploaded budget documents were added to the Prisma
-- model without a migration, so production creates failed when Prisma
-- selected columns that did not exist.

ALTER TABLE "public"."proposals"
ADD COLUMN IF NOT EXISTS "budgetCurrency" TEXT;

ALTER TABLE "public"."proposals"
ADD COLUMN IF NOT EXISTS "budgetDocuments" JSONB[];

ALTER TABLE "public"."proposals"
ALTER COLUMN "budgetDocuments" SET DEFAULT ARRAY[]::JSONB[];

UPDATE "public"."proposals"
SET "budgetDocuments" = ARRAY[]::JSONB[]
WHERE "budgetDocuments" IS NULL;
