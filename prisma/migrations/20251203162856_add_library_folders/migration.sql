/*
  Warnings:

  - You are about to drop the `library_items` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "public"."library_items" DROP CONSTRAINT "library_items_folderId_fkey";

-- DropForeignKey
ALTER TABLE "public"."library_items" DROP CONSTRAINT "library_items_publicationId_fkey";

-- DropIndex
DROP INDEX "public"."library_folders_userId_name_parentId_key";

-- DropTable
DROP TABLE "public"."library_items";

-- CreateTable
CREATE TABLE "public"."library_folder_publications" (
    "id" TEXT NOT NULL,
    "folderId" TEXT NOT NULL,
    "publicationId" TEXT NOT NULL,
    "addedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "library_folder_publications_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "library_folder_publications_folderId_idx" ON "public"."library_folder_publications"("folderId");

-- CreateIndex
CREATE INDEX "library_folder_publications_publicationId_idx" ON "public"."library_folder_publications"("publicationId");

-- CreateIndex
CREATE UNIQUE INDEX "library_folder_publications_folderId_publicationId_key" ON "public"."library_folder_publications"("folderId", "publicationId");

-- CreateIndex
CREATE INDEX "library_folders_userId_idx" ON "public"."library_folders"("userId");

-- CreateIndex
CREATE INDEX "library_folders_parentId_idx" ON "public"."library_folders"("parentId");

-- AddForeignKey
ALTER TABLE "public"."library_folder_publications" ADD CONSTRAINT "library_folder_publications_folderId_fkey" FOREIGN KEY ("folderId") REFERENCES "public"."library_folders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."library_folder_publications" ADD CONSTRAINT "library_folder_publications_publicationId_fkey" FOREIGN KEY ("publicationId") REFERENCES "public"."publications"("id") ON DELETE CASCADE ON UPDATE CASCADE;
