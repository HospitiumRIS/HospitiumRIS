-- CreateEnum
CREATE TYPE "public"."InternalGrantStatus" AS ENUM ('DRAFT', 'SUBMITTED', 'INITIAL_REVIEW', 'COMMITTEE_REVIEW', 'APPROVED', 'PARTIALLY_APPROVED', 'REJECTED', 'REPORTING', 'CLOSED');

-- CreateTable
CREATE TABLE "public"."internal_grant_requests" (
    "id" TEXT NOT NULL,
    "applicantName" TEXT NOT NULL,
    "applicantEmail" TEXT NOT NULL,
    "department" TEXT NOT NULL,
    "position" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "requestedAmount" DECIMAL(15,2) NOT NULL,
    "approvedAmount" DECIMAL(15,2),
    "projectStartDate" TIMESTAMP(3),
    "projectEndDate" TIMESTAMP(3),
    "objectives" TEXT[],
    "methodology" TEXT,
    "expectedOutcomes" TEXT,
    "justification" TEXT,
    "status" "public"."InternalGrantStatus" NOT NULL DEFAULT 'DRAFT',
    "stage" TEXT NOT NULL DEFAULT 'intake',
    "decisionDate" TIMESTAMP(3),
    "decisionNotes" TEXT,
    "reportDueDate" TIMESTAMP(3),
    "reportSubmitted" BOOLEAN NOT NULL DEFAULT false,
    "reportNotes" TEXT,
    "submittedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "internal_grant_requests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."internal_grant_reviews" (
    "id" TEXT NOT NULL,
    "requestId" TEXT NOT NULL,
    "reviewerName" TEXT NOT NULL,
    "reviewerRole" TEXT NOT NULL,
    "stage" TEXT NOT NULL,
    "decision" TEXT NOT NULL,
    "score" INTEGER,
    "comments" TEXT NOT NULL,
    "reviewedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "internal_grant_reviews_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "public"."internal_grant_reviews" ADD CONSTRAINT "internal_grant_reviews_requestId_fkey" FOREIGN KEY ("requestId") REFERENCES "public"."internal_grant_requests"("id") ON DELETE CASCADE ON UPDATE CASCADE;
