-- CreateEnum
CREATE TYPE "public"."VersionType" AS ENUM ('AUTO', 'MANUAL', 'MILESTONE');

-- CreateEnum
CREATE TYPE "public"."ChangeType" AS ENUM ('INSERT', 'DELETE', 'FORMAT', 'REPLACE');

-- CreateEnum
CREATE TYPE "public"."ChangeStatus" AS ENUM ('PENDING', 'ACCEPTED', 'REJECTED');

-- CreateTable
CREATE TABLE "public"."manuscript_versions" (
    "id" TEXT NOT NULL,
    "manuscriptId" TEXT NOT NULL,
    "versionNumber" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "changes" TEXT,
    "createdBy" TEXT NOT NULL,
    "versionType" "public"."VersionType" NOT NULL DEFAULT 'AUTO',
    "description" TEXT,
    "wordCount" INTEGER DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "manuscript_versions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."tracked_changes" (
    "id" TEXT NOT NULL,
    "manuscriptId" TEXT NOT NULL,
    "changeId" TEXT NOT NULL,
    "type" "public"."ChangeType" NOT NULL,
    "operation" TEXT NOT NULL,
    "content" TEXT,
    "oldContent" TEXT,
    "startOffset" INTEGER NOT NULL,
    "endOffset" INTEGER NOT NULL,
    "nodeType" TEXT,
    "authorId" TEXT NOT NULL,
    "status" "public"."ChangeStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "acceptedAt" TIMESTAMP(3),
    "rejectedAt" TIMESTAMP(3),
    "acceptedBy" TEXT,

    CONSTRAINT "tracked_changes_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "manuscript_versions_manuscriptId_versionNumber_key" ON "public"."manuscript_versions"("manuscriptId", "versionNumber");

-- AddForeignKey
ALTER TABLE "public"."manuscript_versions" ADD CONSTRAINT "manuscript_versions_manuscriptId_fkey" FOREIGN KEY ("manuscriptId") REFERENCES "public"."manuscripts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."manuscript_versions" ADD CONSTRAINT "manuscript_versions_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."tracked_changes" ADD CONSTRAINT "tracked_changes_manuscriptId_fkey" FOREIGN KEY ("manuscriptId") REFERENCES "public"."manuscripts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."tracked_changes" ADD CONSTRAINT "tracked_changes_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."tracked_changes" ADD CONSTRAINT "tracked_changes_acceptedBy_fkey" FOREIGN KEY ("acceptedBy") REFERENCES "public"."users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
