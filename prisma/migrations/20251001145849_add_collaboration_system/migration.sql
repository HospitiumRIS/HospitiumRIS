/*
  Warnings:

  - The values [IN_REVIEW,ACCEPTED,REJECTED] on the enum `PublicationStatus` will be removed. If these variants are still used in the database, this will fail.

*/
-- CreateEnum
CREATE TYPE "public"."SettingsType" AS ENUM ('ZOTERO', 'PUBMED', 'OTHER');

-- CreateEnum
CREATE TYPE "public"."ManuscriptStatus" AS ENUM ('DRAFT', 'IN_REVIEW', 'UNDER_REVISION', 'PUBLISHED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "public"."CollaboratorRole" AS ENUM ('OWNER', 'ADMIN', 'EDITOR', 'CONTRIBUTOR', 'REVIEWER');

-- CreateEnum
CREATE TYPE "public"."InvitationStatus" AS ENUM ('PENDING', 'ACCEPTED', 'DECLINED', 'EXPIRED');

-- CreateEnum
CREATE TYPE "public"."NotificationType" AS ENUM ('COLLABORATION_INVITATION', 'MANUSCRIPT_UPDATE', 'COMMENT_MENTION', 'SYSTEM_NOTIFICATION');

-- AlterEnum
BEGIN;
CREATE TYPE "public"."PublicationStatus_new" AS ENUM ('DRAFT', 'PUBLISHED');
ALTER TABLE "public"."publications" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "public"."publications" ALTER COLUMN "status" TYPE "public"."PublicationStatus_new" USING ("status"::text::"public"."PublicationStatus_new");
ALTER TYPE "public"."PublicationStatus" RENAME TO "PublicationStatus_old";
ALTER TYPE "public"."PublicationStatus_new" RENAME TO "PublicationStatus";
DROP TYPE "public"."PublicationStatus_old";
ALTER TABLE "public"."publications" ALTER COLUMN "status" SET DEFAULT 'PUBLISHED';
COMMIT;

-- CreateTable
CREATE TABLE "public"."user_settings" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" "public"."SettingsType" NOT NULL,
    "settings" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_settings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."manuscripts" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "field" TEXT,
    "description" TEXT,
    "status" "public"."ManuscriptStatus" NOT NULL DEFAULT 'DRAFT',
    "createdBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "manuscripts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."manuscript_collaborators" (
    "id" TEXT NOT NULL,
    "manuscriptId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "role" "public"."CollaboratorRole" NOT NULL,
    "invitedBy" TEXT NOT NULL,
    "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "canEdit" BOOLEAN NOT NULL DEFAULT true,
    "canInvite" BOOLEAN NOT NULL DEFAULT false,
    "canDelete" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "manuscript_collaborators_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."manuscript_invitations" (
    "id" TEXT NOT NULL,
    "manuscriptId" TEXT NOT NULL,
    "invitedBy" TEXT NOT NULL,
    "invitedUserId" TEXT,
    "orcidId" TEXT,
    "email" TEXT,
    "givenName" TEXT,
    "familyName" TEXT,
    "affiliation" TEXT,
    "role" "public"."CollaboratorRole" NOT NULL DEFAULT 'CONTRIBUTOR',
    "status" "public"."InvitationStatus" NOT NULL DEFAULT 'PENDING',
    "message" TEXT,
    "token" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "respondedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "manuscript_invitations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."notifications" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "manuscriptId" TEXT,
    "type" "public"."NotificationType" NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "data" JSONB,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "readAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "user_settings_userId_type_key" ON "public"."user_settings"("userId", "type");

-- CreateIndex
CREATE UNIQUE INDEX "manuscript_collaborators_manuscriptId_userId_key" ON "public"."manuscript_collaborators"("manuscriptId", "userId");

-- CreateIndex
CREATE UNIQUE INDEX "manuscript_invitations_token_key" ON "public"."manuscript_invitations"("token");

-- AddForeignKey
ALTER TABLE "public"."user_settings" ADD CONSTRAINT "user_settings_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."manuscripts" ADD CONSTRAINT "manuscripts_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."manuscript_collaborators" ADD CONSTRAINT "manuscript_collaborators_manuscriptId_fkey" FOREIGN KEY ("manuscriptId") REFERENCES "public"."manuscripts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."manuscript_collaborators" ADD CONSTRAINT "manuscript_collaborators_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."manuscript_collaborators" ADD CONSTRAINT "manuscript_collaborators_invitedBy_fkey" FOREIGN KEY ("invitedBy") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."manuscript_invitations" ADD CONSTRAINT "manuscript_invitations_manuscriptId_fkey" FOREIGN KEY ("manuscriptId") REFERENCES "public"."manuscripts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."manuscript_invitations" ADD CONSTRAINT "manuscript_invitations_invitedBy_fkey" FOREIGN KEY ("invitedBy") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."manuscript_invitations" ADD CONSTRAINT "manuscript_invitations_invitedUserId_fkey" FOREIGN KEY ("invitedUserId") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."notifications" ADD CONSTRAINT "notifications_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."notifications" ADD CONSTRAINT "notifications_manuscriptId_fkey" FOREIGN KEY ("manuscriptId") REFERENCES "public"."manuscripts"("id") ON DELETE CASCADE ON UPDATE CASCADE;
