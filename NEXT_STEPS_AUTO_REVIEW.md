# Next Steps: Auto-Review System

## ✅ What Has Been Completed

### Phase 1-4 (DONE)
- ✅ Database schema with 9 new models
- ✅ 9 API route files for CRUD operations
- ✅ Main configuration UI page
- ✅ Workflow builder UI page
- ✅ Navigation menu integration
- ✅ Seed script for reviewer roles

## 🚀 Critical Next Steps (To Make It Work)

### Step 1: Run Database Migration ⚠️ REQUIRED

The database schema has been updated but needs to be migrated:

```powershell
# Option 1: Using npx (if execution policy allows)
npx prisma migrate dev --name add_auto_review_system

# Option 2: Using node directly
node node_modules/prisma/build/index.js migrate dev --name add_auto_review_system

# Option 3: If the above fail, try resetting the database (⚠️ WILL DELETE ALL DATA)
node node_modules/prisma/build/index.js migrate reset
```

**Expected Output:**
- Migration file created in `prisma/migrations/`
- All new tables created in database
- Prisma Client regenerated

### Step 2: Seed Reviewer Roles

After successful migration, run:

```powershell
node scripts/seed-reviewer-roles.js
```

**Expected Output:**
```
🌱 Seeding reviewer roles...
✓ Created role: Primary Reviewer
✓ Created role: Secondary Reviewer
✓ Created role: Committee Chair
✓ Created role: Technical Reviewer
✓ Created role: Ethics Reviewer
✓ Created role: Safety Reviewer
✓ Created role: Scientific Reviewer
✅ Reviewer roles seeded successfully!
```

### Step 3: Start the Development Server

```powershell
npm run dev
```

### Step 4: Test the System

1. **Navigate to the page:**
   - Go to `http://localhost:3000/institution`
   - Click on "Administration" in the menu
   - Click on "Auto-Review Configuration"

2. **Create a test workflow:**
   - Click "Create Workflow"
   - Name: "Test Clinical Trial Review"
   - Type: Clinical Trial
   - Click "Create Workflow"

3. **Configure the workflow:**
   - Click "Configure" on your new workflow
   - Click "Add Stage"
   - Name: "Initial Review"
   - Click "Create Stage"

4. **Add validation parameters:**
   - In the stage, click "Add Parameter"
   - Name: "Document Check"
   - Type: Document Requirements
   - Click "Add Parameter"

5. **Assign reviewers:**
   - In the stage, click "Add Reviewer"
   - Select a user or add external reviewer
   - Select a role
   - Click "Add Reviewer"

## 📋 Remaining Implementation (Phases 5-6)

### Phase 5: Validation Engine (Not Yet Started)

**What needs to be built:**
- Validator modules for each validation type
- Workflow execution engine
- Integration with clinical trial/proposal submission forms

**Estimated time:** 4-5 hours

**Files to create:**
```
src/lib/auto-review/
├── validators/
│   ├── completeness.js
│   ├── documents.js
│   ├── budget.js
│   ├── timeline.js
│   ├── risk.js
│   ├── compliance.js
│   ├── qualifications.js
│   └── custom.js
├── executor.js
└── notifier.js
```

### Phase 6: Reviewer Interface (Not Yet Started)

**What needs to be built:**
- Page showing assigned reviews
- Review detail page with auto-review results
- Decision forms (approve/reject/request changes)
- Comment system

**Estimated time:** 3-4 hours

**Files to create:**
```
src/app/institution/reviews/
├── page.js (My Reviews list)
└── [id]/page.js (Review detail)
```

## 🔧 Troubleshooting

### Migration Fails

**Error:** "Running scripts is disabled on this system"
**Solution:** Use node directly instead of npx:
```powershell
node node_modules/prisma/build/index.js migrate dev --name add_auto_review_system
```

**Error:** "We need to reset the database"
**Solution:** This means there are schema conflicts. You can:
1. Reset the database (⚠️ deletes all data):
   ```powershell
   node node_modules/prisma/build/index.js migrate reset
   ```
2. Or manually resolve conflicts in the schema

### Page Not Loading

**Error:** 404 on `/institution/administration/auto-review`
**Solution:** 
1. Ensure the file exists at `src/app/institution/administration/auto-review/page.js`
2. Restart the dev server
3. Clear browser cache

### API Errors

**Error:** "PrismaClient is unable to run in the browser"
**Solution:** API routes should have `'use server'` or be in `/api/` directory (already done)

**Error:** "Table does not exist"
**Solution:** Run the database migration (Step 1)

### No Reviewer Roles Available

**Error:** Dropdown is empty when adding reviewers
**Solution:** Run the seed script (Step 2)

## 📊 Current System Capabilities

### What Works Now (After Migration)
✅ Create/edit/delete workflows
✅ Add/edit/delete stages
✅ Configure validation parameters
✅ Assign reviewers (internal and external)
✅ Set workflow as default
✅ Activate/deactivate workflows
✅ View workflow statistics

### What Doesn't Work Yet
❌ Actually executing workflows on submissions
❌ Running validation checks
❌ Reviewer notifications
❌ Reviewer decision interface
❌ Auto-routing between stages
❌ Workflow execution tracking

## 🎯 Quick Start Guide

Once migration is complete, here's a typical workflow setup:

### Example: Clinical Trial Review Workflow

1. **Create Workflow**
   - Name: "Standard Clinical Trial Review"
   - Type: Clinical Trial
   - Set as default: Yes

2. **Add Stage 1: Administrative Check**
   - Name: "Administrative Pre-Review"
   - Days to complete: 3
   - Auto-approve: Yes
   - Parameters:
     - Field Completeness (weight: 8)
     - Document Requirements (weight: 10)

3. **Add Stage 2: Ethics Review**
   - Name: "Ethics Committee Review"
   - Days to complete: 14
   - Minimum approvals: 2
   - Reviewers:
     - Ethics Reviewer (required)
     - Committee Chair (required)
   - Parameters:
     - Regulatory Compliance (weight: 10)
     - Risk Assessment (weight: 8)

4. **Add Stage 3: Scientific Review**
   - Name: "Scientific Merit Review"
   - Days to complete: 10
   - Minimum approvals: 1
   - Reviewers:
     - Scientific Reviewer (required)
   - Parameters:
     - Timeline Validation (weight: 6)
     - Team Qualifications (weight: 7)

## 📞 Need Help?

If you encounter issues:

1. **Check the implementation doc:** `docs/AUTO_REVIEW_IMPLEMENTATION.md`
2. **Review the plan:** `.windsurf/plans/clinical-trial-auto-review-system-88a151.md`
3. **Check browser console** for JavaScript errors
4. **Check terminal** for server errors
5. **Verify database connection** in `.env` file

## 🎉 Success Indicators

You'll know the system is working when:
- ✅ You can access `/institution/administration/auto-review`
- ✅ You can create a new workflow
- ✅ You can add stages to the workflow
- ✅ You can add validation parameters
- ✅ You can assign reviewers
- ✅ Reviewer roles appear in the dropdown
- ✅ No console errors in browser or terminal

## 📈 Future Enhancements

After completing Phases 5-6, consider:
- Workflow templates for common scenarios
- Analytics dashboard
- Email notifications
- Mobile reviewer app
- AI-powered risk assessment
- Integration with external systems
- Workflow versioning
- Bulk operations
- Export/import workflows
- Workflow testing mode
