-- Distinguish applications submitted in Hospitium from uploaded existing clearance certificates
ALTER TABLE "public"."ethics_applications" ADD COLUMN IF NOT EXISTS "source" TEXT NOT NULL DEFAULT 'APPLICATION';
