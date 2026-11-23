-- Assessments (#105)
CREATE TYPE "TrainingAssessmentType" AS ENUM ('PRE_TEST', 'POST_TEST', 'QUIZ');
CREATE TYPE "TrainingQuestionType" AS ENUM ('SINGLE', 'MULTI', 'TRUE_FALSE', 'SHORT_TEXT');
CREATE TYPE "TrainingAttemptStatus" AS ENUM ('IN_PROGRESS', 'NEEDS_GRADING', 'GRADED');

CREATE TABLE "training_assessments" (
    "id" TEXT NOT NULL,
    "trainingId" TEXT NOT NULL,
    "moduleId" TEXT,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "type" "TrainingAssessmentType" NOT NULL DEFAULT 'QUIZ',
    "passMark" INTEGER NOT NULL DEFAULT 70,
    "maxAttempts" INTEGER,
    "timeLimitMinutes" INTEGER,
    "shuffleQuestions" BOOLEAN NOT NULL DEFAULT false,
    "shuffleOptions" BOOLEAN NOT NULL DEFAULT false,
    "showCorrectAnswers" BOOLEAN NOT NULL DEFAULT true,
    "availableFrom" TIMESTAMP(3),
    "availableUntil" TIMESTAMP(3),
    "isRequiredForCompletion" BOOLEAN NOT NULL DEFAULT false,
    "isPublished" BOOLEAN NOT NULL DEFAULT false,
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "training_assessments_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "training_assessment_questions" (
    "id" TEXT NOT NULL,
    "assessmentId" TEXT NOT NULL,
    "type" "TrainingQuestionType" NOT NULL DEFAULT 'SINGLE',
    "prompt" TEXT NOT NULL,
    "options" JSONB NOT NULL DEFAULT '[]',
    "correct" JSONB NOT NULL DEFAULT '[]',
    "points" DOUBLE PRECISION NOT NULL DEFAULT 1,
    "explanation" TEXT,
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "training_assessment_questions_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "training_assessment_attempts" (
    "id" TEXT NOT NULL,
    "assessmentId" TEXT NOT NULL,
    "registrationId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "attemptNumber" INTEGER NOT NULL,
    "status" "TrainingAttemptStatus" NOT NULL DEFAULT 'IN_PROGRESS',
    "layout" JSONB NOT NULL DEFAULT '[]',
    "answers" JSONB NOT NULL DEFAULT '{}',
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deadlineAt" TIMESTAMP(3),
    "submittedAt" TIMESTAMP(3),
    "score" DOUBLE PRECISION,
    "maxScore" DOUBLE PRECISION,
    "percent" DOUBLE PRECISION,
    "passed" BOOLEAN,
    "feedback" JSONB,
    "gradedBy" TEXT,
    "gradedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "training_assessment_attempts_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "training_assessments_trainingId_idx" ON "training_assessments"("trainingId");
CREATE INDEX "training_assessment_questions_assessmentId_order_idx" ON "training_assessment_questions"("assessmentId", "order");
CREATE UNIQUE INDEX "training_assessment_attempts_number_key" ON "training_assessment_attempts"("assessmentId", "registrationId", "attemptNumber");
CREATE INDEX "training_assessment_attempts_registrationId_idx" ON "training_assessment_attempts"("registrationId");
CREATE INDEX "training_assessment_attempts_assessmentId_status_idx" ON "training_assessment_attempts"("assessmentId", "status");

ALTER TABLE "training_assessments" ADD CONSTRAINT "training_assessments_trainingId_fkey" FOREIGN KEY ("trainingId") REFERENCES "trainings"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "training_assessments" ADD CONSTRAINT "training_assessments_moduleId_fkey" FOREIGN KEY ("moduleId") REFERENCES "training_modules"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "training_assessment_questions" ADD CONSTRAINT "training_assessment_questions_assessmentId_fkey" FOREIGN KEY ("assessmentId") REFERENCES "training_assessments"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "training_assessment_attempts" ADD CONSTRAINT "training_assessment_attempts_assessmentId_fkey" FOREIGN KEY ("assessmentId") REFERENCES "training_assessments"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "training_assessment_attempts" ADD CONSTRAINT "training_assessment_attempts_registrationId_fkey" FOREIGN KEY ("registrationId") REFERENCES "training_registrations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
