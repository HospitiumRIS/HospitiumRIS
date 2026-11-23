-- Enrolment controls (#102). Additive; existing trainings stay open, with no approval
-- and no waiting list.

-- AlterEnum
ALTER TYPE "TrainingRegistrationStatus" ADD VALUE IF NOT EXISTS 'PENDING_APPROVAL';
ALTER TYPE "TrainingRegistrationStatus" ADD VALUE IF NOT EXISTS 'WAITLISTED';
ALTER TYPE "TrainingRegistrationStatus" ADD VALUE IF NOT EXISTS 'REJECTED';

-- CreateEnum
CREATE TYPE "TrainingEligibilityMode" AS ENUM ('OPEN', 'DEPARTMENT_ONLY');

-- AlterTable
ALTER TABLE "trainings" ADD COLUMN "registrationOpensAt" TIMESTAMP(3);
ALTER TABLE "trainings" ADD COLUMN "registrationClosesAt" TIMESTAMP(3);
ALTER TABLE "trainings" ADD COLUMN "cancellationDeadline" TIMESTAMP(3);
ALTER TABLE "trainings" ADD COLUMN "requiresApproval" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "trainings" ADD COLUMN "waitlistEnabled" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "trainings" ADD COLUMN "eligibilityMode" "TrainingEligibilityMode" NOT NULL DEFAULT 'OPEN';
ALTER TABLE "trainings" ADD COLUMN "prerequisiteTrainingIds" TEXT[] DEFAULT ARRAY[]::TEXT[];

ALTER TABLE "training_registrations" ADD COLUMN "approvedBy" TEXT;
ALTER TABLE "training_registrations" ADD COLUMN "approvedAt" TIMESTAMP(3);
ALTER TABLE "training_registrations" ADD COLUMN "rejectedReason" TEXT;
ALTER TABLE "training_registrations" ADD COLUMN "cancelledAt" TIMESTAMP(3);
ALTER TABLE "training_registrations" ADD COLUMN "cancelReason" TEXT;
