-- Operations monitoring & audit (OPS epic)

-- Last successful sign-in per account
ALTER TABLE "users" ADD COLUMN "lastLoginAt" TIMESTAMP(3);

-- Append-only audit trail: sign-ins, administrator changes, background jobs
CREATE TABLE "audit_events" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "category" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "outcome" TEXT NOT NULL DEFAULT 'SUCCESS',
    "reason" TEXT,
    "actorUserId" TEXT,
    "actorEmail" TEXT,
    "actorName" TEXT,
    "actorAccountType" TEXT,
    "institutionId" TEXT,
    "targetType" TEXT,
    "targetId" TEXT,
    "summary" TEXT NOT NULL,
    "metadata" JSONB,
    "ipAddress" TEXT,
    "userAgent" TEXT,

    CONSTRAINT "audit_events_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "audit_events_createdAt_idx" ON "audit_events"("createdAt");
CREATE INDEX "audit_events_category_createdAt_idx" ON "audit_events"("category", "createdAt");
CREATE INDEX "audit_events_action_createdAt_idx" ON "audit_events"("action", "createdAt");
CREATE INDEX "audit_events_institutionId_createdAt_idx" ON "audit_events"("institutionId", "createdAt");
CREATE INDEX "audit_events_actorUserId_createdAt_idx" ON "audit_events"("actorUserId", "createdAt");
CREATE INDEX "audit_events_ipAddress_createdAt_idx" ON "audit_events"("ipAddress", "createdAt");

-- Privacy-preserving module usage telemetry
CREATE TABLE "usage_events" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userId" TEXT NOT NULL,
    "institutionId" TEXT,
    "accountType" TEXT,
    "module" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "action" TEXT,
    "route" TEXT NOT NULL,
    "statusCode" INTEGER,

    CONSTRAINT "usage_events_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "usage_events_createdAt_idx" ON "usage_events"("createdAt");
CREATE INDEX "usage_events_institutionId_createdAt_idx" ON "usage_events"("institutionId", "createdAt");
CREATE INDEX "usage_events_module_createdAt_idx" ON "usage_events"("module", "createdAt");
CREATE INDEX "usage_events_userId_createdAt_idx" ON "usage_events"("userId", "createdAt");

-- Audit entries are append-only. The only permitted UPDATE is scrubbing
-- personal data (email, name, IP, user agent) when an account is anonymised;
-- every other column is frozen. DELETE stays possible so the retention job
-- can expire old rows.
CREATE OR REPLACE FUNCTION audit_events_guard_update() RETURNS trigger AS $$
BEGIN
  IF (NEW."id", NEW."createdAt", NEW."category", NEW."action", NEW."outcome", NEW."reason",
      NEW."actorUserId", NEW."actorAccountType", NEW."institutionId", NEW."targetType",
      NEW."targetId", NEW."summary", NEW."metadata"::text)
     IS DISTINCT FROM
     (OLD."id", OLD."createdAt", OLD."category", OLD."action", OLD."outcome", OLD."reason",
      OLD."actorUserId", OLD."actorAccountType", OLD."institutionId", OLD."targetType",
      OLD."targetId", OLD."summary", OLD."metadata"::text)
  THEN
    RAISE EXCEPTION 'audit_events rows are append-only (only personal-data scrubbing is allowed)';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER audit_events_append_only
  BEFORE UPDATE ON "audit_events"
  FOR EACH ROW EXECUTE FUNCTION audit_events_guard_update();
