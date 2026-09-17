-- AlterTable
ALTER TABLE "manuscripts" ADD COLUMN "keywords" TEXT[] DEFAULT ARRAY[]::TEXT[];
