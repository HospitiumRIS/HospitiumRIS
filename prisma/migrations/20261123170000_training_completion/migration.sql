-- Completion engine (#96). Additive; all rules default off (manual completion).

-- AlterEnum
ALTER TYPE "TrainingRegistrationStatus" ADD VALUE IF NOT EXISTS 'NOT_COMPLETED';

-- CreateEnum
CREATE TYPE "TrainingModuleCompletionMode" AS ENUM ('ADMIN', 'SELF', 'ON_SESSION_ATTENDANCE', 'ON_ASSESSMENT_PASS');

-- AlterTable
ALTER TABLE "trainings" ADD COLUMN "minAttendancePercent" INTEGER;
ALTER TABLE "trainings" ADD COLUMN "requireAllModules" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "trainings" ADD COLUMN "requireAssessmentPass" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "trainings" ADD COLUMN "requireFeedback" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "trainings" ADD COLUMN "completionGraceDays" INTEGER NOT NULL DEFAULT 7;

ALTER TABLE "training_modules" ADD COLUMN "completionMode" "TrainingModuleCompletionMode" NOT NULL DEFAULT 'ADMIN';
ALTER TABLE "training_modules" ADD COLUMN "isRequired" BOOLEAN NOT NULL DEFAULT true;

ALTER TABLE "training_registrations" ADD COLUMN "completedAt" TIMESTAMP(3);
ALTER TABLE "training_registrations" ADD COLUMN "completionOverride" JSONB;

-- Existing completions: best known completion time.
UPDATE "training_registrations" SET "completedAt" = "updatedAt" WHERE "status" = 'COMPLETED' AND "completedAt" IS NULL;
