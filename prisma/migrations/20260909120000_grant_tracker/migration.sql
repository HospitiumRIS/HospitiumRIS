-- CreateEnum
CREATE TYPE "public"."GrantTrackingStatus" AS ENUM ('NOT_APPLIED', 'APPLIED', 'AWARDED', 'REJECTED', 'CANCELLED');

-- AlterTable
ALTER TABLE "public"."proposals"
ADD COLUMN IF NOT EXISTS "grantTrackingStatus" "public"."GrantTrackingStatus" NOT NULL DEFAULT 'NOT_APPLIED',
ADD COLUMN IF NOT EXISTS "grantRequestedAmount" DECIMAL(15,2),
ADD COLUMN IF NOT EXISTS "grantAppliedOn" TIMESTAMP(3),
ADD COLUMN IF NOT EXISTS "grantDecisionOn" TIMESTAMP(3),
ADD COLUMN IF NOT EXISTS "grantFollowUpUserId" TEXT,
ADD COLUMN IF NOT EXISTS "grantTrackingNotes" TEXT,
ADD COLUMN IF NOT EXISTS "grantTrackingHistory" JSONB[] DEFAULT ARRAY[]::JSONB[];

-- CreateIndex
CREATE INDEX IF NOT EXISTS "proposals_grantFollowUpUserId_idx" ON "public"."proposals"("grantFollowUpUserId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "proposals_grantTrackingStatus_idx" ON "public"."proposals"("grantTrackingStatus");

-- AddForeignKey
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'proposals_grantFollowUpUserId_fkey'
  ) THEN
    ALTER TABLE "public"."proposals"
    ADD CONSTRAINT "proposals_grantFollowUpUserId_fkey"
    FOREIGN KEY ("grantFollowUpUserId") REFERENCES "public"."users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;
