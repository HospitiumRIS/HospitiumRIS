-- Soft delete lifecycle for users
ALTER TYPE "UserStatus" ADD VALUE IF NOT EXISTS 'DELETED';

ALTER TABLE "users"
  ADD COLUMN "deletedAt" TIMESTAMP(3),
  ADD COLUMN "deletedById" TEXT,
  ADD COLUMN "statusBeforeDelete" "UserStatus",
  ADD COLUMN "anonymizedAt" TIMESTAMP(3);

CREATE INDEX "users_status_deletedAt_idx" ON "users"("status", "deletedAt");
