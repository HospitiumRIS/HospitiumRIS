-- CreateEnum
CREATE TYPE "public"."PreprintStatus" AS ENUM ('PENDING', 'UNDER_REVIEW', 'ACCEPTED', 'PUBLISHED', 'REJECTED', 'WITHDRAWN');

-- CreateTable
CREATE TABLE "public"."preprint_submissions" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "authors" TEXT NOT NULL,
    "abstract" TEXT NOT NULL,
    "articleType" TEXT,
    "subject" TEXT,
    "keywords" TEXT[],
    "license" TEXT,
    "server" TEXT NOT NULL,
    "serverName" TEXT NOT NULL,
    "manuscriptFileName" TEXT,
    "manuscriptFileSize" INTEGER,
    "status" "public"."PreprintStatus" NOT NULL DEFAULT 'PENDING',
    "doi" TEXT,
    "serverUrl" TEXT,
    "osfNodeId" TEXT,
    "osfPreprintId" TEXT,
    "ethicsStatement" TEXT,
    "fundingStatement" TEXT,
    "submittedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "reviewedAt" TIMESTAMP(3),
    "publishedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "preprint_submissions_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "public"."preprint_submissions" ADD CONSTRAINT "preprint_submissions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
