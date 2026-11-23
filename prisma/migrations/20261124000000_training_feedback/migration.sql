-- Feedback (#106)
CREATE TABLE "training_feedback_forms" (
    "id" TEXT NOT NULL,
    "institutionId" TEXT NOT NULL,
    "trainingId" TEXT,
    "title" TEXT NOT NULL DEFAULT 'Training feedback',
    "intro" TEXT,
    "questions" JSONB NOT NULL DEFAULT '[]',
    "anonymousToFacilitators" BOOLEAN NOT NULL DEFAULT true,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "training_feedback_forms_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "training_feedback_responses" (
    "id" TEXT NOT NULL,
    "trainingId" TEXT NOT NULL,
    "formId" TEXT NOT NULL,
    "registrationId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "answers" JSONB NOT NULL DEFAULT '{}',
    "submittedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "training_feedback_responses_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "training_feedback_forms_trainingId_key" ON "training_feedback_forms"("trainingId");
CREATE INDEX "training_feedback_forms_institutionId_idx" ON "training_feedback_forms"("institutionId");
CREATE UNIQUE INDEX "training_feedback_responses_registrationId_key" ON "training_feedback_responses"("registrationId");
CREATE INDEX "training_feedback_responses_trainingId_idx" ON "training_feedback_responses"("trainingId");

ALTER TABLE "training_feedback_forms" ADD CONSTRAINT "training_feedback_forms_trainingId_fkey" FOREIGN KEY ("trainingId") REFERENCES "trainings"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "training_feedback_responses" ADD CONSTRAINT "training_feedback_responses_trainingId_fkey" FOREIGN KEY ("trainingId") REFERENCES "trainings"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "training_feedback_responses" ADD CONSTRAINT "training_feedback_responses_formId_fkey" FOREIGN KEY ("formId") REFERENCES "training_feedback_forms"("id") ON DELETE NO ACTION ON UPDATE CASCADE;
ALTER TABLE "training_feedback_responses" ADD CONSTRAINT "training_feedback_responses_registrationId_fkey" FOREIGN KEY ("registrationId") REFERENCES "training_registrations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
