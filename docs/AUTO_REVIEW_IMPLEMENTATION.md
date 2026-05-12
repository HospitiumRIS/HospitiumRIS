# Auto-Review System Implementation

## Overview
A comprehensive unified auto-review configuration system for Clinical Trials, Research Proposals, and Ethics Applications with automated validation and human reviewer management.

## Implementation Status

### ✅ Phase 1: Database Schema (COMPLETED)
**File**: `prisma/schema.prisma`

Added the following models:
- `AutoReviewWorkflow` - Main workflow configuration
- `AutoReviewStage` - Individual stages in workflow
- `ValidationParameter` - Automated check parameters
- `ReviewerRole` - Reviewer role definitions
- `StageReviewer` - Human reviewer assignments
- `WorkflowExecution` - Track workflow runs
- `StageExecution` - Track stage completions
- `ValidationResult` - Store validation results
- `ReviewDecision` - Store reviewer decisions

Added enums:
- `WorkflowType` - CLINICAL_TRIAL, RESEARCH_PROPOSAL, ETHICS_APPLICATION, CUSTOM
- `ValidationParameterType` - 8 types of validation checks
- `WorkflowExecutionStatus` - Execution status tracking
- `StageExecutionStatus` - Stage-level status tracking
- `ReviewerRoleType` - Different reviewer role types

### ✅ Phase 2: API Routes (COMPLETED)
**Directory**: `src/app/api/institution/auto-review/`

Created endpoints:

#### Workflows
- `GET /api/institution/auto-review/workflows` - List all workflows
- `POST /api/institution/auto-review/workflows` - Create workflow
- `GET /api/institution/auto-review/workflows/[id]` - Get workflow details
- `PUT /api/institution/auto-review/workflows/[id]` - Update workflow
- `DELETE /api/institution/auto-review/workflows/[id]` - Delete workflow

#### Stages
- `POST /api/institution/auto-review/workflows/[id]/stages` - Add stage to workflow
- `PUT /api/institution/auto-review/stages/[id]` - Update stage
- `DELETE /api/institution/auto-review/stages/[id]` - Delete stage

#### Validation Parameters
- `POST /api/institution/auto-review/stages/[id]/parameters` - Add parameter to stage
- `PUT /api/institution/auto-review/parameters/[id]` - Update parameter
- `DELETE /api/institution/auto-review/parameters/[id]` - Delete parameter

#### Reviewers
- `GET /api/institution/auto-review/reviewers` - List available reviewers
- `POST /api/institution/auto-review/stages/[id]/reviewers` - Assign reviewer to stage
- `GET /api/institution/auto-review/stages/[id]/reviewers` - Get stage reviewers

#### Roles
- `GET /api/institution/auto-review/roles` - List reviewer roles
- `POST /api/institution/auto-review/roles` - Create reviewer role

### ✅ Phase 3: UI Components (COMPLETED)
**Directory**: `src/app/institution/administration/auto-review/`

Created pages:

#### Main Configuration Page (`page.js`)
Features:
- List all workflows with filtering by type
- Statistics dashboard (total workflows, active, by type)
- Create new workflow dialog
- Workflow cards showing:
  - Workflow name and type
  - Number of stages
  - Number of executions
  - Active/inactive status
  - Default workflow indicator
- Actions: Configure, Activate/Deactivate, Delete

#### Workflow Builder (`[id]/page.js`)
Features:
- Visual stage builder with stepper component
- Stage configuration:
  - Name, description
  - Required/optional
  - Auto-approve settings
  - Days to complete
  - Minimum approvals required
- Validation parameters management:
  - Add/edit/delete parameters
  - 8 validation types supported
  - Weight configuration (1-10)
  - Custom error/success messages
- Reviewer management:
  - Assign internal users or external reviewers
  - Role-based assignments
  - Required/optional reviewers
  - Email invitations for external reviewers

### ✅ Phase 4: Navigation Integration (COMPLETED)
**File**: `src/components/Navbar.js`

Updated Administration menu:
- Added new "REVIEW AUTOMATION" section
- Added "Auto-Review Configuration" link
- Path: `/institution/administration/auto-review`
- Icon: Settings icon
- Description: "Configure automated review workflows and parameters"

### 📋 Phase 5: Validation Engine (PENDING)
**Directory**: `src/lib/auto-review/` (To be created)

Planned modules:
- `validators/completeness.js` - Field completeness checks
- `validators/documents.js` - Document requirement checks
- `validators/budget.js` - Budget validation
- `validators/timeline.js` - Timeline validation
- `validators/risk.js` - Risk assessment
- `validators/compliance.js` - Regulatory compliance
- `validators/qualifications.js` - Team qualification checks
- `validators/custom.js` - Custom rule engine
- `executor.js` - Main workflow execution engine
- `notifier.js` - Reviewer notification system

### 📋 Phase 6: Reviewer Interface (PENDING)
**Directory**: `src/app/institution/reviews/` (To be created)

Planned pages:
- `page.js` - My Reviews list
- `[id]/page.js` - Review detail with auto-review results

## Database Migration

### Migration Status: ⚠️ PENDING

The schema has been updated but the migration needs to be run:

```bash
# Run this command to create and apply the migration
npx prisma migrate dev --name add_auto_review_system

# Or using node directly
node node_modules/prisma/build/index.js migrate dev --name add_auto_review_system
```

### Seed Default Reviewer Roles

After migration, seed the default reviewer roles:

```bash
node scripts/seed-reviewer-roles.js
```

This will create 7 default reviewer roles:
1. Primary Reviewer
2. Secondary Reviewer
3. Committee Chair (with override authority)
4. Technical Reviewer
5. Ethics Reviewer
6. Safety Reviewer
7. Scientific Reviewer

## Features Implemented

### Workflow Management
✅ Create workflows for different types (Clinical Trial, Proposal, Ethics)
✅ Set default workflows per type
✅ Activate/deactivate workflows
✅ Auto-routing configuration
✅ Human review requirements

### Stage Configuration
✅ Add multiple stages to workflows
✅ Configure stage order
✅ Set required/optional stages
✅ Auto-approval settings
✅ Timeline expectations (days to complete)
✅ Reviewer requirements (all vs. minimum)

### Validation Parameters
✅ 8 validation types:
  - Field Completeness
  - Document Requirements
  - Budget Validation
  - Timeline Validation
  - Risk Assessment
  - Regulatory Compliance
  - Team Qualifications
  - Custom Rules
✅ Configurable weights (1-10)
✅ Custom error/success messages
✅ Required/optional parameters
✅ Fail-on-error settings

### Reviewer Management
✅ Assign internal users as reviewers
✅ Invite external reviewers via email
✅ Role-based reviewer assignments
✅ Required vs. optional reviewers
✅ Multiple reviewers per stage
✅ Reviewer roles with permissions

## Next Steps

### Immediate (Required for Basic Functionality)
1. **Run Database Migration**
   - Execute Prisma migration
   - Seed reviewer roles

2. **Test Basic Workflow**
   - Create a test workflow
   - Add stages
   - Configure parameters
   - Assign reviewers

### Short-term (Phase 5 & 6)
3. **Implement Validation Engine**
   - Create validator modules
   - Build execution engine
   - Test validation logic

4. **Build Reviewer Interface**
   - Create review assignment pages
   - Show auto-review results
   - Implement decision forms

### Long-term (Enhancements)
5. **Advanced Features**
   - AI-powered risk assessment
   - Workflow templates
   - Analytics dashboard
   - External system integration
   - Mobile reviewer app
   - Workflow versioning

## Usage Guide

### Creating a Workflow

1. Navigate to Institution → Administration → Auto-Review Configuration
2. Click "Create Workflow"
3. Fill in:
   - Workflow name
   - Description
   - Type (Clinical Trial, Proposal, Ethics, Custom)
   - Active status
   - Default workflow toggle
   - Auto-routing settings
4. Click "Create Workflow"

### Configuring Stages

1. Click "Configure" on a workflow card
2. Click "Add Stage"
3. Configure:
   - Stage name and description
   - Required/optional
   - Auto-approve settings
   - Days to complete
   - Minimum approvals
4. Click "Create Stage"

### Adding Validation Parameters

1. In a stage, click "Add Parameter"
2. Select validation type
3. Configure:
   - Parameter name
   - Weight (1-10)
   - Error/success messages
   - Required/optional
   - Fail-on-error setting
4. Click "Add Parameter"

### Assigning Reviewers

1. In a stage, click "Add Reviewer"
2. Choose:
   - Internal user (from dropdown)
   - OR external reviewer (name + email)
3. Select reviewer role
4. Set required/optional
5. Click "Add Reviewer"

## API Usage Examples

### Create a Workflow
```javascript
POST /api/institution/auto-review/workflows
{
  "name": "Clinical Trial Review",
  "description": "Standard review workflow for clinical trials",
  "type": "CLINICAL_TRIAL",
  "isActive": true,
  "isDefault": true,
  "requireHumanReview": true,
  "autoRouteOnPass": false
}
```

### Add a Stage
```javascript
POST /api/institution/auto-review/workflows/{workflowId}/stages
{
  "name": "Ethics Review",
  "description": "Review ethics compliance",
  "isRequired": true,
  "autoApproveOnPass": false,
  "daysToComplete": 14,
  "minimumApprovals": 2
}
```

### Add Validation Parameter
```javascript
POST /api/institution/auto-review/stages/{stageId}/parameters
{
  "name": "Required Documents Check",
  "type": "DOCUMENT_REQUIREMENTS",
  "config": {
    "requiredDocuments": ["protocol", "consent_form", "investigator_brochure"]
  },
  "weight": 8,
  "isRequired": true,
  "failOnError": true
}
```

### Assign Reviewer
```javascript
POST /api/institution/auto-review/stages/{stageId}/reviewers
{
  "userId": "user_id_here",
  "roleId": "role_id_here",
  "isRequired": true,
  "order": 0
}
```

## Security Considerations

- ✅ Only Institution Admins can create/edit workflows
- ✅ Reviewers can only view assigned reviews
- ⚠️ Audit logging for workflow changes (to be implemented)
- ⚠️ Validation parameter changes require approval (to be implemented)

## Performance Considerations

- Database indexes added for:
  - Workflow lookups by type
  - Stage ordering
  - Execution status queries
- Pagination recommended for:
  - Workflow lists (implemented)
  - Execution history (to be implemented)

## Known Limitations

1. Database migration pending - system not yet functional
2. Validation engine not implemented - no actual validation occurs
3. Reviewer interface not built - reviewers cannot complete reviews
4. No email notifications for reviewer invitations
5. No workflow execution API - cannot trigger reviews
6. No analytics/reporting dashboard

## Files Created

### Database
- `prisma/schema.prisma` (modified)

### API Routes
- `src/app/api/institution/auto-review/workflows/route.js`
- `src/app/api/institution/auto-review/workflows/[id]/route.js`
- `src/app/api/institution/auto-review/workflows/[id]/stages/route.js`
- `src/app/api/institution/auto-review/stages/[id]/route.js`
- `src/app/api/institution/auto-review/stages/[id]/parameters/route.js`
- `src/app/api/institution/auto-review/stages/[id]/reviewers/route.js`
- `src/app/api/institution/auto-review/parameters/[id]/route.js`
- `src/app/api/institution/auto-review/reviewers/route.js`
- `src/app/api/institution/auto-review/roles/route.js`

### UI Pages
- `src/app/institution/administration/auto-review/page.js`
- `src/app/institution/administration/auto-review/[id]/page.js`

### Scripts
- `scripts/seed-reviewer-roles.js`

### Navigation
- `src/components/Navbar.js` (modified)

### Documentation
- `docs/AUTO_REVIEW_IMPLEMENTATION.md` (this file)

## Support

For issues or questions:
1. Check this documentation
2. Review the plan file: `.windsurf/plans/clinical-trial-auto-review-system-88a151.md`
3. Check API responses for error messages
4. Review browser console for client-side errors
