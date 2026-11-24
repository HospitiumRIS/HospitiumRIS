-- Private training calendar feed (#108)
CREATE TABLE "training_calendar_feeds" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "rotatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastUsedAt" TIMESTAMP(3),
    CONSTRAINT "training_calendar_feeds_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "training_calendar_feeds_userId_key" ON "training_calendar_feeds"("userId");
CREATE UNIQUE INDEX "training_calendar_feeds_token_key" ON "training_calendar_feeds"("token");

ALTER TABLE "training_calendar_feeds" ADD CONSTRAINT "training_calendar_feeds_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
