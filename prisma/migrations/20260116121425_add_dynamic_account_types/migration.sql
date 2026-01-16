/*
  Warnings:

  - Changed the type of `accountType` on the `registration_logs` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `accountType` on the `users` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- AlterTable
ALTER TABLE "public"."manuscripts" ADD COLUMN     "lastUpdatedBy" TEXT;

-- AlterTable
ALTER TABLE "public"."registration_logs" DROP COLUMN "accountType",
ADD COLUMN     "accountType" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "public"."users" DROP COLUMN "accountType",
ADD COLUMN     "accountType" TEXT NOT NULL;

-- DropEnum
DROP TYPE "public"."AccountType";

-- CreateTable
CREATE TABLE "public"."account_types" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "displayName" TEXT NOT NULL,
    "description" TEXT,
    "permissions" JSONB NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "isSystem" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "account_types_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."proposal_reviews" (
    "id" TEXT NOT NULL,
    "proposalId" TEXT NOT NULL,
    "reviewerId" TEXT NOT NULL,
    "reviewerName" TEXT NOT NULL,
    "decision" TEXT NOT NULL,
    "overallComments" TEXT NOT NULL,
    "rejectionReason" TEXT,
    "revisionRequirements" TEXT,
    "recommendation" TEXT,
    "sectionReviews" JSONB NOT NULL,
    "complianceScore" JSONB NOT NULL,
    "reviewDate" TIMESTAMP(3) NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'COMPLETED',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "proposal_reviews_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "account_types_name_key" ON "public"."account_types"("name");

-- AddForeignKey
ALTER TABLE "public"."users" ADD CONSTRAINT "users_accountType_fkey" FOREIGN KEY ("accountType") REFERENCES "public"."account_types"("name") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."manuscripts" ADD CONSTRAINT "manuscripts_lastUpdatedBy_fkey" FOREIGN KEY ("lastUpdatedBy") REFERENCES "public"."users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."proposal_reviews" ADD CONSTRAINT "proposal_reviews_proposalId_fkey" FOREIGN KEY ("proposalId") REFERENCES "public"."proposals"("id") ON DELETE CASCADE ON UPDATE CASCADE;
