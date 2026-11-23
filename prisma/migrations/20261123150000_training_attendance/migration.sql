-- Attendance register per session (#92). Additive.

-- CreateEnum
CREATE TYPE "TrainingAttendanceStatus" AS ENUM ('PRESENT', 'LATE', 'ABSENT', 'EXCUSED');
CREATE TYPE "TrainingAttendanceMethod" AS ENUM ('MANUAL', 'QR', 'CODE', 'VIRTUAL_JOIN', 'IMPORT');

-- AlterTable
ALTER TABLE "trainings" ADD COLUMN "excludeExcusedSessions" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "training_registrations" ADD COLUMN "attendancePercent" DOUBLE PRECISION;

-- CreateTable
CREATE TABLE "training_attendance" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "registrationId" TEXT NOT NULL,
    "status" "TrainingAttendanceStatus" NOT NULL,
    "method" "TrainingAttendanceMethod" NOT NULL DEFAULT 'MANUAL',
    "checkedInAt" TIMESTAMP(3),
    "checkedOutAt" TIMESTAMP(3),
    "durationMinutes" INTEGER,
    "markedBy" TEXT,
    "note" TEXT,
    "ip" TEXT,
    "userAgent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "training_attendance_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "training_attendance_sessionId_registrationId_key" ON "training_attendance"("sessionId", "registrationId");
CREATE INDEX "training_attendance_registrationId_idx" ON "training_attendance"("registrationId");

-- AddForeignKey
ALTER TABLE "training_attendance" ADD CONSTRAINT "training_attendance_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "training_sessions"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "training_attendance" ADD CONSTRAINT "training_attendance_registrationId_fkey" FOREIGN KEY ("registrationId") REFERENCES "training_registrations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
