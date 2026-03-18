/*
  Warnings:

  - Changed the column `targetGroup` on the `trainings` table from a scalar field to a list field. If there are non-null values in that column, this step will fail.

*/
-- AlterTable
ALTER TABLE "public"."trainings" ALTER COLUMN "targetGroup" SET DATA TYPE "public"."TargetGroup"[] USING ARRAY["targetGroup"]::"public"."TargetGroup"[];
