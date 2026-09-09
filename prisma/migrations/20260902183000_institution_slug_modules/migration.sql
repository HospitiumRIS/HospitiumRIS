-- Institution can exist before an admin is assigned
ALTER TABLE "institutions" ALTER COLUMN "userId" DROP NOT NULL;

ALTER TABLE "institutions" DROP CONSTRAINT IF EXISTS "institutions_userId_fkey";
ALTER TABLE "institutions" ADD CONSTRAINT "institutions_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "institutions" ALTER COLUMN "type" SET DEFAULT 'UNIVERSITY';
ALTER TABLE "institutions" ALTER COLUMN "country" SET DEFAULT '';

-- Slug, contact email, and enabled modules
ALTER TABLE "institutions" ADD COLUMN IF NOT EXISTS "slug" TEXT;
ALTER TABLE "institutions" ADD COLUMN IF NOT EXISTS "contactEmail" TEXT;
ALTER TABLE "institutions" ADD COLUMN IF NOT EXISTS "enabledModules" JSONB NOT NULL DEFAULT '[]';

UPDATE "institutions"
SET slug = lower(trim(both '-' from regexp_replace(regexp_replace(coalesce(name, 'institution'), '[^a-zA-Z0-9]+', '-', 'g'), '-+', '-', 'g')))
         || '-' || left(id, 8)
WHERE slug IS NULL OR slug = '';

UPDATE "institutions"
SET "enabledModules" = '["publications","projects","clinical_trials","image_integrity","training","administration","analytics"]'::jsonb
WHERE "enabledModules" = '[]'::jsonb OR "enabledModules" IS NULL;

ALTER TABLE "institutions" ALTER COLUMN "slug" SET NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS "institutions_slug_key" ON "institutions"("slug");
