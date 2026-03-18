-- CreateEnum
CREATE TYPE "public"."EthicsApplicationStatus" AS ENUM ('DRAFT', 'SUBMITTED', 'UNDER_REVIEW', 'APPROVED', 'CONDITIONAL_APPROVAL', 'REJECTED', 'REVISION_REQUESTED', 'WITHDRAWN', 'EXPIRED');

-- CreateEnum
CREATE TYPE "public"."GrantApplicationStatus" AS ENUM ('PREPARING', 'READY_TO_SUBMIT', 'SUBMITTED', 'UNDER_REVIEW', 'ADDITIONAL_INFO_REQUESTED', 'AWARDED', 'REJECTED', 'WITHDRAWN');

-- CreateTable
CREATE TABLE "public"."ethics_applications" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "principalInvestigator" TEXT NOT NULL,
    "principalInvestigatorId" TEXT,
    "department" TEXT NOT NULL,
    "researchType" TEXT NOT NULL,
    "researchSummary" TEXT NOT NULL,
    "researchObjectives" TEXT NOT NULL,
    "methodology" TEXT NOT NULL,
    "studyDuration" TEXT,
    "participantPopulation" TEXT NOT NULL,
    "participantCount" INTEGER,
    "ageRange" TEXT,
    "inclusionCriteria" TEXT,
    "exclusionCriteria" TEXT,
    "recruitmentMethod" TEXT,
    "vulnerablePopulations" BOOLEAN NOT NULL DEFAULT false,
    "vulnerablePopulationDesc" TEXT,
    "riskLevel" TEXT NOT NULL,
    "potentialRisks" TEXT NOT NULL,
    "riskMitigation" TEXT NOT NULL,
    "potentialBenefits" TEXT NOT NULL,
    "riskBenefitRatio" TEXT,
    "consentProcess" TEXT NOT NULL,
    "consentFormAttached" BOOLEAN NOT NULL DEFAULT false,
    "informationSheetAttached" BOOLEAN NOT NULL DEFAULT false,
    "consentWaiverRequested" BOOLEAN NOT NULL DEFAULT false,
    "consentWaiverJustification" TEXT,
    "dataCollectionMethods" TEXT NOT NULL,
    "dataStorageMethods" TEXT NOT NULL,
    "dataSecurityMeasures" TEXT NOT NULL,
    "dataRetentionPeriod" TEXT,
    "dataAnonymization" BOOLEAN NOT NULL DEFAULT false,
    "dataSharingPlans" TEXT,
    "status" "public"."EthicsApplicationStatus" NOT NULL DEFAULT 'DRAFT',
    "referenceNumber" TEXT,
    "committeeId" TEXT,
    "committeeName" TEXT,
    "submittedDate" TIMESTAMP(3),
    "reviewDate" TIMESTAMP(3),
    "approvalDate" TIMESTAMP(3),
    "expiryDate" TIMESTAMP(3),
    "approvalConditions" TEXT,
    "conditionsMet" BOOLEAN NOT NULL DEFAULT false,
    "documents" JSONB[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ethics_applications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."ethics_reviews" (
    "id" TEXT NOT NULL,
    "ethicsApplicationId" TEXT NOT NULL,
    "reviewerId" TEXT NOT NULL,
    "reviewerName" TEXT NOT NULL,
    "reviewerRole" TEXT,
    "decision" TEXT NOT NULL,
    "overallComments" TEXT NOT NULL,
    "ethicalConcerns" TEXT,
    "riskAssessmentReview" TEXT,
    "consentReview" TEXT,
    "dataProtectionReview" TEXT,
    "recommendations" TEXT,
    "conditions" TEXT,
    "reviewDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ethics_reviews_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."ethics_amendments" (
    "id" TEXT NOT NULL,
    "ethicsApplicationId" TEXT NOT NULL,
    "amendmentNumber" INTEGER NOT NULL,
    "amendmentType" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "justification" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "submittedDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "reviewedDate" TIMESTAMP(3),
    "approvalDate" TIMESTAMP(3),
    "documents" JSONB[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ethics_amendments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."proposal_ethics_links" (
    "id" TEXT NOT NULL,
    "proposalId" TEXT NOT NULL,
    "ethicsApplicationId" TEXT NOT NULL,
    "linkedDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "linkedBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "proposal_ethics_links_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."grant_applications" (
    "id" TEXT NOT NULL,
    "proposalId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "grantorName" TEXT NOT NULL,
    "grantorEmail" TEXT NOT NULL,
    "grantorContactPerson" TEXT,
    "grantorPhone" TEXT,
    "grantProgram" TEXT,
    "grantOpportunityId" TEXT,
    "applicationTitle" TEXT NOT NULL,
    "requestedAmount" DECIMAL(15,2) NOT NULL,
    "submissionDeadline" TIMESTAMP(3),
    "applicationDate" TIMESTAMP(3),
    "status" "public"."GrantApplicationStatus" NOT NULL DEFAULT 'PREPARING',
    "stage" TEXT NOT NULL DEFAULT 'preparation',
    "priority" TEXT NOT NULL DEFAULT 'Medium',
    "requirements" JSONB,
    "notes" TEXT,
    "grantInstitutionEmail" TEXT NOT NULL,
    "emailThreadId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "submittedAt" TIMESTAMP(3),

    CONSTRAINT "grant_applications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."grant_communications" (
    "id" TEXT NOT NULL,
    "grantApplicationId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "direction" TEXT,
    "fromEmail" TEXT,
    "fromName" TEXT,
    "toEmail" TEXT,
    "toName" TEXT,
    "ccEmails" TEXT[],
    "subject" TEXT,
    "body" TEXT,
    "htmlBody" TEXT,
    "participantName" TEXT,
    "participantEmail" TEXT,
    "duration" INTEGER,
    "location" TEXT,
    "summary" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "attachments" JSONB[],
    "followUpRequired" BOOLEAN NOT NULL DEFAULT false,
    "followUpDate" TIMESTAMP(3),
    "followUpCompleted" BOOLEAN NOT NULL DEFAULT false,
    "followUpNotes" TEXT,
    "emailMessageId" TEXT,
    "emailInReplyTo" TEXT,
    "emailReferences" TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "grant_communications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."grant_milestones" (
    "id" TEXT NOT NULL,
    "grantApplicationId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "dueDate" TIMESTAMP(3),
    "completedDate" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "grant_milestones_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."grant_awards" (
    "id" TEXT NOT NULL,
    "grantApplicationId" TEXT NOT NULL,
    "awardedAmount" DECIMAL(15,2) NOT NULL,
    "awardDate" TIMESTAMP(3) NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "grantNumber" TEXT,
    "contractSigned" BOOLEAN NOT NULL DEFAULT false,
    "contractDate" TIMESTAMP(3),
    "reportingSchedule" JSONB,
    "complianceRequirements" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "grant_awards_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."grant_reports" (
    "id" TEXT NOT NULL,
    "grantAwardId" TEXT NOT NULL,
    "reportType" TEXT NOT NULL,
    "reportingPeriodStart" TIMESTAMP(3) NOT NULL,
    "reportingPeriodEnd" TIMESTAMP(3) NOT NULL,
    "dueDate" TIMESTAMP(3) NOT NULL,
    "submittedDate" TIMESTAMP(3),
    "content" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "documents" JSONB[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "grant_reports_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ethics_applications_referenceNumber_key" ON "public"."ethics_applications"("referenceNumber");

-- CreateIndex
CREATE UNIQUE INDEX "ethics_amendments_ethicsApplicationId_amendmentNumber_key" ON "public"."ethics_amendments"("ethicsApplicationId", "amendmentNumber");

-- CreateIndex
CREATE UNIQUE INDEX "proposal_ethics_links_proposalId_ethicsApplicationId_key" ON "public"."proposal_ethics_links"("proposalId", "ethicsApplicationId");

-- CreateIndex
CREATE UNIQUE INDEX "grant_awards_grantApplicationId_key" ON "public"."grant_awards"("grantApplicationId");

-- AddForeignKey
ALTER TABLE "public"."ethics_reviews" ADD CONSTRAINT "ethics_reviews_ethicsApplicationId_fkey" FOREIGN KEY ("ethicsApplicationId") REFERENCES "public"."ethics_applications"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ethics_amendments" ADD CONSTRAINT "ethics_amendments_ethicsApplicationId_fkey" FOREIGN KEY ("ethicsApplicationId") REFERENCES "public"."ethics_applications"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."proposal_ethics_links" ADD CONSTRAINT "proposal_ethics_links_proposalId_fkey" FOREIGN KEY ("proposalId") REFERENCES "public"."proposals"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."proposal_ethics_links" ADD CONSTRAINT "proposal_ethics_links_ethicsApplicationId_fkey" FOREIGN KEY ("ethicsApplicationId") REFERENCES "public"."ethics_applications"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."grant_applications" ADD CONSTRAINT "grant_applications_proposalId_fkey" FOREIGN KEY ("proposalId") REFERENCES "public"."proposals"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."grant_communications" ADD CONSTRAINT "grant_communications_grantApplicationId_fkey" FOREIGN KEY ("grantApplicationId") REFERENCES "public"."grant_applications"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."grant_milestones" ADD CONSTRAINT "grant_milestones_grantApplicationId_fkey" FOREIGN KEY ("grantApplicationId") REFERENCES "public"."grant_applications"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."grant_awards" ADD CONSTRAINT "grant_awards_grantApplicationId_fkey" FOREIGN KEY ("grantApplicationId") REFERENCES "public"."grant_applications"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."grant_reports" ADD CONSTRAINT "grant_reports_grantAwardId_fkey" FOREIGN KEY ("grantAwardId") REFERENCES "public"."grant_awards"("id") ON DELETE CASCADE ON UPDATE CASCADE;
