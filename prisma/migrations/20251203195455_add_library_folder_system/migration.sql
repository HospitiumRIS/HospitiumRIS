/*
  Warnings:

  - You are about to drop the column `sortOrder` on the `library_folder_publications` table. All the data in the column will be lost.
  - You are about to drop the column `sortOrder` on the `library_folders` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX "public"."library_folder_publications_folderId_idx";

-- DropIndex
DROP INDEX "public"."library_folder_publications_publicationId_idx";

-- DropIndex
DROP INDEX "public"."library_folders_parentId_idx";

-- DropIndex
DROP INDEX "public"."library_folders_userId_idx";

-- AlterTable
ALTER TABLE "public"."library_folder_publications" DROP COLUMN "sortOrder";

-- AlterTable
ALTER TABLE "public"."library_folders" DROP COLUMN "sortOrder";
