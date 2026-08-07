-- Add verified institution membership fields to users (schema was ahead of migrations)

ALTER TABLE "public"."users" ADD COLUMN IF NOT EXISTS "secondaryInstitutionId" TEXT;
ALTER TABLE "public"."users" ADD COLUMN IF NOT EXISTS "institutionVerifiedAt" TIMESTAMP(3);
ALTER TABLE "public"."users" ADD COLUMN IF NOT EXISTS "institutionVerificationMethod" TEXT;

DO $$ BEGIN
  ALTER TABLE "public"."users"
    ADD CONSTRAINT "users_secondaryInstitutionId_fkey"
    FOREIGN KEY ("secondaryInstitutionId")
    REFERENCES "public"."institutions"("id")
    ON DELETE SET NULL
    ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;
