-- Add missing fields to EthicsApplication table

-- PI Institution
ALTER TABLE "ethics_applications" ADD COLUMN IF NOT EXISTS "piInstitution" TEXT;

-- Co-Investigators (JSON array)
ALTER TABLE "ethics_applications" ADD COLUMN IF NOT EXISTS "coInvestigators" JSONB DEFAULT '[]';

-- Research Type Other
ALTER TABLE "ethics_applications" ADD COLUMN IF NOT EXISTS "researchTypeOther" TEXT;

-- Study Dates
ALTER TABLE "ethics_applications" ADD COLUMN IF NOT EXISTS "startDate" TEXT;
ALTER TABLE "ethics_applications" ADD COLUMN IF NOT EXISTS "endDate" TEXT;

-- Consent and Ethics Details
ALTER TABLE "ethics_applications" ADD COLUMN IF NOT EXISTS "powerImbalanceConsiderations" TEXT;
ALTER TABLE "ethics_applications" ADD COLUMN IF NOT EXISTS "consentCapacityAssessment" TEXT;
ALTER TABLE "ethics_applications" ADD COLUMN IF NOT EXISTS "withdrawalProcess" TEXT;
ALTER TABLE "ethics_applications" ADD COLUMN IF NOT EXISTS "participantCosts" TEXT;

-- Data Management
ALTER TABLE "ethics_applications" ADD COLUMN IF NOT EXISTS "dataDisposalProtocol" TEXT;

-- Conflict of Interest
ALTER TABLE "ethics_applications" ADD COLUMN IF NOT EXISTS "conflictOfInterest" BOOLEAN DEFAULT false;
ALTER TABLE "ethics_applications" ADD COLUMN IF NOT EXISTS "conflictDetails" TEXT;

-- Previous Ethics Approval
ALTER TABLE "ethics_applications" ADD COLUMN IF NOT EXISTS "previousEthicsApproval" BOOLEAN DEFAULT false;
ALTER TABLE "ethics_applications" ADD COLUMN IF NOT EXISTS "previousApprovalDetails" TEXT;

-- Additional Comments
ALTER TABLE "ethics_applications" ADD COLUMN IF NOT EXISTS "additionalComments" TEXT;
