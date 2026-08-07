-- Compliance migration: image integrity, CiteReady settings, ethics column cleanup.
-- Uses IF EXISTS / idempotent patterns so fresh Docker databases migrate cleanly.

-- CreateEnum
DO $$ BEGIN
  CREATE TYPE "public"."ImageIntegrityStatus" AS ENUM ('UPLOADING', 'UPLOADED', 'PROCESSING', 'COMPLETED', 'FAILED');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- AlterEnum
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_enum e
    JOIN pg_type t ON e.enumtypid = t.oid
    WHERE t.typname = 'SettingsType' AND e.enumlabel = 'CITEREADY'
  ) THEN
    ALTER TYPE "public"."SettingsType" ADD VALUE 'CITEREADY';
  END IF;
END $$;

-- AlterTable: drop legacy ethics columns if they exist (added outside official migrations on some dev DBs)
ALTER TABLE "public"."ethics_applications" DROP COLUMN IF EXISTS "additionalComments";
ALTER TABLE "public"."ethics_applications" DROP COLUMN IF EXISTS "coInvestigators";
ALTER TABLE "public"."ethics_applications" DROP COLUMN IF EXISTS "conflictDetails";
ALTER TABLE "public"."ethics_applications" DROP COLUMN IF EXISTS "conflictOfInterest";
ALTER TABLE "public"."ethics_applications" DROP COLUMN IF EXISTS "consentCapacityAssessment";
ALTER TABLE "public"."ethics_applications" DROP COLUMN IF EXISTS "dataDisposalProtocol";
ALTER TABLE "public"."ethics_applications" DROP COLUMN IF EXISTS "endDate";
ALTER TABLE "public"."ethics_applications" DROP COLUMN IF EXISTS "participantCosts";
ALTER TABLE "public"."ethics_applications" DROP COLUMN IF EXISTS "piInstitution";
ALTER TABLE "public"."ethics_applications" DROP COLUMN IF EXISTS "powerImbalanceConsiderations";
ALTER TABLE "public"."ethics_applications" DROP COLUMN IF EXISTS "previousApprovalDetails";
ALTER TABLE "public"."ethics_applications" DROP COLUMN IF EXISTS "previousEthicsApproval";
ALTER TABLE "public"."ethics_applications" DROP COLUMN IF EXISTS "researchTypeOther";
ALTER TABLE "public"."ethics_applications" DROP COLUMN IF EXISTS "startDate";
ALTER TABLE "public"."ethics_applications" DROP COLUMN IF EXISTS "withdrawalProcess";

-- CreateTable
CREATE TABLE IF NOT EXISTS "public"."image_integrity_cases" (
    "id" TEXT NOT NULL,
    "externalCaseId" TEXT,
    "title" TEXT NOT NULL,
    "contributor" TEXT,
    "doi" TEXT,
    "fileName" TEXT NOT NULL,
    "fileFormat" TEXT,
    "fileSizeBytes" INTEGER,
    "comparedGlobalRepository" BOOLEAN NOT NULL DEFAULT false,
    "status" "public"."ImageIntegrityStatus" NOT NULL DEFAULT 'UPLOADING',
    "analysisStatus" TEXT,
    "analysisProgress" INTEGER NOT NULL DEFAULT 0,
    "errorMessage" TEXT,
    "manipulationCount" INTEGER,
    "similarityCount" INTEGER,
    "similarityLevel" JSONB,
    "classification" JSONB,
    "pageAmount" INTEGER,
    "croppedAmount" INTEGER,
    "reportUrl" TEXT,
    "reportId" TEXT,
    "reportExpiresAt" TIMESTAMP(3),
    "submittedById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "analysisStartedAt" TIMESTAMP(3),
    "analysisCompletedAt" TIMESTAMP(3),

    CONSTRAINT "image_integrity_cases_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "image_integrity_cases_externalCaseId_key" ON "public"."image_integrity_cases"("externalCaseId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "image_integrity_cases_submittedById_idx" ON "public"."image_integrity_cases"("submittedById");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "image_integrity_cases_status_idx" ON "public"."image_integrity_cases"("status");

-- AddForeignKey
DO $$ BEGIN
  ALTER TABLE "public"."image_integrity_cases"
    ADD CONSTRAINT "image_integrity_cases_submittedById_fkey"
    FOREIGN KEY ("submittedById") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;
