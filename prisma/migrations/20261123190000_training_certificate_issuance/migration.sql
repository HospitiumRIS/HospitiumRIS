-- Certificate generation and issuance (#99). Additive, with a backfill of numbers and
-- verification codes for certificates that were uploaded before.

-- CreateEnum
CREATE TYPE "TrainingCertificateSource" AS ENUM ('GENERATED', 'UPLOADED');
CREATE TYPE "TrainingCertificateStatus" AS ENUM ('ISSUED', 'REVOKED');

-- AlterTable
ALTER TABLE "training_certificates" ADD COLUMN "certificateNumber" TEXT;
ALTER TABLE "training_certificates" ADD COLUMN "verificationCode" TEXT;
ALTER TABLE "training_certificates" ADD COLUMN "source" "TrainingCertificateSource" NOT NULL DEFAULT 'UPLOADED';
ALTER TABLE "training_certificates" ADD COLUMN "status" "TrainingCertificateStatus" NOT NULL DEFAULT 'ISSUED';
ALTER TABLE "training_certificates" ADD COLUMN "version" INTEGER NOT NULL DEFAULT 1;
ALTER TABLE "training_certificates" ADD COLUMN "templateId" TEXT;
ALTER TABLE "training_certificates" ADD COLUMN "snapshot" JSONB;
ALTER TABLE "training_certificates" ADD COLUMN "expiresAt" TIMESTAMP(3);
ALTER TABLE "training_certificates" ADD COLUMN "revokedAt" TIMESTAMP(3);
ALTER TABLE "training_certificates" ADD COLUMN "revokedBy" TEXT;
ALTER TABLE "training_certificates" ADD COLUMN "revokedReason" TEXT;
ALTER TABLE "training_certificates" ADD COLUMN "emailedAt" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "training_certificate_sequences" (
    "id" TEXT NOT NULL,
    "institutionId" TEXT NOT NULL,
    "prefix" TEXT NOT NULL,
    "year" INTEGER NOT NULL,
    "lastNumber" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "training_certificate_sequences_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "training_certificate_sequences_institutionId_prefix_year_key" ON "training_certificate_sequences"("institutionId", "prefix", "year");

-- Backfill: number existing certificates per institution, prefix and year of issue,
-- in issue order, and give each an unguessable verification code.
WITH numbered AS (
    SELECT c."id",
           t."institutionId",
           t."certificatePrefix" AS prefix,
           EXTRACT(YEAR FROM c."issuedAt")::int AS yr,
           ROW_NUMBER() OVER (PARTITION BY t."institutionId", t."certificatePrefix", EXTRACT(YEAR FROM c."issuedAt") ORDER BY c."issuedAt", c."id") AS seq
    FROM "training_certificates" c
    JOIN "trainings" t ON t."id" = c."trainingId"
)
UPDATE "training_certificates" c
SET "certificateNumber" = n.prefix || '-' || n.yr || '-' || LPAD(n.seq::text, 6, '0'),
    "verificationCode" = replace(gen_random_uuid()::text, '-', '') || substr(replace(gen_random_uuid()::text, '-', ''), 1, 8)
FROM numbered n
WHERE n."id" = c."id";

INSERT INTO "training_certificate_sequences" ("id", "institutionId", "prefix", "year", "lastNumber")
SELECT 'tcs_' || replace(gen_random_uuid()::text, '-', ''), t."institutionId", t."certificatePrefix", EXTRACT(YEAR FROM c."issuedAt")::int, COUNT(*)
FROM "training_certificates" c
JOIN "trainings" t ON t."id" = c."trainingId"
GROUP BY t."institutionId", t."certificatePrefix", EXTRACT(YEAR FROM c."issuedAt");

-- CreateIndex
CREATE UNIQUE INDEX "training_certificates_certificateNumber_key" ON "training_certificates"("certificateNumber");
CREATE UNIQUE INDEX "training_certificates_verificationCode_key" ON "training_certificates"("verificationCode");
