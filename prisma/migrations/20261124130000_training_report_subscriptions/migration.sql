-- Monthly training analytics email (#138)
CREATE TABLE "training_report_subscriptions" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "institutionId" TEXT NOT NULL,
    "lastSentPeriod" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "training_report_subscriptions_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "training_report_subscriptions_userId_key" ON "training_report_subscriptions"("userId");
CREATE INDEX "training_report_subscriptions_institutionId_idx" ON "training_report_subscriptions"("institutionId");

ALTER TABLE "training_report_subscriptions" ADD CONSTRAINT "training_report_subscriptions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
