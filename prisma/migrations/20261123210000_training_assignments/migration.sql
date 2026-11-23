-- Assigned / mandatory trainings (#103)
CREATE TYPE "TrainingRegistrationSource" AS ENUM ('SELF', 'ASSIGNED', 'IMPORT');

ALTER TABLE "trainings" ADD COLUMN "isMandatory" BOOLEAN NOT NULL DEFAULT false;

ALTER TABLE "training_registrations"
  ADD COLUMN "source" "TrainingRegistrationSource" NOT NULL DEFAULT 'SELF',
  ADD COLUMN "assignedBy" TEXT,
  ADD COLUMN "assignedAt" TIMESTAMP(3),
  ADD COLUMN "dueDate" TIMESTAMP(3);

CREATE INDEX "training_registrations_source_dueDate_idx" ON "training_registrations"("source", "dueDate");
