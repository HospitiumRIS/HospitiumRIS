-- Allow custom training target groups (not limited to enum values)
ALTER TABLE "public"."trainings"
  ALTER COLUMN "targetGroup" SET DATA TYPE TEXT[]
  USING "targetGroup"::TEXT[];
