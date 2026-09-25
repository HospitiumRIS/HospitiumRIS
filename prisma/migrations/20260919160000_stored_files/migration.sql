-- CreateEnum
CREATE TYPE "StoredFileModule" AS ENUM ('ETHICS_DOCUMENT', 'ETHICS_CERTIFICATE', 'PROPOSAL_DOCUMENT', 'PROPOSAL_DELIVERABLE', 'PROPOSAL_MILESTONE', 'IMAGE_INTEGRITY', 'TRAINING_MATERIAL', 'TRAINING_CERTIFICATE', 'INSTITUTION_LOGO');

-- CreateEnum
CREATE TYPE "FileVisibility" AS ENUM ('PRIVATE', 'PUBLIC');

-- CreateEnum
CREATE TYPE "FileStatus" AS ENUM ('PENDING', 'AVAILABLE', 'QUARANTINED', 'DELETED');

-- AlterTable
ALTER TABLE "institutions" ADD COLUMN "storageBucket" TEXT;

-- CreateTable
CREATE TABLE "stored_files" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT,
    "ownerUserId" TEXT NOT NULL,
    "module" "StoredFileModule" NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "bucket" TEXT NOT NULL,
    "storageKey" TEXT NOT NULL,
    "visibility" "FileVisibility" NOT NULL DEFAULT 'PRIVATE',
    "originalName" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "sizeBytes" BIGINT NOT NULL,
    "sha256" TEXT,
    "status" "FileStatus" NOT NULL DEFAULT 'PENDING',
    "legacyPath" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "availableAt" TIMESTAMP(3),
    "deletedAt" TIMESTAMP(3),
    "purgeAfter" TIMESTAMP(3),

    CONSTRAINT "stored_files_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "stored_files_storageKey_key" ON "stored_files"("storageKey");

-- CreateIndex
CREATE INDEX "stored_files_tenantId_module_idx" ON "stored_files"("tenantId", "module");

-- CreateIndex
CREATE INDEX "stored_files_entityType_entityId_idx" ON "stored_files"("entityType", "entityId");

-- CreateIndex
CREATE INDEX "stored_files_status_createdAt_idx" ON "stored_files"("status", "createdAt");
