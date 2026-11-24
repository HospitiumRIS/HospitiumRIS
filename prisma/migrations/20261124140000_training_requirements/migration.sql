-- Training requirements and compliance exemptions (compliance v2)
CREATE TABLE "training_requirements" (
    "id" TEXT NOT NULL,
    "institutionId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "departments" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "validityMonths" INTEGER,
    "dueWithinDays" INTEGER NOT NULL DEFAULT 30,
    "autoAssign" BOOLEAN NOT NULL DEFAULT true,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "training_requirements_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "training_requirements_institutionId_idx" ON "training_requirements"("institutionId");

CREATE TABLE "training_compliance_exemptions" (
    "id" TEXT NOT NULL,
    "institutionId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "requirementId" TEXT,
    "registrationId" TEXT,
    "reason" TEXT NOT NULL,
    "createdBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "training_compliance_exemptions_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "training_compliance_exemptions_institutionId_idx" ON "training_compliance_exemptions"("institutionId");
CREATE INDEX "training_compliance_exemptions_userId_idx" ON "training_compliance_exemptions"("userId");

ALTER TABLE "trainings" ADD COLUMN "requirementId" TEXT;
ALTER TABLE "trainings" ADD CONSTRAINT "trainings_requirementId_fkey" FOREIGN KEY ("requirementId") REFERENCES "training_requirements"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "training_compliance_exemptions" ADD CONSTRAINT "training_compliance_exemptions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "training_compliance_exemptions" ADD CONSTRAINT "training_compliance_exemptions_requirementId_fkey" FOREIGN KEY ("requirementId") REFERENCES "training_requirements"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "training_compliance_exemptions" ADD CONSTRAINT "training_compliance_exemptions_registrationId_fkey" FOREIGN KEY ("registrationId") REFERENCES "training_registrations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
