-- CreateEnum
CREATE TYPE "public"."DomainStatus" AS ENUM ('PENDING', 'VERIFIED', 'SUSPENDED');

-- CreateEnum
CREATE TYPE "public"."ReviewStageType" AS ENUM ('ADMINISTRATIVE_REVIEW', 'SCIENTIFIC_REVIEW', 'IRB_ETHICS_REVIEW', 'BIOSAFETY_REVIEW', 'RADIATION_SAFETY_REVIEW', 'CONFLICT_OF_INTEREST_REVIEW', 'SPONSORED_PROGRAMS_REVIEW', 'CLINICAL_TRIALS_REVIEW', 'CUSTOM');

-- CreateEnum
CREATE TYPE "public"."ReviewStageStatus" AS ENUM ('NOT_STARTED', 'IN_PROGRESS', 'APPROVED', 'APPROVED_WITH_CONTINGENCIES', 'DEFERRED', 'DISAPPROVED', 'SKIPPED');

-- CreateEnum
CREATE TYPE "public"."WorkflowType" AS ENUM ('CLINICAL_TRIAL', 'RESEARCH_PROPOSAL', 'ETHICS_APPLICATION', 'CUSTOM');

-- CreateEnum
CREATE TYPE "public"."ValidationParameterType" AS ENUM ('FIELD_COMPLETENESS', 'DOCUMENT_REQUIREMENTS', 'BUDGET_VALIDATION', 'TIMELINE_VALIDATION', 'RISK_ASSESSMENT', 'REGULATORY_COMPLIANCE', 'TEAM_QUALIFICATIONS', 'CUSTOM_RULE');

-- CreateEnum
CREATE TYPE "public"."WorkflowExecutionStatus" AS ENUM ('PENDING', 'IN_PROGRESS', 'COMPLETED', 'FAILED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "public"."StageExecutionStatus" AS ENUM ('NOT_STARTED', 'AUTO_CHECKING', 'AWAITING_REVIEW', 'IN_REVIEW', 'APPROVED', 'REJECTED', 'REQUIRES_CHANGES', 'SKIPPED');

-- CreateEnum
CREATE TYPE "public"."ReviewerRoleType" AS ENUM ('PRIMARY_REVIEWER', 'SECONDARY_REVIEWER', 'COMMITTEE_CHAIR', 'TECHNICAL_REVIEWER', 'ETHICS_REVIEWER', 'SAFETY_REVIEWER', 'SCIENTIFIC_REVIEWER', 'CUSTOM');

-- CreateTable
CREATE TABLE "public"."verified_domains" (
    "id" TEXT NOT NULL,
    "institutionId" TEXT NOT NULL,
    "domain" TEXT NOT NULL,
    "status" "public"."DomainStatus" NOT NULL DEFAULT 'PENDING',
    "verifiedAt" TIMESTAMP(3),
    "verifiedBy" TEXT,
    "verificationMethod" TEXT,
    "verificationToken" TEXT,
    "verificationData" JSONB,
    "autoApproveUsers" BOOLEAN NOT NULL DEFAULT false,
    "allowedAccountTypes" TEXT[],
    "notes" TEXT,
    "suspendedAt" TIMESTAMP(3),
    "suspendedBy" TEXT,
    "suspensionReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "verified_domains_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."proposal_review_pipelines" (
    "id" TEXT NOT NULL,
    "institutionId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "proposal_review_pipelines_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."proposal_review_stages" (
    "id" TEXT NOT NULL,
    "pipelineId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "stageType" "public"."ReviewStageType" NOT NULL,
    "order" INTEGER NOT NULL,
    "isRequired" BOOLEAN NOT NULL DEFAULT true,
    "autoApprove" BOOLEAN NOT NULL DEFAULT false,
    "daysToComplete" INTEGER,
    "reviewerRoles" TEXT[],
    "reviewerEmails" TEXT[],
    "requiresAllReviewers" BOOLEAN NOT NULL DEFAULT false,
    "minimumApprovals" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "proposal_review_stages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."proposal_review_tracking" (
    "id" TEXT NOT NULL,
    "proposalId" TEXT NOT NULL,
    "pipelineId" TEXT NOT NULL,
    "currentStageId" TEXT,
    "currentStageOrder" INTEGER NOT NULL DEFAULT 1,
    "overallStatus" TEXT NOT NULL DEFAULT 'NOT_STARTED',
    "startedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "proposal_review_tracking_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."proposal_stage_progress" (
    "id" TEXT NOT NULL,
    "trackingId" TEXT NOT NULL,
    "stageId" TEXT NOT NULL,
    "status" "public"."ReviewStageStatus" NOT NULL DEFAULT 'NOT_STARTED',
    "startedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "outcome" TEXT,
    "conditions" TEXT,
    "rejectionReason" TEXT,
    "assignedReviewers" TEXT[],
    "completedReviewers" TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "proposal_stage_progress_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."proposal_stage_reviews" (
    "id" TEXT NOT NULL,
    "stageProgressId" TEXT NOT NULL,
    "stageId" TEXT NOT NULL,
    "reviewerId" TEXT NOT NULL,
    "reviewerName" TEXT NOT NULL,
    "reviewerEmail" TEXT NOT NULL,
    "reviewerRole" TEXT,
    "decision" "public"."ReviewStageStatus" NOT NULL,
    "comments" TEXT,
    "conditions" TEXT,
    "reviewDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "proposal_stage_reviews_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."auto_review_workflows" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "type" "public"."WorkflowType" NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "autoRouteOnPass" BOOLEAN NOT NULL DEFAULT false,
    "requireHumanReview" BOOLEAN NOT NULL DEFAULT true,
    "createdBy" TEXT,
    "version" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "auto_review_workflows_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."auto_review_stages" (
    "id" TEXT NOT NULL,
    "workflowId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "order" INTEGER NOT NULL,
    "isRequired" BOOLEAN NOT NULL DEFAULT true,
    "allowSkip" BOOLEAN NOT NULL DEFAULT false,
    "autoApproveOnPass" BOOLEAN NOT NULL DEFAULT false,
    "daysToComplete" INTEGER,
    "requiresAllReviewers" BOOLEAN NOT NULL DEFAULT false,
    "minimumApprovals" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "auto_review_stages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."validation_parameters" (
    "id" TEXT NOT NULL,
    "stageId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" "public"."ValidationParameterType" NOT NULL,
    "config" JSONB NOT NULL,
    "isRequired" BOOLEAN NOT NULL DEFAULT true,
    "failOnError" BOOLEAN NOT NULL DEFAULT true,
    "weight" INTEGER NOT NULL DEFAULT 1,
    "errorMessage" TEXT,
    "successMessage" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "validation_parameters_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."reviewer_roles" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" "public"."ReviewerRoleType" NOT NULL,
    "description" TEXT,
    "canApprove" BOOLEAN NOT NULL DEFAULT true,
    "canReject" BOOLEAN NOT NULL DEFAULT true,
    "canRequestChange" BOOLEAN NOT NULL DEFAULT true,
    "canComment" BOOLEAN NOT NULL DEFAULT true,
    "canOverride" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "reviewer_roles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."stage_reviewers" (
    "id" TEXT NOT NULL,
    "stageId" TEXT NOT NULL,
    "userId" TEXT,
    "roleId" TEXT NOT NULL,
    "externalEmail" TEXT,
    "externalName" TEXT,
    "isRequired" BOOLEAN NOT NULL DEFAULT true,
    "order" INTEGER NOT NULL DEFAULT 0,
    "invitedAt" TIMESTAMP(3),
    "acceptedAt" TIMESTAMP(3),
    "declinedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "stage_reviewers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."workflow_executions" (
    "id" TEXT NOT NULL,
    "workflowId" TEXT NOT NULL,
    "submissionType" TEXT NOT NULL,
    "submissionId" TEXT NOT NULL,
    "status" "public"."WorkflowExecutionStatus" NOT NULL DEFAULT 'PENDING',
    "currentStage" INTEGER,
    "overallScore" DOUBLE PRECISION DEFAULT 0,
    "autoChecksPassed" BOOLEAN NOT NULL DEFAULT false,
    "finalDecision" TEXT,
    "startedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "workflow_executions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."stage_executions" (
    "id" TEXT NOT NULL,
    "executionId" TEXT NOT NULL,
    "stageId" TEXT NOT NULL,
    "status" "public"."StageExecutionStatus" NOT NULL DEFAULT 'NOT_STARTED',
    "stageOrder" INTEGER NOT NULL,
    "autoChecksPassed" BOOLEAN NOT NULL DEFAULT false,
    "score" DOUBLE PRECISION DEFAULT 0,
    "totalReviewers" INTEGER NOT NULL DEFAULT 0,
    "completedReviewers" INTEGER NOT NULL DEFAULT 0,
    "approvals" INTEGER NOT NULL DEFAULT 0,
    "rejections" INTEGER NOT NULL DEFAULT 0,
    "startedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "stage_executions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."validation_results" (
    "id" TEXT NOT NULL,
    "stageExecutionId" TEXT NOT NULL,
    "parameterId" TEXT NOT NULL,
    "passed" BOOLEAN NOT NULL,
    "score" DOUBLE PRECISION DEFAULT 0,
    "message" TEXT,
    "details" JSONB,
    "executedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "validation_results_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."review_decisions" (
    "id" TEXT NOT NULL,
    "stageExecutionId" TEXT NOT NULL,
    "reviewerId" TEXT NOT NULL,
    "decision" TEXT NOT NULL,
    "comments" TEXT,
    "conditions" TEXT,
    "overrideAutoReview" BOOLEAN NOT NULL DEFAULT false,
    "overrideReason" TEXT,
    "reviewedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "review_decisions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "verified_domains_verificationToken_key" ON "public"."verified_domains"("verificationToken");

-- CreateIndex
CREATE UNIQUE INDEX "verified_domains_institutionId_domain_key" ON "public"."verified_domains"("institutionId", "domain");

-- CreateIndex
CREATE UNIQUE INDEX "proposal_review_stages_pipelineId_order_key" ON "public"."proposal_review_stages"("pipelineId", "order");

-- CreateIndex
CREATE UNIQUE INDEX "proposal_review_tracking_proposalId_key" ON "public"."proposal_review_tracking"("proposalId");

-- CreateIndex
CREATE UNIQUE INDEX "proposal_stage_progress_trackingId_stageId_key" ON "public"."proposal_stage_progress"("trackingId", "stageId");

-- CreateIndex
CREATE UNIQUE INDEX "auto_review_stages_workflowId_order_key" ON "public"."auto_review_stages"("workflowId", "order");

-- CreateIndex
CREATE UNIQUE INDEX "reviewer_roles_name_key" ON "public"."reviewer_roles"("name");

-- CreateIndex
CREATE UNIQUE INDEX "workflow_executions_submissionType_submissionId_key" ON "public"."workflow_executions"("submissionType", "submissionId");

-- CreateIndex
CREATE UNIQUE INDEX "stage_executions_executionId_stageId_key" ON "public"."stage_executions"("executionId", "stageId");

-- AddForeignKey
ALTER TABLE "public"."verified_domains" ADD CONSTRAINT "verified_domains_institutionId_fkey" FOREIGN KEY ("institutionId") REFERENCES "public"."institutions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."proposal_review_stages" ADD CONSTRAINT "proposal_review_stages_pipelineId_fkey" FOREIGN KEY ("pipelineId") REFERENCES "public"."proposal_review_pipelines"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."proposal_review_tracking" ADD CONSTRAINT "proposal_review_tracking_proposalId_fkey" FOREIGN KEY ("proposalId") REFERENCES "public"."proposals"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."proposal_review_tracking" ADD CONSTRAINT "proposal_review_tracking_pipelineId_fkey" FOREIGN KEY ("pipelineId") REFERENCES "public"."proposal_review_pipelines"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."proposal_stage_progress" ADD CONSTRAINT "proposal_stage_progress_trackingId_fkey" FOREIGN KEY ("trackingId") REFERENCES "public"."proposal_review_tracking"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."proposal_stage_progress" ADD CONSTRAINT "proposal_stage_progress_stageId_fkey" FOREIGN KEY ("stageId") REFERENCES "public"."proposal_review_stages"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."proposal_stage_reviews" ADD CONSTRAINT "proposal_stage_reviews_stageProgressId_fkey" FOREIGN KEY ("stageProgressId") REFERENCES "public"."proposal_stage_progress"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."proposal_stage_reviews" ADD CONSTRAINT "proposal_stage_reviews_stageId_fkey" FOREIGN KEY ("stageId") REFERENCES "public"."proposal_review_stages"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."auto_review_stages" ADD CONSTRAINT "auto_review_stages_workflowId_fkey" FOREIGN KEY ("workflowId") REFERENCES "public"."auto_review_workflows"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."validation_parameters" ADD CONSTRAINT "validation_parameters_stageId_fkey" FOREIGN KEY ("stageId") REFERENCES "public"."auto_review_stages"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."stage_reviewers" ADD CONSTRAINT "stage_reviewers_stageId_fkey" FOREIGN KEY ("stageId") REFERENCES "public"."auto_review_stages"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."stage_reviewers" ADD CONSTRAINT "stage_reviewers_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "public"."reviewer_roles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."workflow_executions" ADD CONSTRAINT "workflow_executions_workflowId_fkey" FOREIGN KEY ("workflowId") REFERENCES "public"."auto_review_workflows"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."stage_executions" ADD CONSTRAINT "stage_executions_executionId_fkey" FOREIGN KEY ("executionId") REFERENCES "public"."workflow_executions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."stage_executions" ADD CONSTRAINT "stage_executions_stageId_fkey" FOREIGN KEY ("stageId") REFERENCES "public"."auto_review_stages"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."validation_results" ADD CONSTRAINT "validation_results_stageExecutionId_fkey" FOREIGN KEY ("stageExecutionId") REFERENCES "public"."stage_executions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."validation_results" ADD CONSTRAINT "validation_results_parameterId_fkey" FOREIGN KEY ("parameterId") REFERENCES "public"."validation_parameters"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."review_decisions" ADD CONSTRAINT "review_decisions_stageExecutionId_fkey" FOREIGN KEY ("stageExecutionId") REFERENCES "public"."stage_executions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."review_decisions" ADD CONSTRAINT "review_decisions_reviewerId_fkey" FOREIGN KEY ("reviewerId") REFERENCES "public"."stage_reviewers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
