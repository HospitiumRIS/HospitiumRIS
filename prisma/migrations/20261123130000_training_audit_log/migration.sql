-- Training activity log (#90). Additive.

-- CreateTable
CREATE TABLE "training_audit_logs" (
    "id" TEXT NOT NULL,
    "trainingId" TEXT NOT NULL,
    "actorId" TEXT,
    "action" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "before" JSONB,
    "after" JSONB,
    "reason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "training_audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "training_audit_logs_trainingId_createdAt_idx" ON "training_audit_logs"("trainingId", "createdAt");
CREATE INDEX "training_audit_logs_entityType_entityId_idx" ON "training_audit_logs"("entityType", "entityId");

-- AddForeignKey
ALTER TABLE "training_audit_logs" ADD CONSTRAINT "training_audit_logs_trainingId_fkey" FOREIGN KEY ("trainingId") REFERENCES "trainings"("id") ON DELETE CASCADE ON UPDATE CASCADE;
