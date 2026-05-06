# Proposal Review Pipeline System

## Overview

The Proposal Review Pipeline system allows institutions to configure dynamic, multi-stage review processes for research proposals. This system implements the standard academic/medical research proposal review workflow with 8 predefined stage types plus custom stages.

---

## Standard Review Stages

### 1. Administrative Pre-Review (Triage)
**Purpose:** Ensure all required documents are present before scientific review  
**Checks:**
- CVs attached
- All signatures present
- Conflict of interest forms submitted
- Required supporting documents included

**Outcome:** Proposals with missing items are returned to the researcher

---

### 2. Scientific/Departmental Review
**Purpose:** Peer review at the department level  
**Evaluates:**
- **Feasibility:** Can the department afford this? Do they have the equipment?
- **Scientific Merit:** Is the hypothesis sound? Does the study design answer the question?

---

### 3. Institutional Review Board (IRB) / Ethics Committee (EC)
**Purpose:** Protection of human subjects  
**Review Types:**
- **Exempt Review:** Very low-risk research (e.g., de-identified archival data)
- **Expedited Review:** Minimal risk (e.g., blood draws from healthy adults)
- **Full Board Review:** Vulnerable populations or invasive procedures

---

### 4. Institutional Biosafety Committee (IBC)
**Purpose:** Safety protocols for biological hazards  
**Reviews:**
- Recombinant DNA research
- Infectious agents
- Wet lab biological hazards
- Ensures no biohazard leaks or staff exposure to pathogens

---

### 5. Radiation Safety Committee (RSC)
**Purpose:** Radiation exposure safety  
**Reviews:**
- X-rays, CT scans, radioactive tracers beyond standard of care
- Calculates radiation dose to patients
- Ensures doses are within safe limits

---

### 6. Conflict of Interest (COI) Committee
**Purpose:** Manage financial conflicts  
**Reviews:**
- Financial interests of investigators
- Stock ownership in companies related to the study
- Management plans to prevent bias

---

### 7. Office of Sponsored Programs (OSP) / Grants & Contracts
**Purpose:** Legal and financial review  
**Handles:**
- Contract negotiation with sponsors
- Budget verification
- Ensures funding covers actual costs

---

### 8. Clinical Trials Office (CTO) / Pharmacy Review
**Purpose:** Drug management for clinical trials  
**Reviews:**
- Drug storage protocols
- Blinding procedures
- Dispensing procedures

---

## Review Outcomes

Each stage can result in one of the following outcomes:

| Outcome | Meaning | Next Action |
|---------|---------|-------------|
| **Approved** | You are clear to begin | Proceed to next stage |
| **Approved with Contingencies** | You can start once you make minor changes | Address conditions, then proceed |
| **Deferred / Tabled** | Major questions; must resubmit | Revise and resubmit for next meeting |
| **Disapproved** | Fundamentally flawed or unethical | Cannot proceed |

---

## System Architecture

### Database Schema

#### ProposalReviewPipeline
- Defines the overall review pipeline
- Can have multiple pipelines per institution
- One pipeline can be set as default

#### ProposalReviewStage
- Individual stages within a pipeline
- Ordered sequence (1, 2, 3, etc.)
- Configurable approval requirements
- Can assign specific reviewers

#### ProposalReviewTracking
- Tracks a proposal's progress through the pipeline
- Links proposal to pipeline
- Tracks current stage and overall status

#### ProposalStageProgress
- Progress for each stage of a specific proposal
- Status, start/completion dates
- Assigned and completed reviewers

#### ProposalStageReview
- Individual review submissions
- Reviewer information and decision
- Comments and conditions

---

## User Interfaces

### 1. Institution Administration Page
**URL:** `http://localhost:3000/institution/administration/proposal-review-pipeline`

**Features:**
- Create and manage review pipelines
- Add/edit/delete review stages
- Reorder stages with up/down arrows
- Configure stage settings:
  - Stage type
  - Required vs optional
  - Auto-approve conditions
  - Expected days to complete
  - Reviewer assignments
  - Approval requirements (all reviewers vs minimum count)

---

### 2. Proposal Review Page
**URL:** `http://localhost:3000/institution/proposals/[id]/review`

**Features:**
- View proposal details
- See current review stage
- Submit review decision
- View review progress timeline
- See all previous reviews

---

### 3. Proposal Status Component
**Component:** `ProposalReviewStatus.js`

**Two Modes:**
- **Compact:** For list pages - shows current stage and status
- **Full:** For detail pages - shows complete stepper with all stages

---

## API Routes

### Pipeline Management

#### GET `/api/institution/proposal-review-pipeline`
Fetch all pipelines with their stages

#### POST `/api/institution/proposal-review-pipeline`
Create a new pipeline

#### PUT `/api/institution/proposal-review-pipeline/[pipelineId]`
Update a pipeline

#### DELETE `/api/institution/proposal-review-pipeline/[pipelineId]`
Delete a pipeline (only if not in use)

---

### Stage Management

#### POST `/api/institution/proposal-review-pipeline/[pipelineId]/stages`
Add a new stage to a pipeline

#### PUT `/api/institution/proposal-review-pipeline/[pipelineId]/stages/[stageId]`
Update a stage

#### DELETE `/api/institution/proposal-review-pipeline/[pipelineId]/stages/[stageId]`
Delete a stage and reorder remaining stages

#### POST `/api/institution/proposal-review-pipeline/[pipelineId]/stages/[stageId]/move`
Move a stage up or down in the order

---

### Proposal Review Workflow

#### POST `/api/proposals/[id]/submit`
Submit a proposal for review
- Changes status from DRAFT to SUBMITTED
- Creates ProposalReviewTracking
- Initializes all stage progress records
- Starts first stage

#### GET `/api/proposals/[id]/review-status`
Get the current review status and progress

#### POST `/api/proposals/[id]/review-stage`
Submit a review for a specific stage
- Records reviewer decision
- Checks if stage requirements are met
- Advances to next stage if approved
- Updates proposal status if all stages complete

---

## Workflow Example

### 1. Institution Setup
1. Admin navigates to Administration → Proposal Review Pipeline
2. Creates a new pipeline (e.g., "Standard Research Proposal Review")
3. Adds stages in order:
   - Administrative Review
   - Scientific Review
   - IRB Review
   - etc.
4. Configures each stage with reviewers and requirements
5. Sets as default pipeline

### 2. Researcher Submits Proposal
1. Researcher completes proposal form
2. Clicks "Submit for Review"
3. System:
   - Changes status to SUBMITTED
   - Assigns default pipeline
   - Creates tracking record
   - Starts first stage (Administrative Review)
   - Notifies assigned reviewers

### 3. Review Process
1. Administrative reviewer receives notification
2. Opens proposal review page
3. Checks for completeness
4. Submits decision (Approved/Disapproved/etc.)
5. If approved:
   - Stage marked complete
   - Next stage (Scientific Review) begins
   - Scientific reviewers notified
6. Process repeats for each stage

### 4. Completion
- When all stages are approved:
  - Proposal status changes to APPROVED
  - Overall tracking status set to COMPLETED
  - Researcher notified
- If any stage disapproves:
  - Proposal status changes to REJECTED
  - Process stops
  - Researcher notified with reasons

---

## Configuration Options

### Pipeline Settings
- **Name:** Descriptive name for the pipeline
- **Description:** Optional detailed description
- **Is Active:** Enable/disable the pipeline
- **Is Default:** Set as default for new proposals

### Stage Settings
- **Stage Type:** Select from 8 predefined types or Custom
- **Name:** Display name for the stage
- **Description:** Optional detailed description
- **Order:** Sequence in the pipeline
- **Is Required:** Can this stage be skipped?
- **Auto Approve:** Automatically approve if conditions met
- **Days to Complete:** Expected timeframe
- **Reviewer Roles:** Account types that can review
- **Reviewer Emails:** Specific email addresses of reviewers
- **Requires All Reviewers:** All must approve vs minimum count
- **Minimum Approvals:** Number of approvals needed

---

## Integration Points

### Notifications
The system is designed to send notifications at key points:
- Proposal submitted → Notify first stage reviewers
- Stage completed → Notify next stage reviewers
- Proposal approved/rejected → Notify researcher
- Review assigned → Notify specific reviewer

### Proposal Status
The proposal status field is automatically updated:
- DRAFT → SUBMITTED (on submission)
- SUBMITTED → UNDER_REVIEW (during review)
- UNDER_REVIEW → APPROVED (all stages approved)
- UNDER_REVIEW → REJECTED (any stage disapproved)

---

## Database Migration

**Note:** The database schema has been updated with the new models. You'll need to run:

```bash
npx prisma migrate dev --name add_proposal_review_pipeline
```

Or if you encounter PowerShell execution policy issues:

```bash
node node_modules/prisma/build/index.js migrate dev --name add_proposal_review_pipeline
```

---

## Future Enhancements

### Potential Additions:
1. **Email Notifications:** Automatic emails to reviewers
2. **Deadline Tracking:** Alerts for overdue reviews
3. **Parallel Reviews:** Multiple reviewers reviewing simultaneously
4. **Conditional Routing:** Skip stages based on proposal type
5. **Review Templates:** Pre-filled review forms per stage type
6. **Analytics Dashboard:** Track review times and bottlenecks
7. **Reviewer Workload:** Balance assignments across reviewers
8. **Appeal Process:** Allow researchers to appeal rejections
9. **Amendment Tracking:** Handle proposal modifications during review
10. **Integration with Calendar:** Schedule committee meetings

---

## Files Created

### Database Schema
- `prisma/schema.prisma` - Added review pipeline models

### Pages
- `src/app/institution/administration/proposal-review-pipeline/page.js` - Pipeline management UI
- `src/app/institution/proposals/[id]/review/page.js` - Review submission UI

### Components
- `src/components/Proposals/ProposalReviewStatus.js` - Status display component

### API Routes
- `src/app/api/institution/proposal-review-pipeline/route.js` - List/create pipelines
- `src/app/api/institution/proposal-review-pipeline/[pipelineId]/route.js` - Get/update/delete pipeline
- `src/app/api/institution/proposal-review-pipeline/[pipelineId]/stages/route.js` - Create stage
- `src/app/api/institution/proposal-review-pipeline/[pipelineId]/stages/[stageId]/route.js` - Update/delete stage
- `src/app/api/institution/proposal-review-pipeline/[pipelineId]/stages/[stageId]/move/route.js` - Reorder stages
- `src/app/api/proposals/[id]/submit/route.js` - Submit proposal for review
- `src/app/api/proposals/[id]/review-status/route.js` - Get review status
- `src/app/api/proposals/[id]/review-stage/route.js` - Submit stage review

---

## Usage Instructions

### For Institution Administrators

1. **Access Pipeline Management:**
   - Navigate to: `http://localhost:3000/institution/administration/proposal-review-pipeline`

2. **Create First Pipeline:**
   - Click "Create Pipeline"
   - Enter name (e.g., "Standard Research Proposal Review")
   - Add description
   - Check "Set as Default Pipeline"
   - Click "Create"

3. **Add Review Stages:**
   - Click "Add Stage" on your pipeline
   - Select stage type from dropdown
   - Configure settings
   - Add reviewer emails
   - Click "Add"
   - Repeat for all stages

4. **Reorder Stages:**
   - Use up/down arrows to adjust stage order

### For Reviewers

1. **Access Review Page:**
   - Navigate to: `http://localhost:3000/institution/proposals/[proposalId]/review`
   - Or click review link from notification

2. **Submit Review:**
   - Enter your name and email
   - Select decision (Approved/Approved with Contingencies/Deferred/Disapproved)
   - Add comments
   - If approved with contingencies, list conditions
   - Click "Submit Review"

### For Researchers

1. **View Proposal Status:**
   - The `ProposalReviewStatus` component shows current stage
   - Displays progress through all stages
   - Shows reviewer decisions and comments

---

## Troubleshooting

### Pipeline Not Appearing
- Ensure pipeline is marked as "Active"
- Check that at least one pipeline is set as "Default"

### Review Not Advancing
- Verify minimum approval requirements are met
- Check that all required reviewers have submitted
- Ensure reviewer emails match assigned emails

### Cannot Delete Pipeline
- Pipeline cannot be deleted if proposals are using it
- Archive proposals first or reassign to different pipeline

---

## Support

For questions or issues with the proposal review pipeline system, contact your system administrator or refer to the technical documentation.
