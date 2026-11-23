-- QR / code self check-in (#93). Additive.

-- AlterTable
ALTER TABLE "training_sessions" ADD COLUMN "checkInCode" TEXT;
