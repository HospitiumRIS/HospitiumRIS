-- Researcher onboarding: welcome tour + profile checklist
ALTER TABLE "users"
  ADD COLUMN "onboardingCompletedAt" TIMESTAMP(3),
  ADD COLUMN "profileChecklistDismissedAt" TIMESTAMP(3);

-- Existing accounts are not "first-time" users: don't show them the tour
-- (they can still open it from the user menu, and still see the profile checklist).
UPDATE "users" SET "onboardingCompletedAt" = CURRENT_TIMESTAMP;
