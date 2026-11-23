-- Training tenant scoping (#88): shared catalogue flag.
-- Additive; existing trainings default to own-institution only.

-- AlterTable
ALTER TABLE "trainings" ADD COLUMN "openToOtherInstitutions" BOOLEAN NOT NULL DEFAULT false;

-- CreateIndex
CREATE INDEX "trainings_institutionId_status_idx" ON "trainings"("institutionId", "status");
CREATE INDEX "trainings_status_openToOtherInstitutions_idx" ON "trainings"("status", "openToOtherInstitutions");
