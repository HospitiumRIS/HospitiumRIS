# Project Management Module — Full End-to-End Overhaul

This plan documents all discovered issues and improvements across the researcher and research admin sides of the project management module, organized into prioritized phases.

---

## Current Workflow Summary

### Researcher Side
| Page | Path | Status |
|------|------|--------|
| Create Proposal (7-step wizard) | `/researcher/projects/proposals/create` | ✅ Functional |
| Proposal List | `/researcher/projects/proposals/list` | ⚠️ Partial bugs |
| View Proposal | `/researcher/projects/proposals/view/[id]` | ✅ Functional |
| Edit Proposal | `/researcher/projects/proposals/edit/[id]` | ✅ Functional |
| Grant Liaison | `/researcher/projects/proposals/liason` | ❌ All mock data |
| Budget Management | `/researcher/projects/budget/view` | ⚠️ Disconnected |

### Research Admin Side
| Page | Path | Status |
|------|------|--------|
| Proposal Review List | `/institution/proposals/review` | ❌ Review submit broken |
| Proposal Review Detail | `/institution/proposals/review/[id]` | ✅ Functional |
| Project Tracking | `/institution/projects` | ✅ Functional |
| Project Detail | `/institution/projects/[id]` | ✅ Functional |

---

## Phase 1 — Critical Bug Fixes

### 1.1 Fix Review Submission (Admin)
**File:** `src/app/institution/proposals/review/page.js` (line ~367)

`handleSubmitReview` uses a fake `setTimeout` instead of calling the API. It never persists the decision to the database.

**Fix:** Replace the simulated API call with a real `PATCH /api/proposals/[id]` (or `POST /api/proposals/[id]/review`) request that updates `proposal.status` and appends to `proposal.reviewHistory`.

### 1.2 Fix Non-Functional Filters in Researcher Proposal List
**File:** `src/app/researcher/projects/proposals/list/page.js`

- `timeFilter` state is set but never applied to `filteredProposals` — filtering by "Last 3 Months" etc. does nothing.
- `sortBy` state is set but never used — "Sort By Title/Status/Due Date" has no effect.

**Fix:** Apply time-based filtering and sort logic to `filteredProposals` computation.

### 1.3 Add REJECTED / REVISION_REQUESTED to Researcher Status Filter
**File:** `src/app/researcher/projects/proposals/list/page.js` (line ~557)

The status `<Select>` only lists DRAFT, UNDER_REVIEW, APPROVED. Rejected and revision-requested proposals exist in the DB but are unfilter-able.

**Fix:** Add `REJECTED` and `REVISION_REQUESTED` as filter options.

### 1.4 Fix Status Chip Colors (Researcher Proposal List)
**File:** `src/app/researcher/projects/proposals/list/page.js` (line ~800)

All status chips render with `bgcolor: '#8b6cbc'` regardless of status. REJECTED should show red, APPROVED green, etc.

**Fix:** Update `getStatusColor` to return contextual colors and wire them into the Chip `sx`.

### 1.5 Replace `window.alert` / `window.confirm` With MUI Dialogs
**Files:** Proposal list page, liaison page, proposal create page.

Raw browser dialogs break UX and cannot be styled. Replace all `alert()` and `window.confirm()` calls with MUI `<Dialog>` or `<Snackbar>` components.

### 1.6 Add Authentication to `GET /api/proposals`
**File:** `src/app/api/proposals/route.js` (line ~14)

The GET route has a `// TODO: Add proper authentication` comment and returns all proposals to any caller.

**Fix:** Add `getAuthenticatedUser()` check and scope the query to the current user's institution (or own proposals for researchers).

---

## Phase 2 — Admin Workflow Enhancements

### 2.1 Admin Proposal Inbox / Priority Queue
Create a dedicated panel (or enhance the review list header) that shows:
- Count of proposals waiting > N days without action
- Proposals with approaching SLA deadlines
- Proposals returned to UNDER_REVIEW after revision

### 2.2 Reviewer Assignment
Add a `reviewerId` field to the review action. The submit-review dialog should allow the admin to assign the proposal to a named reviewer before or while submitting feedback. Display assigned reviewer on the list and detail views.

### 2.3 SLA / Days-in-Review Tracking
The review list already calculates `daysInReview` but doesn't surface it prominently.

**Improvements:**
- Add a visible "Days in Review" column to the proposals table.
- Color-code rows: yellow for > 7 days, red for > 14 days.
- Add an overdue badge to the stats card.

### 2.4 Structured Review Feedback (Comment Threading)
Currently the review form has flat text fields (`comments`, `feedback`, `conditions`). Researchers see only a warning icon and a status change.

**Improvements:**
- Save review comments per proposal with `reviewerId`, `timestamp`, `visibility` (Internal / Shared with Researcher).
- Show "Shared" comments to the researcher in the proposal view as a numbered feedback thread.
- Allow admin to add follow-up comments without changing the status.

### 2.5 Explicit Project Activation Step
Currently the system auto-treats APPROVED proposals as ONGOING projects. There is no explicit activation step.

**Add:** An "Activate Project" action button on the Project Tracking list and Project Detail page (visible only for APPROVED proposals that haven't started). Clicking it should:
1. Update `proposal.status` or create a separate `Project` record.
2. Set the `startDate` if not already set.
3. Notify the researcher.

### 2.6 Project Status Override (Admin)
The project status (ONGOING / DELAYED / AT_RISK) is currently derived automatically from dates. Admins should be able to manually override status with a reason (e.g., "Suspended — ethics re-review required").

---

## Phase 3 — Researcher Experience Improvements

### 3.1 Inline Feedback Panel in Proposal List
Currently, REJECTED/REVISION_REQUESTED proposals show a `WarningIcon` tooltip. Clicking the row opens a simple text dialog.

**Improve:** Replace with a slide-out side panel or expandable row that shows the full, structured admin feedback thread (from Phase 2.4), revision history, and a rich-text response field.

### 3.2 Active Project Dashboard for Researcher
After a proposal is approved and active, researchers have no dedicated project view.

**Create:** `/researcher/projects/active` — a page showing:
- Active projects with milestone checklists (mark milestones complete).
- Budget utilisation bar (spent vs. approved).
- Upcoming deliverable deadlines.
- Quick link to related ethics application.

### 3.3 Milestone Completion by Researcher
**Files:** The `milestones` array lives in the `Proposal` JSON field.

Currently, only admins can see milestone progress. Researchers should be able to:
- Mark individual milestones as complete from their project view.
- Add notes per milestone.
- This triggers a notification to the research admin.

### 3.4 Budget Integration with Proposal
**File:** `src/app/researcher/projects/budget/view/page.js`

The budget management page loads projects independently. It should:
- Pre-populate budget categories and approved amount from the linked proposal.
- Show budget utilisation on the researcher's active project card.

---

## Phase 4 — Grant Liaison Page Overhaul

### 4.1 Connect Liaison Page to Real Data
**File:** `src/app/researcher/projects/proposals/liason/page.js`

The entire page uses `mockGrantApplications` hard-coded in the component. All actions (add application, schedule call, update status) are in-memory and lost on refresh.

**Plan:**
1. **Schema:** Add a `GrantApplication` model (or reuse `Proposal`) with fields for external funder contact, follow-up dates, call logs, and status history.
2. **API:** Create `GET/POST /api/grants/applications` and `PATCH /api/grants/applications/[id]`.
3. **Frontend:** Replace `useState(mockGrantApplications)` with real API calls; persist all status updates and call records.

### 4.2 Link Liaison Applications to Proposals
Each liaison grant application should optionally link to an existing `Proposal` record (the source proposal submitted internally). This closes the loop: researcher creates a proposal → submits to external funder → tracks liaison communications → funder approves → maps back to the internal project.

### 4.3 Persist Call / Communication Logs
Scheduled calls and outcomes are currently only in `useState`. Persist them to the database so the call history survives page reloads.

---

## Phase 5 — API & Backend Hardening

### 5.1 Fix Hardcoded `institutionId: 'default'` in Pipeline API
**File:** `src/app/api/institution/proposal-review-pipeline/route.js` (line ~67)

Replace with the authenticated user's `institutionId` from session.

### 5.2 Scope Proposal Queries by Institution
`GET /api/proposals` and `GET /api/institution/projects` should filter by `institutionId` so researchers only see their own institution's proposals.

### 5.3 Add Review History Persistence
The review submission (once fixed in Phase 1.1) should persist to a structured `reviewHistory` field or a dedicated `ProposalReview` table rather than appending to a JSON array.

---

## Implementation Order

| Priority | Phase | Effort |
|----------|-------|--------|
| 🔴 Immediate | Phase 1 — Bug Fixes | ~1–2 days |
| 🟠 High | Phase 2.1–2.4 — Admin Workflow | ~2–3 days |
| 🟡 Medium | Phase 3.1–3.3 — Researcher UX | ~2 days |
| 🟡 Medium | Phase 5 — Backend Hardening | ~1 day |
| 🟢 Low | Phase 3.4 — Budget Integration | ~1 day |
| 🟢 Low | Phase 4 — Liaison Overhaul | ~3–4 days |

---

## Files Involved (Summary)

| File | Change |
|------|--------|
| `src/app/institution/proposals/review/page.js` | Fix review submission, add SLA coloring, reviewer assignment |
| `src/app/researcher/projects/proposals/list/page.js` | Fix filters/sort, chip colors, status options, replace alerts |
| `src/app/researcher/projects/proposals/liason/page.js` | Replace mock data with real API |
| `src/app/api/proposals/route.js` | Add auth, scope by institution |
| `src/app/api/proposals/[id]/review/route.js` | Ensure review persists correctly |
| `src/app/api/institution/proposal-review-pipeline/route.js` | Fix hardcoded institutionId |
| `src/app/institution/projects/page.js` | Add Activate Project button |
| `src/app/institution/projects/[id]/page.js` | Add status override, feedback thread |
| `src/app/researcher/projects/proposals/view/[id]/page.js` | Show structured admin feedback |
| `src/app/researcher/projects/budget/view/page.js` | Link to proposal budget data |
| `prisma/schema.prisma` | Add GrantApplication model (Phase 4) |
| `src/app/api/grants/` | New grant liaison APIs (Phase 4) |
