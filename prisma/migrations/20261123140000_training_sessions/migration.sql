-- Training sessions + structured delivery mode (#91).
-- Additive. Backfills delivery fields from the legacy "location" string and creates
-- one session per existing training so attendance can be taken straight away.

-- CreateEnum
CREATE TYPE "TrainingDeliveryMode" AS ENUM ('IN_PERSON', 'ONLINE', 'HYBRID');
CREATE TYPE "TrainingSessionStatus" AS ENUM ('SCHEDULED', 'CANCELLED');

-- AlterTable
ALTER TABLE "trainings" ADD COLUMN "code" TEXT;
ALTER TABLE "trainings" ADD COLUMN "category" TEXT;
ALTER TABLE "trainings" ADD COLUMN "deliveryMode" "TrainingDeliveryMode" NOT NULL DEFAULT 'IN_PERSON';
ALTER TABLE "trainings" ADD COLUMN "venue" TEXT;
ALTER TABLE "trainings" ADD COLUMN "onlineLink" TEXT;

-- CreateTable
CREATE TABLE "training_sessions" (
    "id" TEXT NOT NULL,
    "trainingId" TEXT NOT NULL,
    "moduleId" TEXT,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "startsAt" TIMESTAMP(3) NOT NULL,
    "endsAt" TIMESTAMP(3) NOT NULL,
    "deliveryMode" "TrainingDeliveryMode" NOT NULL DEFAULT 'IN_PERSON',
    "venue" TEXT,
    "onlineLink" TEXT,
    "isAttendanceRequired" BOOLEAN NOT NULL DEFAULT true,
    "checkInOpensMinutesBefore" INTEGER NOT NULL DEFAULT 15,
    "checkInClosesMinutesAfter" INTEGER NOT NULL DEFAULT 30,
    "lateAfterMinutes" INTEGER NOT NULL DEFAULT 10,
    "status" "TrainingSessionStatus" NOT NULL DEFAULT 'SCHEDULED',
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "training_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "training_sessions_trainingId_startsAt_idx" ON "training_sessions"("trainingId", "startsAt");
CREATE INDEX "training_sessions_moduleId_idx" ON "training_sessions"("moduleId");

-- AddForeignKey
ALTER TABLE "training_sessions" ADD CONSTRAINT "training_sessions_trainingId_fkey" FOREIGN KEY ("trainingId") REFERENCES "trainings"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "training_sessions" ADD CONSTRAINT "training_sessions_moduleId_fkey" FOREIGN KEY ("moduleId") REFERENCES "training_modules"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Backfill delivery fields (same rules as deliveryFieldsFromLegacyLocation).
UPDATE "trainings"
SET "deliveryMode" = 'ONLINE', "onlineLink" = btrim("location")
WHERE "location" ~* '^\s*https?://';

UPDATE "trainings"
SET "deliveryMode" = 'HYBRID',
    "venue" = NULLIF(btrim(split_part("location", ' | ', 1)), ''),
    "onlineLink" = NULLIF(btrim(split_part("location", ' | ', 2)), '')
WHERE "location" LIKE '% | %' AND "location" !~* '^\s*https?://';

UPDATE "trainings"
SET "deliveryMode" = 'IN_PERSON', "venue" = NULLIF(btrim("location"), '')
WHERE "location" IS NOT NULL AND "location" NOT LIKE '% | %' AND "location" !~* '^\s*https?://';

-- One session per existing training, spanning its dates.
INSERT INTO "training_sessions" ("id", "trainingId", "title", "startsAt", "endsAt", "deliveryMode", "status", "order", "createdBy", "updatedAt")
SELECT
    'tses_' || replace(gen_random_uuid()::text, '-', ''),
    t."id",
    t."title",
    t."startDate",
    GREATEST(t."endDate", t."startDate" + interval '1 hour'),
    t."deliveryMode",
    CASE WHEN t."status" = 'CANCELLED' THEN 'CANCELLED'::"TrainingSessionStatus" ELSE 'SCHEDULED'::"TrainingSessionStatus" END,
    0,
    t."createdBy",
    CURRENT_TIMESTAMP
FROM "trainings" t
WHERE NOT EXISTS (SELECT 1 FROM "training_sessions" s WHERE s."trainingId" = t."id");
