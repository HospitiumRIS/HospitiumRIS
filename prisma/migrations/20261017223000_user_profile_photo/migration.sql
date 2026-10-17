-- Profile photos stored via the R2 file pipeline
ALTER TYPE "StoredFileModule" ADD VALUE IF NOT EXISTS 'PROFILE_PHOTO';
ALTER TABLE "users" ADD COLUMN "avatarUrl" TEXT;
