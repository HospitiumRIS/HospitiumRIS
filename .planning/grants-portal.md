# Researcher Grants Application Portal

Build a connected grants lifecycle portal for researchers to apply for external grants, send/track emails, and manage the full process from application to award/rejection.

---

## Context

The Prisma schema already has complete models: `GrantApplication`, `GrantCommunication`, `GrantMilestone`, `GrantAward`, `GrantReport`. Backend APIs exist at `/api/grants/applications` and sub-routes. The liaison page (`/researcher/projects/proposals/liason`) uses mock data. The new portal is a **separate section** at `/researcher/projects/grants/`.

---

## Plan

### Phase 1 — Missing Backend APIs (3 endpoints)

**1. `/api/grants/applications/[id]/email` (POST)**
- Compose & send real email to grantor via `src/lib/email.js` (nodemailer)
- Automatically create a `GrantCommunication` record (type: `EMAIL_OUTGOING`)
- Log incoming emails manually via same endpoint with `direction: INCOMING`

**2. `/api/grants/applications/[id]/milestones` (GET/POST) + `[milestoneId]` (PUT/DELETE)**
- Full CRUD for `GrantMilestone` records

**3. `/api/grants/applications/[id]/award` (POST/PUT)**
- Create/update `GrantAward` + manage `GrantReport` records

---

### Phase 2 — Frontend Pages

**A. `/researcher/projects/grants/list/page.js`**
- Stats cards: Total, Pending, Under Review, Awarded, Rejected, Total Funding
- Table of all grant applications with status chips, priority badges, deadline countdowns
- Filter by status/priority, search by title/grantor
- "New Application" button → create page

**B. `/researcher/projects/grants/create/page.js`**
- Stepper form to create a grant application
- Step 1: Select linked approved proposal (dropdown fetched from `/api/proposals?status=APPROVED`)
- Step 2: Grantor details (name, email, contact person, phone, grant program)
- Step 3: Application details (title, requested amount, submission deadline)
- Step 4: Requirements checklist & notes

**C. `/researcher/projects/grants/view/[id]/page.js`**
- Tabbed detail view:
  - **Overview** — application info, current status, update status button with workflow (PREPARING → READY_TO_SUBMIT → SUBMITTED → UNDER_REVIEW → AWARDED/REJECTED)
  - **Communications** — timeline of all emails/calls/notes; compose email dialog (sends real email + logs); log incoming email dialog; add note/call entry
  - **Milestones** — add/edit/complete milestones with due dates and progress
  - **Award** — appears when status = AWARDED; record award amount, dates, grant number, reporting schedule

---

### Phase 3 — Navbar Update

Add a **"Grants Portal"** entry to the researcher Projects → PROPOSALS section in `src/components/Navbar.js` pointing to `/researcher/projects/grants/list`.

---

## File Changelist

| Action | File |
|--------|------|
| **CREATE** | `src/app/api/grants/applications/[id]/email/route.js` |
| **CREATE** | `src/app/api/grants/applications/[id]/milestones/route.js` |
| **CREATE** | `src/app/api/grants/applications/[id]/milestones/[milestoneId]/route.js` |
| **CREATE** | `src/app/api/grants/applications/[id]/award/route.js` |
| **CREATE** | `src/app/researcher/projects/grants/list/page.js` |
| **CREATE** | `src/app/researcher/projects/grants/create/page.js` |
| **CREATE** | `src/app/researcher/projects/grants/view/[id]/page.js` |
| **EDIT** | `src/components/Navbar.js` — add Grants Portal nav entry |
| **MIGRATE** | `prisma/schema.prisma` — add `applicationTemplate Json?` to `Grantor` model |
| **CREATE** | `src/app/api/foundation/grantors/[id]/template/route.js` — PUT endpoint for Foundation Admin |
| **EDIT** | Foundation grantor page — add Template tab (if page exists, else note for Foundation Admin) |

---

### Phase 4 — Grantor Application Templates

**Scope**: Low-medium. One schema migration, one API endpoint, two UI touch-points.

**How it works (two-tier):**

| Tier | Who | Where managed | Storage |
|------|-----|---------------|---------|
| Institution template | Foundation Admin | Foundation Admin's grantor profile editor | `Grantor.applicationTemplate Json?` |
| Personal template | Researcher | "Copy from previous application" picker in create form | No new model — reads existing `GrantApplication` records |

**Schema change** — add one field to `Grantor`:
```prisma
applicationTemplate Json? // { requirements: [], grantProgram: '', amountRange: {min, max}, requiredDocuments: [], notes: '' }
```

**New API**: `PUT /api/foundation/grantors/[id]/template` — save/update a grantor's template (Foundation Admin only)

**Foundation Admin UI** — add a "Template" tab/section to the grantor detail page at `/foundation/grants/` for editing the template JSON in a structured form

**Researcher create form integration** — after selecting a grantor:
- If a Foundation template exists → show **"Load Institution Template"** button
- If researcher has prior applications to this grantor → show **"Copy from my previous application"** dropdown
- Loading either pre-fills: requirements checklist, grant program, requested amount, required documents

---

## Key Decisions

- Grant applications require an APPROVED proposal (existing API constraint kept)
- Emails are sent via existing SMTP nodemailer setup and auto-logged as `GrantCommunication`
- Incoming emails logged manually by researcher (no email polling/webhook)
- Status transitions follow the existing `GrantApplicationStatus` enum: `PREPARING → READY_TO_SUBMIT → SUBMITTED → UNDER_REVIEW → ADDITIONAL_INFO_REQUESTED → AWARDED / REJECTED / WITHDRAWN`
- Liaison page at `/researcher/projects/proposals/liason` is **untouched**
- Grantor templates are **optional** — researchers can always fill the form manually
