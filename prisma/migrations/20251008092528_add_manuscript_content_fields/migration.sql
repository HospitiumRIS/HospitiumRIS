-- AlterTable
ALTER TABLE "public"."manuscripts" ADD COLUMN     "content" TEXT,
ADD COLUMN     "lastSaved" TIMESTAMP(3),
ADD COLUMN     "wordCount" INTEGER DEFAULT 0;

-- CreateTable
CREATE TABLE "public"."manuscript_citations" (
    "id" TEXT NOT NULL,
    "manuscriptId" TEXT NOT NULL,
    "publicationId" TEXT NOT NULL,
    "citationCount" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "manuscript_citations_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "manuscript_citations_manuscriptId_publicationId_key" ON "public"."manuscript_citations"("manuscriptId", "publicationId");

-- AddForeignKey
ALTER TABLE "public"."manuscript_citations" ADD CONSTRAINT "manuscript_citations_manuscriptId_fkey" FOREIGN KEY ("manuscriptId") REFERENCES "public"."manuscripts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."manuscript_citations" ADD CONSTRAINT "manuscript_citations_publicationId_fkey" FOREIGN KEY ("publicationId") REFERENCES "public"."publications"("id") ON DELETE CASCADE ON UPDATE CASCADE;
