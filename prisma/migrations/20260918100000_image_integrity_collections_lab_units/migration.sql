-- Image integrity: researcher collections, institution lab units, and extended case metadata.
-- Idempotent so partially migrated production databases can apply safely.

-- CreateTable: institution lab/unit catalog
CREATE TABLE IF NOT EXISTS "public"."image_integrity_lab_units" (
    "id" TEXT NOT NULL,
    "institutionId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "image_integrity_lab_units_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "image_integrity_lab_units_institutionId_name_key"
  ON "public"."image_integrity_lab_units"("institutionId", "name");

CREATE INDEX IF NOT EXISTS "image_integrity_lab_units_institutionId_isActive_idx"
  ON "public"."image_integrity_lab_units"("institutionId", "isActive");

DO $$ BEGIN
  ALTER TABLE "public"."image_integrity_lab_units"
    ADD CONSTRAINT "image_integrity_lab_units_institutionId_fkey"
    FOREIGN KEY ("institutionId") REFERENCES "public"."institutions"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- CreateTable: researcher personal collections
CREATE TABLE IF NOT EXISTS "public"."image_integrity_collections" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "color" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "image_integrity_collections_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "image_integrity_collections_userId_name_key"
  ON "public"."image_integrity_collections"("userId", "name");

CREATE INDEX IF NOT EXISTS "image_integrity_collections_userId_idx"
  ON "public"."image_integrity_collections"("userId");

DO $$ BEGIN
  ALTER TABLE "public"."image_integrity_collections"
    ADD CONSTRAINT "image_integrity_collections_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- AlterTable: extended case metadata and organization links
ALTER TABLE "public"."image_integrity_cases" ADD COLUMN IF NOT EXISTS "authors" JSONB;
ALTER TABLE "public"."image_integrity_cases" ADD COLUMN IF NOT EXISTS "description" TEXT;
ALTER TABLE "public"."image_integrity_cases" ADD COLUMN IF NOT EXISTS "labUnitId" TEXT;
ALTER TABLE "public"."image_integrity_cases" ADD COLUMN IF NOT EXISTS "collectionId" TEXT;
ALTER TABLE "public"."image_integrity_cases" ADD COLUMN IF NOT EXISTS "notes" TEXT;
ALTER TABLE "public"."image_integrity_cases" ADD COLUMN IF NOT EXISTS "tags" JSONB;
ALTER TABLE "public"."image_integrity_cases" ADD COLUMN IF NOT EXISTS "analysisTarget" JSONB;

CREATE INDEX IF NOT EXISTS "image_integrity_cases_labUnitId_idx"
  ON "public"."image_integrity_cases"("labUnitId");

CREATE INDEX IF NOT EXISTS "image_integrity_cases_collectionId_idx"
  ON "public"."image_integrity_cases"("collectionId");

DO $$ BEGIN
  ALTER TABLE "public"."image_integrity_cases"
    ADD CONSTRAINT "image_integrity_cases_labUnitId_fkey"
    FOREIGN KEY ("labUnitId") REFERENCES "public"."image_integrity_lab_units"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "public"."image_integrity_cases"
    ADD CONSTRAINT "image_integrity_cases_collectionId_fkey"
    FOREIGN KEY ("collectionId") REFERENCES "public"."image_integrity_collections"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;
