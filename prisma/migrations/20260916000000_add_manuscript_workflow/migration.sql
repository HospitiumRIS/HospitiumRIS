-- CreateEnum
CREATE TYPE "public"."SubmissionType" AS ENUM ('EXTERNAL', 'MANUAL', 'PREPRINT');

-- CreateEnum
CREATE TYPE "public"."SubmissionStatus" AS ENUM ('SUBMITTED', 'UNDER_REVIEW', 'REVISIONS_REQUESTED', 'ACCEPTED', 'REJECTED', 'WITHDRAWN');

-- AlterTable
ALTER TABLE "public"."manuscripts" ADD COLUMN     "archivedAt" TIMESTAMP(3),
ADD COLUMN     "publicationId" TEXT,
ADD COLUMN     "publishedAt" TIMESTAMP(3),
ADD COLUMN     "workflowMeta" JSONB;

-- CreateTable
CREATE TABLE "public"."manuscript_submissions" (
    "id" TEXT NOT NULL,
    "manuscriptId" TEXT NOT NULL,
    "type" "public"."SubmissionType" NOT NULL,
    "targetName" TEXT NOT NULL,
    "targetUrl" TEXT,
    "referenceId" TEXT,
    "status" "public"."SubmissionStatus" NOT NULL DEFAULT 'SUBMITTED',
    "submittedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "decidedAt" TIMESTAMP(3),
    "notes" TEXT,
    "createdBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "manuscript_submissions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "manuscript_submissions_manuscriptId_idx" ON "public"."manuscript_submissions"("manuscriptId");

-- AddForeignKey
ALTER TABLE "public"."manuscripts" ADD CONSTRAINT "manuscripts_publicationId_fkey" FOREIGN KEY ("publicationId") REFERENCES "public"."publications"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."manuscript_submissions" ADD CONSTRAINT "manuscript_submissions_manuscriptId_fkey" FOREIGN KEY ("manuscriptId") REFERENCES "public"."manuscripts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."manuscript_submissions" ADD CONSTRAINT "manuscript_submissions_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
