/*
  Warnings:

  - You are about to drop the column `category` on the `internal_grant_requests` table. All the data in the column will be lost.
  - You are about to drop the column `expectedOutcomes` on the `internal_grant_requests` table. All the data in the column will be lost.
  - You are about to drop the column `justification` on the `internal_grant_requests` table. All the data in the column will be lost.
  - You are about to drop the column `methodology` on the `internal_grant_requests` table. All the data in the column will be lost.
  - You are about to drop the column `objectives` on the `internal_grant_requests` table. All the data in the column will be lost.
  - You are about to drop the column `position` on the `internal_grant_requests` table. All the data in the column will be lost.
  - You are about to drop the column `reportNotes` on the `internal_grant_requests` table. All the data in the column will be lost.
  - The `status` column on the `internal_grant_requests` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - You are about to drop the column `requestId` on the `internal_grant_reviews` table. All the data in the column will be lost.
  - You are about to drop the column `reviewedAt` on the `internal_grant_reviews` table. All the data in the column will be lost.
  - You are about to drop the column `reviewerRole` on the `internal_grant_reviews` table. All the data in the column will be lost.
  - You are about to drop the column `score` on the `internal_grant_reviews` table. All the data in the column will be lost.
  - Added the required column `purpose` to the `internal_grant_requests` table without a default value. This is not possible if the table is not empty.
  - Added the required column `grantRequestId` to the `internal_grant_reviews` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "public"."TrainingStatus" AS ENUM ('DRAFT', 'PUBLISHED', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "public"."TargetGroup" AS ENUM ('NURSES', 'DOCTORS', 'RESEARCHERS', 'LAB_TECHNICIANS', 'ADMINISTRATORS', 'ALL_STAFF');

-- CreateEnum
CREATE TYPE "public"."TrainingRegistrationStatus" AS ENUM ('REGISTERED', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "public"."ModuleStatus" AS ENUM ('ACTIVE', 'INACTIVE');

-- CreateEnum
CREATE TYPE "public"."ModuleProgressStatus" AS ENUM ('PENDING', 'IN_PROGRESS', 'COMPLETED');

-- CreateEnum
CREATE TYPE "public"."MaterialAccessLevel" AS ENUM ('PUBLIC', 'REGISTERED_ONLY');

-- DropForeignKey
ALTER TABLE "public"."internal_grant_reviews" DROP CONSTRAINT "internal_grant_reviews_requestId_fkey";

-- AlterTable
ALTER TABLE "public"."internal_grant_requests" DROP COLUMN "category",
DROP COLUMN "expectedOutcomes",
DROP COLUMN "justification",
DROP COLUMN "methodology",
DROP COLUMN "objectives",
DROP COLUMN "position",
DROP COLUMN "reportNotes",
ADD COLUMN     "applicantTitle" TEXT,
ADD COLUMN     "attachments" JSONB[],
ADD COLUMN     "purpose" TEXT NOT NULL,
ADD COLUMN     "reportSubmittedAt" TIMESTAMP(3),
ADD COLUMN     "reportingRequired" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "revisionNotes" TEXT,
DROP COLUMN "status",
ADD COLUMN     "status" TEXT NOT NULL DEFAULT 'draft';

-- AlterTable
ALTER TABLE "public"."internal_grant_reviews" DROP COLUMN "requestId",
DROP COLUMN "reviewedAt",
DROP COLUMN "reviewerRole",
DROP COLUMN "score",
ADD COLUMN     "grantRequestId" TEXT NOT NULL,
ADD COLUMN     "reviewDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "reviewerEmail" TEXT;

-- DropEnum
DROP TYPE "public"."InternalGrantStatus";

-- CreateTable
CREATE TABLE "public"."trainings" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "department" TEXT NOT NULL,
    "targetGroup" "public"."TargetGroup" NOT NULL,
    "location" TEXT,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "maxParticipants" INTEGER NOT NULL,
    "status" "public"."TrainingStatus" NOT NULL DEFAULT 'DRAFT',
    "institutionId" TEXT NOT NULL,
    "createdBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "trainings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."training_modules" (
    "id" TEXT NOT NULL,
    "trainingId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "order" INTEGER NOT NULL,
    "status" "public"."ModuleStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "training_modules_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."training_materials" (
    "id" TEXT NOT NULL,
    "trainingId" TEXT NOT NULL,
    "moduleId" TEXT,
    "name" TEXT NOT NULL,
    "fileUrl" TEXT NOT NULL,
    "fileType" TEXT NOT NULL,
    "accessLevel" "public"."MaterialAccessLevel" NOT NULL DEFAULT 'PUBLIC',
    "uploadedBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "training_materials_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."training_registrations" (
    "id" TEXT NOT NULL,
    "trainingId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "status" "public"."TrainingRegistrationStatus" NOT NULL DEFAULT 'REGISTERED',
    "registeredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "training_registrations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."training_module_progress" (
    "id" TEXT NOT NULL,
    "registrationId" TEXT NOT NULL,
    "moduleId" TEXT NOT NULL,
    "status" "public"."ModuleProgressStatus" NOT NULL DEFAULT 'PENDING',
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "training_module_progress_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."training_certificates" (
    "id" TEXT NOT NULL,
    "trainingId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "registrationId" TEXT NOT NULL,
    "certificateUrl" TEXT NOT NULL,
    "issuedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "uploadedBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "training_certificates_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "training_registrations_trainingId_userId_key" ON "public"."training_registrations"("trainingId", "userId");

-- CreateIndex
CREATE UNIQUE INDEX "training_module_progress_registrationId_moduleId_key" ON "public"."training_module_progress"("registrationId", "moduleId");

-- CreateIndex
CREATE UNIQUE INDEX "training_certificates_registrationId_key" ON "public"."training_certificates"("registrationId");

-- AddForeignKey
ALTER TABLE "public"."internal_grant_reviews" ADD CONSTRAINT "internal_grant_reviews_grantRequestId_fkey" FOREIGN KEY ("grantRequestId") REFERENCES "public"."internal_grant_requests"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."training_modules" ADD CONSTRAINT "training_modules_trainingId_fkey" FOREIGN KEY ("trainingId") REFERENCES "public"."trainings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."training_materials" ADD CONSTRAINT "training_materials_trainingId_fkey" FOREIGN KEY ("trainingId") REFERENCES "public"."trainings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."training_materials" ADD CONSTRAINT "training_materials_moduleId_fkey" FOREIGN KEY ("moduleId") REFERENCES "public"."training_modules"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."training_registrations" ADD CONSTRAINT "training_registrations_trainingId_fkey" FOREIGN KEY ("trainingId") REFERENCES "public"."trainings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."training_registrations" ADD CONSTRAINT "training_registrations_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."training_module_progress" ADD CONSTRAINT "training_module_progress_registrationId_fkey" FOREIGN KEY ("registrationId") REFERENCES "public"."training_registrations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."training_module_progress" ADD CONSTRAINT "training_module_progress_moduleId_fkey" FOREIGN KEY ("moduleId") REFERENCES "public"."training_modules"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."training_certificates" ADD CONSTRAINT "training_certificates_trainingId_fkey" FOREIGN KEY ("trainingId") REFERENCES "public"."trainings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."training_certificates" ADD CONSTRAINT "training_certificates_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."training_certificates" ADD CONSTRAINT "training_certificates_registrationId_fkey" FOREIGN KEY ("registrationId") REFERENCES "public"."training_registrations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
