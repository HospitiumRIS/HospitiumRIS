-- CreateEnum
CREATE TYPE "public"."ProposalStatus" AS ENUM ('DRAFT', 'SUBMITTED', 'UNDER_REVIEW', 'APPROVED', 'REJECTED', 'REVISION_REQUESTED');

-- CreateTable
CREATE TABLE "public"."proposals" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "principalInvestigator" TEXT NOT NULL,
    "principalInvestigatorOrcid" TEXT,
    "coInvestigators" JSONB[],
    "departments" TEXT[],
    "startDate" TIMESTAMP(3),
    "endDate" TIMESTAMP(3),
    "researchAreas" TEXT[],
    "researchObjectives" TEXT,
    "methodology" TEXT,
    "abstract" TEXT,
    "milestones" JSONB[],
    "deliverables" JSONB[],
    "fundingSource" TEXT,
    "grantNumber" TEXT,
    "fundingInstitution" TEXT,
    "grantStartDate" TIMESTAMP(3),
    "grantEndDate" TIMESTAMP(3),
    "totalBudgetAmount" DECIMAL(15,2),
    "ethicalConsiderationsOverview" TEXT,
    "consentProcedures" TEXT,
    "dataSecurityMeasures" TEXT,
    "ethicsApprovalStatus" TEXT,
    "ethicsApprovalReference" TEXT,
    "ethicsCommittee" TEXT,
    "approvalDate" TIMESTAMP(3),
    "publicationRelevance" TEXT,
    "impactStatement" TEXT,
    "disseminationPlan" TEXT,
    "ethicsDocuments" JSONB[],
    "dataManagementPlan" JSONB[],
    "otherRelatedFiles" JSONB[],
    "status" "public"."ProposalStatus" NOT NULL DEFAULT 'DRAFT',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "proposals_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."proposal_publications" (
    "id" TEXT NOT NULL,
    "proposalId" TEXT NOT NULL,
    "publicationId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "proposal_publications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."proposal_manuscripts" (
    "id" TEXT NOT NULL,
    "proposalId" TEXT NOT NULL,
    "manuscriptId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "proposal_manuscripts_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "proposal_publications_proposalId_publicationId_key" ON "public"."proposal_publications"("proposalId", "publicationId");

-- CreateIndex
CREATE UNIQUE INDEX "proposal_manuscripts_proposalId_manuscriptId_key" ON "public"."proposal_manuscripts"("proposalId", "manuscriptId");

-- AddForeignKey
ALTER TABLE "public"."proposal_publications" ADD CONSTRAINT "proposal_publications_proposalId_fkey" FOREIGN KEY ("proposalId") REFERENCES "public"."proposals"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."proposal_publications" ADD CONSTRAINT "proposal_publications_publicationId_fkey" FOREIGN KEY ("publicationId") REFERENCES "public"."publications"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."proposal_manuscripts" ADD CONSTRAINT "proposal_manuscripts_proposalId_fkey" FOREIGN KEY ("proposalId") REFERENCES "public"."proposals"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."proposal_manuscripts" ADD CONSTRAINT "proposal_manuscripts_manuscriptId_fkey" FOREIGN KEY ("manuscriptId") REFERENCES "public"."manuscripts"("id") ON DELETE CASCADE ON UPDATE CASCADE;
