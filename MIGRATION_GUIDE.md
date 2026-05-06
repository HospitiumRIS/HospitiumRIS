# Database Migration Guide - Proposal Review Pipeline

## Overview

You need to run a database migration to add the new Proposal Review Pipeline tables to your database.

---

## Quick Start

### Option 1: Using the Migration Script (Recommended)

Run this command in your terminal:

```bash
node scripts/run-migration.js
```

This script bypasses PowerShell execution policy issues.

---

### Option 2: Direct Prisma Command

If you have PowerShell execution enabled:

```bash
npx prisma migrate dev --name add_proposal_review_pipeline
```

---

### Option 3: Manual Node Command

```bash
node node_modules/prisma/build/index.js migrate dev --name add_proposal_review_pipeline
```

---

## What This Migration Adds

The migration creates 5 new tables:

1. **proposal_review_pipelines** - Container for review workflows
2. **proposal_review_stages** - Individual review stages (Administrative, Scientific, IRB, etc.)
3. **proposal_review_tracking** - Links proposals to pipelines and tracks progress
4. **proposal_stage_progress** - Progress through each stage for a specific proposal
5. **proposal_stage_reviews** - Individual reviewer submissions

---

## Troubleshooting

### Error: "Cannot read properties of undefined (reading 'findMany')"

**Cause:** The database tables haven't been created yet.

**Solution:** Run one of the migration commands above.

---

### Error: "PowerShell execution policy"

**Cause:** Windows PowerShell script execution is disabled.

**Solution:** Use Option 1 (migration script) or Option 3 (manual node command).

---

### Error: "Database connection failed"

**Cause:** PostgreSQL is not running or DATABASE_URL is incorrect.

**Solutions:**
1. Start PostgreSQL service
2. Check your `.env` file for correct DATABASE_URL
3. Verify database credentials

---

### Error: "We need to reset the database"

**Cause:** Schema changes conflict with existing database state.

**Options:**

**Option A: Reset Database (CAUTION: Deletes all data)**
```bash
node node_modules/prisma/build/index.js migrate reset
```

**Option B: Create Migration Without Applying**
```bash
node node_modules/prisma/build/index.js migrate dev --create-only --name add_proposal_review_pipeline
```
Then manually edit the migration SQL if needed.

---

## After Migration

1. **Restart your development server:**
   ```bash
   npm run dev
   ```

2. **Access the pipeline configuration page:**
   ```
   http://localhost:3000/institution/administration/proposal-review-pipeline
   ```

3. **Create your first pipeline:**
   - Click "Create Pipeline"
   - Name it (e.g., "Standard Research Proposal Review")
   - Add review stages
   - Set as default

---

## Verification

After running the migration, verify it worked:

```bash
node node_modules/prisma/build/index.js studio
```

This opens Prisma Studio where you can see the new tables.

---

## Migration Contents

The migration adds these models to your schema:

```prisma
enum ReviewStageType {
  ADMINISTRATIVE_REVIEW
  SCIENTIFIC_REVIEW
  IRB_ETHICS_REVIEW
  BIOSAFETY_REVIEW
  RADIATION_SAFETY_REVIEW
  CONFLICT_OF_INTEREST_REVIEW
  SPONSORED_PROGRAMS_REVIEW
  CLINICAL_TRIALS_REVIEW
  CUSTOM
}

enum ReviewStageStatus {
  NOT_STARTED
  IN_PROGRESS
  APPROVED
  APPROVED_WITH_CONTINGENCIES
  DEFERRED
  DISAPPROVED
  SKIPPED
}

model ProposalReviewPipeline { ... }
model ProposalReviewStage { ... }
model ProposalReviewTracking { ... }
model ProposalStageProgress { ... }
model ProposalStageReview { ... }
```

---

## Need Help?

If you continue to have issues:

1. Check that PostgreSQL is running
2. Verify your `.env` DATABASE_URL is correct
3. Ensure you have write permissions to the database
4. Check the Prisma logs for detailed error messages

---

## Rollback

If you need to rollback this migration:

```bash
node node_modules/prisma/build/index.js migrate resolve --rolled-back add_proposal_review_pipeline
```

**Note:** This only marks the migration as rolled back. You'll need to manually drop the tables or restore from backup.
