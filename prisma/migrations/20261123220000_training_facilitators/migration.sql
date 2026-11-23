-- Training facilitators (#104)
CREATE TYPE "TrainingFacilitatorRole" AS ENUM ('LEAD', 'CO_FACILITATOR', 'GUEST');

CREATE TABLE "training_facilitators" (
    "id" TEXT NOT NULL,
    "trainingId" TEXT NOT NULL,
    "sessionId" TEXT,
    "userId" TEXT,
    "name" TEXT,
    "email" TEXT,
    "title" TEXT,
    "role" "TrainingFacilitatorRole" NOT NULL DEFAULT 'CO_FACILITATOR',
    "showOnCertificate" BOOLEAN NOT NULL DEFAULT true,
    "createdBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "training_facilitators_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "training_facilitators_trainingId_idx" ON "training_facilitators"("trainingId");
CREATE INDEX "training_facilitators_sessionId_idx" ON "training_facilitators"("sessionId");
CREATE INDEX "training_facilitators_userId_idx" ON "training_facilitators"("userId");

ALTER TABLE "training_facilitators" ADD CONSTRAINT "training_facilitators_trainingId_fkey" FOREIGN KEY ("trainingId") REFERENCES "trainings"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "training_facilitators" ADD CONSTRAINT "training_facilitators_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "training_sessions"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "training_facilitators" ADD CONSTRAINT "training_facilitators_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
