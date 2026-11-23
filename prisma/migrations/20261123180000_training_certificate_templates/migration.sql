-- Certificate templates, certificate settings and CPD fields (#98). Additive.

-- CreateEnum
CREATE TYPE "TrainingCertificateMode" AS ENUM ('AUTO', 'REVIEW', 'MANUAL_UPLOAD');
CREATE TYPE "CertificateOrientation" AS ENUM ('LANDSCAPE', 'PORTRAIT');

-- CreateTable
CREATE TABLE "training_certificate_templates" (
    "id" TEXT NOT NULL,
    "institutionId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "orientation" "CertificateOrientation" NOT NULL DEFAULT 'LANDSCAPE',
    "primaryColor" TEXT NOT NULL DEFAULT '#8b6cbc',
    "titleText" TEXT NOT NULL,
    "bodyTemplate" TEXT NOT NULL,
    "footerText" TEXT,
    "logoDataUrl" TEXT,
    "backgroundDataUrl" TEXT,
    "signatories" JSONB NOT NULL DEFAULT '[]',
    "showQr" BOOLEAN NOT NULL DEFAULT true,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "createdBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "training_certificate_templates_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "training_certificate_templates_institutionId_idx" ON "training_certificate_templates"("institutionId");

-- AlterTable
ALTER TABLE "trainings" ADD COLUMN "certificateMode" "TrainingCertificateMode" NOT NULL DEFAULT 'REVIEW';
ALTER TABLE "trainings" ADD COLUMN "certificatePrefix" TEXT NOT NULL DEFAULT 'HRIS';
ALTER TABLE "trainings" ADD COLUMN "certificateTemplateId" TEXT;
ALTER TABLE "trainings" ADD COLUMN "certificateValidityMonths" INTEGER;
ALTER TABLE "trainings" ADD COLUMN "cpdHours" DOUBLE PRECISION;
ALTER TABLE "trainings" ADD COLUMN "cpdPoints" DOUBLE PRECISION;
ALTER TABLE "trainings" ADD COLUMN "accreditationBody" TEXT;
ALTER TABLE "trainings" ADD COLUMN "accreditationNumber" TEXT;
ALTER TABLE "trainings" ADD COLUMN "accreditationLogoDataUrl" TEXT;

-- Existing trainings keep today's behaviour: certificates are uploaded by an admin.
UPDATE "trainings" SET "certificateMode" = 'MANUAL_UPLOAD';

-- AddForeignKey
ALTER TABLE "trainings" ADD CONSTRAINT "trainings_certificateTemplateId_fkey" FOREIGN KEY ("certificateTemplateId") REFERENCES "training_certificate_templates"("id") ON DELETE SET NULL ON UPDATE CASCADE;
