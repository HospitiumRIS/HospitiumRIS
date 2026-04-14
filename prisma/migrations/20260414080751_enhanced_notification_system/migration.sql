-- CreateEnum
CREATE TYPE "public"."NotificationPriority" AS ENUM ('LOW', 'NORMAL', 'HIGH', 'URGENT');

-- CreateEnum
CREATE TYPE "public"."NotificationCategory" AS ENUM ('GENERAL', 'COLLABORATION', 'PROPOSAL', 'ETHICS', 'GRANT', 'TRAINING', 'PUBLICATION', 'PREPRINT', 'CAMPAIGN', 'INTERNAL_GRANT', 'SYSTEM', 'ACCOUNT');

-- CreateEnum
CREATE TYPE "public"."EmailDigestFrequency" AS ENUM ('IMMEDIATE', 'HOURLY', 'DAILY', 'WEEKLY', 'NEVER');

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "public"."NotificationType" ADD VALUE 'COLLABORATION_ACCEPTED';
ALTER TYPE "public"."NotificationType" ADD VALUE 'COLLABORATION_DECLINED';
ALTER TYPE "public"."NotificationType" ADD VALUE 'COLLABORATOR_ROLE_CHANGED';
ALTER TYPE "public"."NotificationType" ADD VALUE 'COLLABORATOR_REMOVED';
ALTER TYPE "public"."NotificationType" ADD VALUE 'MANUSCRIPT_VERSION_CREATED';
ALTER TYPE "public"."NotificationType" ADD VALUE 'MANUSCRIPT_STATUS_CHANGED';
ALTER TYPE "public"."NotificationType" ADD VALUE 'COMMENT_ADDED';
ALTER TYPE "public"."NotificationType" ADD VALUE 'COMMENT_REPLY';
ALTER TYPE "public"."NotificationType" ADD VALUE 'TRACKED_CHANGE_ADDED';
ALTER TYPE "public"."NotificationType" ADD VALUE 'TRACKED_CHANGE_ACCEPTED';
ALTER TYPE "public"."NotificationType" ADD VALUE 'TRACKED_CHANGE_REJECTED';
ALTER TYPE "public"."NotificationType" ADD VALUE 'PROPOSAL_SUBMITTED';
ALTER TYPE "public"."NotificationType" ADD VALUE 'PROPOSAL_REVIEW_ASSIGNED';
ALTER TYPE "public"."NotificationType" ADD VALUE 'PROPOSAL_REVIEWED';
ALTER TYPE "public"."NotificationType" ADD VALUE 'PROPOSAL_STATUS_CHANGED';
ALTER TYPE "public"."NotificationType" ADD VALUE 'PROPOSAL_APPROVED';
ALTER TYPE "public"."NotificationType" ADD VALUE 'PROPOSAL_REJECTED';
ALTER TYPE "public"."NotificationType" ADD VALUE 'PROPOSAL_REVISION_REQUESTED';
ALTER TYPE "public"."NotificationType" ADD VALUE 'PROPOSAL_DEADLINE_APPROACHING';
ALTER TYPE "public"."NotificationType" ADD VALUE 'ETHICS_SUBMITTED';
ALTER TYPE "public"."NotificationType" ADD VALUE 'ETHICS_REVIEW_ASSIGNED';
ALTER TYPE "public"."NotificationType" ADD VALUE 'ETHICS_REVIEWED';
ALTER TYPE "public"."NotificationType" ADD VALUE 'ETHICS_APPROVED';
ALTER TYPE "public"."NotificationType" ADD VALUE 'ETHICS_CONDITIONAL_APPROVAL';
ALTER TYPE "public"."NotificationType" ADD VALUE 'ETHICS_REJECTED';
ALTER TYPE "public"."NotificationType" ADD VALUE 'ETHICS_REVISION_REQUESTED';
ALTER TYPE "public"."NotificationType" ADD VALUE 'ETHICS_EXPIRING_SOON';
ALTER TYPE "public"."NotificationType" ADD VALUE 'ETHICS_AMENDMENT_SUBMITTED';
ALTER TYPE "public"."NotificationType" ADD VALUE 'GRANT_STATUS_CHANGED';
ALTER TYPE "public"."NotificationType" ADD VALUE 'GRANT_DEADLINE_APPROACHING';
ALTER TYPE "public"."NotificationType" ADD VALUE 'GRANT_AWARDED';
ALTER TYPE "public"."NotificationType" ADD VALUE 'GRANT_REJECTED';
ALTER TYPE "public"."NotificationType" ADD VALUE 'GRANT_INFO_REQUESTED';
ALTER TYPE "public"."NotificationType" ADD VALUE 'GRANT_MILESTONE_DUE';
ALTER TYPE "public"."NotificationType" ADD VALUE 'GRANT_REPORT_DUE';
ALTER TYPE "public"."NotificationType" ADD VALUE 'GRANT_COMMUNICATION_RECEIVED';
ALTER TYPE "public"."NotificationType" ADD VALUE 'TRAINING_AVAILABLE';
ALTER TYPE "public"."NotificationType" ADD VALUE 'TRAINING_REGISTERED';
ALTER TYPE "public"."NotificationType" ADD VALUE 'TRAINING_STARTING_SOON';
ALTER TYPE "public"."NotificationType" ADD VALUE 'TRAINING_MODULE_COMPLETED';
ALTER TYPE "public"."NotificationType" ADD VALUE 'TRAINING_CERTIFICATE_ISSUED';
ALTER TYPE "public"."NotificationType" ADD VALUE 'TRAINING_CANCELLED';
ALTER TYPE "public"."NotificationType" ADD VALUE 'TRAINING_MATERIALS_UPDATED';
ALTER TYPE "public"."NotificationType" ADD VALUE 'TRAINING_NEW_REGISTRATION';
ALTER TYPE "public"."NotificationType" ADD VALUE 'PUBLICATION_IMPORTED';
ALTER TYPE "public"."NotificationType" ADD VALUE 'PUBLICATION_IMPORT_FAILED';
ALTER TYPE "public"."NotificationType" ADD VALUE 'COAUTHOR_PUBLICATION_DETECTED';
ALTER TYPE "public"."NotificationType" ADD VALUE 'PREPRINT_SUBMITTED';
ALTER TYPE "public"."NotificationType" ADD VALUE 'PREPRINT_UNDER_REVIEW';
ALTER TYPE "public"."NotificationType" ADD VALUE 'PREPRINT_ACCEPTED';
ALTER TYPE "public"."NotificationType" ADD VALUE 'PREPRINT_PUBLISHED';
ALTER TYPE "public"."NotificationType" ADD VALUE 'PREPRINT_REJECTED';
ALTER TYPE "public"."NotificationType" ADD VALUE 'ACCOUNT_ACTIVATED';
ALTER TYPE "public"."NotificationType" ADD VALUE 'ACCOUNT_STATUS_CHANGED';
ALTER TYPE "public"."NotificationType" ADD VALUE 'ACCOUNT_TYPE_CHANGED';
ALTER TYPE "public"."NotificationType" ADD VALUE 'EMAIL_VERIFIED';
ALTER TYPE "public"."NotificationType" ADD VALUE 'NEW_USER_REGISTRATION';
ALTER TYPE "public"."NotificationType" ADD VALUE 'DONATION_RECEIVED';
ALTER TYPE "public"."NotificationType" ADD VALUE 'CAMPAIGN_MILESTONE_REACHED';
ALTER TYPE "public"."NotificationType" ADD VALUE 'CAMPAIGN_ACTIVITY_SCHEDULED';
ALTER TYPE "public"."NotificationType" ADD VALUE 'INTERNAL_GRANT_SUBMITTED';
ALTER TYPE "public"."NotificationType" ADD VALUE 'INTERNAL_GRANT_APPROVED';
ALTER TYPE "public"."NotificationType" ADD VALUE 'INTERNAL_GRANT_REJECTED';
ALTER TYPE "public"."NotificationType" ADD VALUE 'INTERNAL_GRANT_REVIEW_ASSIGNED';
ALTER TYPE "public"."NotificationType" ADD VALUE 'SYSTEM_MAINTENANCE';
ALTER TYPE "public"."NotificationType" ADD VALUE 'SYSTEM_ANNOUNCEMENT';
ALTER TYPE "public"."NotificationType" ADD VALUE 'SECURITY_ALERT';

-- AlterTable
ALTER TABLE "public"."notifications" ADD COLUMN     "actionLabel" TEXT,
ADD COLUMN     "actionRequired" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "actionTaken" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "actionTakenAt" TIMESTAMP(3),
ADD COLUMN     "actionUrl" TEXT,
ADD COLUMN     "archivedAt" TIMESTAMP(3),
ADD COLUMN     "category" "public"."NotificationCategory" NOT NULL DEFAULT 'GENERAL',
ADD COLUMN     "emailSentAt" TIMESTAMP(3),
ADD COLUMN     "ethicsApplicationId" TEXT,
ADD COLUMN     "expiresAt" TIMESTAMP(3),
ADD COLUMN     "grantApplicationId" TEXT,
ADD COLUMN     "isArchived" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "preprintId" TEXT,
ADD COLUMN     "priority" "public"."NotificationPriority" NOT NULL DEFAULT 'NORMAL',
ADD COLUMN     "proposalId" TEXT,
ADD COLUMN     "sentViaEmail" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "trainingId" TEXT;

-- CreateTable
CREATE TABLE "public"."notification_preferences" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "emailEnabled" BOOLEAN NOT NULL DEFAULT true,
    "inAppEnabled" BOOLEAN NOT NULL DEFAULT true,
    "pushEnabled" BOOLEAN NOT NULL DEFAULT false,
    "emailDigest" "public"."EmailDigestFrequency" NOT NULL DEFAULT 'IMMEDIATE',
    "digestTime" TEXT,
    "categoryPreferences" JSONB NOT NULL DEFAULT '{}',
    "quietHoursEnabled" BOOLEAN NOT NULL DEFAULT false,
    "quietHoursStart" TEXT,
    "quietHoursEnd" TEXT,
    "doNotDisturb" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "notification_preferences_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "notification_preferences_userId_key" ON "public"."notification_preferences"("userId");

-- CreateIndex
CREATE INDEX "notifications_userId_isRead_idx" ON "public"."notifications"("userId", "isRead");

-- CreateIndex
CREATE INDEX "notifications_userId_createdAt_idx" ON "public"."notifications"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "notifications_type_idx" ON "public"."notifications"("type");

-- CreateIndex
CREATE INDEX "notifications_category_idx" ON "public"."notifications"("category");

-- AddForeignKey
ALTER TABLE "public"."notifications" ADD CONSTRAINT "notifications_proposalId_fkey" FOREIGN KEY ("proposalId") REFERENCES "public"."proposals"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."notifications" ADD CONSTRAINT "notifications_ethicsApplicationId_fkey" FOREIGN KEY ("ethicsApplicationId") REFERENCES "public"."ethics_applications"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."notifications" ADD CONSTRAINT "notifications_grantApplicationId_fkey" FOREIGN KEY ("grantApplicationId") REFERENCES "public"."grant_applications"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."notifications" ADD CONSTRAINT "notifications_trainingId_fkey" FOREIGN KEY ("trainingId") REFERENCES "public"."trainings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."notifications" ADD CONSTRAINT "notifications_preprintId_fkey" FOREIGN KEY ("preprintId") REFERENCES "public"."preprint_submissions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."notification_preferences" ADD CONSTRAINT "notification_preferences_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
