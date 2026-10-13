# Image Integrity (ImaChek) — Analysis & Improvement Report

**Prepared for:** Stephen Gaita, HospitiumRIS
**Date:** September 18, 2026
**Scope:** Researcher and Institution "Image Integrity" module (`/researcher/image-integrity`, `/researcher/image-integrity/[id]`, `/institution/image-integrity`, `/institution/image-integrity/usage`, `/institution/image-integrity/[id]`), cross-checked against the three ImaChek "Getting Started" guides (Institution Admin, Lab/Unit Admin, User) and the underlying route/page source code.

**Method:** (1) read all three ImaChek vendor guides in full to establish the product's complete capability set; (2) read the 10 HospitiumRIS source files that implement the feature (5 pages, 5 API routes) via a full code review; (3) live-tested the four pages in a running dev instance (empty-state, "New Integrity Check" modal, Usage Report, and direct navigation to a non-existent record) to confirm or refute what the code implied. Findings below are marked **[Live-confirmed]** where I reproduced them in the browser, or **[Code review]** where they come from reading the source only.

---

## 1. Executive summary

HospitiumRIS currently wraps a *thin slice* of what ImaChek can do: upload → poll status → view an aggregate similarity/manipulation count → open ImaChek's own hosted report in a new tab. That slice is implemented reasonably cleanly (a real batch-upload validation pass, DOI/Crossref autofill, cross-document comparison, and a usage-reporting layer all exist), but the integration has:

- **One confirmed functional bug that blocks a whole feature** — the Institution Usage Report's Search button throws "Unauthorized" and cannot be used at all in the current build.
- **A likely cross-institution data leak** — none of the four institution-facing API routes appear to filter by the requesting admin's own institution, so an institution admin may be able to see (and compare) every other institution's submissions.
- **A large, growing gap** between what ImaChek's own product can do (manual duplication/manipulation analysis tools, per-metric breakdowns, AI/C2PA detection, image cropping, a "My Collections" tagging system, a lab/unit-scoped Repository module) and what's exposed in HospitiumRIS today (a list, a detail summary, and a link out to ImaChek's own UI for anything deeper).
- **Meaningful, low-effort UX inconsistencies** between the Researcher and Institution versions of the same feature (missing KPI cards, a less accessible preview modal, native `alert()`/`confirm()` popups that break the app's own i18n and design system).

None of this is a "start over" situation — the foundation (auth-gated API routes, a real Prisma data model, batch validation, polling) is solid. The work is mostly: fix the two live-breaking issues, close the security gap, then decide deliberately how much of ImaChek's deeper toolset (Section 6) is worth building in-app versus intentionally leaving to ImaChek's own hosted report.

---

## 2. Priority punch list

### Fix now (bugs / security — days, not sprints)

1. **Usage Report is broken.** Clicking "Search" on `/institution/image-integrity/usage` returns a raw "Unauthorized" error and the report never renders. **[Live-confirmed]** This is the only way institution admins can see monthly/session/account/group/lab usage — right now it doesn't work at all. *(§4.1)*
2. **Verify and fix institution-side tenant scoping.** None of `GET /api/institution/image-integrity`, `GET /api/institution/image-integrity/[id]`, `POST /api/institution/image-integrity/compare`, or `GET /api/institution/image-integrity/usage` filter by the acting admin's institution in the code reviewed — meaning an institution admin can plausibly view, compare, and pull usage stats for every institution on the platform, not just their own. **[Code review — verify against `getAuthenticatedUser`/middleware before treating as confirmed, but nothing in the route bodies shows scoping happening]**. *(§5.2)*
3. **Breadcrumb bug on Usage Report:** shows "Institution Portal / Image Integrity / **Usage Report / Usage Report**" (duplicated segment). **[Live-confirmed]** *(§4.1)*
4. **Enforce the 10-record compare cap server-side.** It's only enforced in React state today; `POST /api/institution/image-integrity/compare` checks a minimum (≥2) but no maximum. **[Code review]** *(§5.3)*

### Next (this quarter — UX parity & polish)

5. Add the same summary KPI cards (Total/Completed/In progress/Failed/With findings) to the Institution submissions list that Researcher already has. **[Live-confirmed]** *(§4.2)*
6. Replace the generic, unstyled "Unauthorized" error shown for **both** "record doesn't exist" and "actually not authorized" with distinct, honest states (Not Found vs. No Access vs. Error), on both Researcher and Institution detail pages. **[Live-confirmed]** *(§4.3)*
7. Replace `window.confirm()` / `alert()` (delete-submission confirmation, delete-failure, report-generation-failure) with the app's own MUI dialog/snackbar pattern, and route the strings through `t()` like everything else on the page. **[Code review]** *(§5.1)*
8. Fix the silent failure when "Delete submission" fails due to a network error — right now it only logs to `console.error`, the user sees nothing happen. **[Code review]** *(§5.1)*
9. Rebuild the Institution list's image-preview overlay as a proper MUI `Dialog` (it's currently a hand-rolled `position:fixed` box with no `role`, no focus trap, and no Escape-to-close) — Researcher's equivalent already does this correctly, so this is a straight port. **[Code review]** *(§5.1)*
10. Reconcile the batch upload cap: the vendor guide specifies **25** files per repository upload; HospitiumRIS enforces **20** on both client and server. Decide if 20 is intentional (e.g., a deliberate safety margin) and if so, say so in the UI copy. **[Code review]** *(§6)*
11. Add server-side pagination (`take`/`skip`) to both list endpoints — everything is currently fetched in full and paginated/filtered client-side, which won't scale past a few hundred submissions, especially for the institution-wide view. **[Code review]** *(§5.1)*
12. Decide on vendor-name exposure: "ImaChek" appears verbatim in ~10 user-facing strings (disclaimers, hints, page subtitles). Fine if the product is happy to co-brand; a real gap if any white-labeling is planned. **[Code review + live-confirmed via UI copy]** *(§6)*

### Later (roadmap — feature depth)

13. Decide, deliberately, how much of ImaChek's deeper toolset to bring in-app vs. leave as "open full report" hand-offs: manual analysis tool (adjustment/intersection/edit modes), per-metric breakdown (Features/Color/Fingerprint), manipulation-filter breakdown (Beautification/Splicing/Contrast/Edge/Noise), AI-generated/C2PA badge, and image cropping/redetection. *(§6, §7)*
14. Consider a "My Collections" equivalent (folders/tags/notes/links) if researchers are expected to manage many submissions over time — right now every submission is a flat, ungrouped row. *(§6)*
15. Consider whether HospitiumRIS needs ImaChek's Lab/Unit + Group structure (and the optional pre-submission Repository module) for larger, multi-department institutions, or whether the current 2-role (Researcher / Institution) simplification is intentional and sufficient. *(§7)*
16. Extract the ~90%-duplicated Researcher/Institution list and detail pages into shared components/hooks (`useImageIntegrityList`, `useCaseCompare`, a shared `<SubmissionThumbnail>` etc.) before the two versions drift further apart — the accessibility and stat-card gaps above are early symptoms of that drift. *(§5.4)*
17. Add automated tests (even a handful of Playwright smoke tests for "upload → view → compare → usage report") given that both live-breaking bugs above were only caught by manually clicking through the app, not by any existing safety net. *(Improve & Suggest, below)*

---

## 3. What ImaChek actually offers (from the vendor guides)

ImaChek is a three-tier product: **Institution Administrator** (accounts, lab/unit provisioning, org-wide usage), **Lab/Unit Administrator** (accounts within a lab/unit, groups, usage, and an optional **Repository** module for pre-submission checks), and **User** (the actual image-integrity workflow: upload, analyze, review, and manage results). Its core analysis capabilities:

| Capability | Description |
|---|---|
| Upload | png/tiff/jpg/jpeg/zip/pdf, up to 25MB/file, one PDF per upload, up to 25 files per repository batch |
| DOI autofill | Enter a DOI, authors are pulled from Crossref |
| Repository comparison | Compare against "None" or the "Global" published image library |
| Duplication analysis | Similarity levels **High/Medium/Low**, with sub-metrics: **Features** (matching image features), **Color** (color-histogram similarity), **Fingerprint** (perceptual-hash similarity) |
| Manual duplication tool | Side-by-side adjustment (contrast/brightness/saturation/transparency), edit/annotate mode, **similarity heatmap**, and **intersection mode** (overlay + rotate to compare duplicated regions) |
| Manipulation analysis | Filter-by-filter results: Beautification (color-imbalance %), Splicing Line, Contrast (5 variants), Edge (5 variants), Noise |
| AI-generated content detection | Surfaces a "AI Generated" badge when C2PA content credentials are present |
| Cropping / redetection | Automatic PDF image cropping, plus a manual crop/exclude-area tool with re-analysis |
| Cross-document analysis | Compare up to 10 records at once, optionally against the repository |
| Organization ("My Collections") | Folders, notes, tags, links, custom columns, recycle bin |
| Repository (optional module) | Lab/unit-scoped pre-submission staging area: upload, title/DOI/author metadata, edit, download, delete, its own usage report |
| Usage reporting | Institution Admin: **Summary** (monthly totals by institution). Lab/Unit Admin: **Detail** — Sessions, By Monthly, By Account, By Group, By Lab/Unit, each exportable to CSV |
| Account management | Role = User or Lab/Unit Admin, validity period, per-account analysis-execution cap |

This is the full surface area HospitiumRIS is choosing what to expose from — Section 6 maps it against what's actually wired up today.

---

## 4. Live findings (reproduced in the running app)

### 4.1 Institution Usage Report is non-functional

Navigating to `/institution/image-integrity/usage`, the page loads with a sensible default date range (Oct 1 2025 – Sep 18 2026, i.e. "since last year to today"). Clicking **Search** in either the *Summary* or *Detail* tab:

- Shows a loading spinner that never resolves into data.
- Settles on a plain red MUI `Alert` reading only **"Unauthorized"** — no explanation, no retry guidance, no distinction from a permissions problem vs. a bug.
- The breadcrumb above reads **"Institution Portal / Image Integrity / Usage Report / Usage Report"** — the last segment is duplicated.

This matches the code review's suspicion in §5.1/§5.2: the usage route's role check (`INSTITUTION_ROLES = ['RESEARCH_ADMIN', 'INSTITUTION_ADMIN']`) may not match the actual `accountType` on the logged-in test account, or the auth/session isn't being forwarded correctly on this route specifically (the list page loads fine for the same logged-in user). Either way, **this feature cannot currently be demoed or used**, which matters given it's the entire point of the "Institution" usage-reporting surface described in the vendor guide.

### 4.2 Institution submissions list is missing parity features the Researcher list has

The Researcher `/researcher/image-integrity` page shows 5 KPI stat cards above the table (Total / Completed / In progress / Failed / With findings). The Institution `/institution/image-integrity` page — which is arguably the page where an admin most wants an at-a-glance count across *all* researchers — has **no equivalent stat cards at all**, just straight into the filter bar and table. The empty state also differs: Researcher distinguishes "no submissions yet" from "no results for your filters" (offering a "Clear filters" action in the latter case); Institution shows one generic message with no clear-filters affordance either way.

### 4.3 Generic "Unauthorized" is shown for records that simply don't exist

Navigating directly to a non-existent submission ID (`/researcher/image-integrity/nonexistent-test-id` or the equivalent institution URL) does **not** show a "not found" state — it shows the same unstyled **"Unauthorized"** message used by the broken Usage Report above. This is a systemic pattern (a single generic error surface reused everywhere) rather than a one-off bug, and it actively misleads users: a deleted or mistyped-ID record looks identical to a genuine permissions problem, which will generate confused support requests ("why can't I access my own submission?").

### 4.4 "New Integrity Check" modal works as designed, with one live gap

The upload modal (matching the screenshot supplied) renders correctly: file dropzone, title/DOI/description, dynamic author rows, and a "Compare to global repository" toggle. One thing surfaced live that isn't obvious from the code alone: the "Submitted by" panel read **"Your profile name is not set"** for the logged-in test researcher — since submissions are deliberately *not* free-text attributed (by design, per the code comment: "Contributor is derived from the logged-in researcher's profile... so submissions are always correctly attributed"), an incomplete profile silently produces blank/placeholder attribution on every submission from that account. Worth a required-profile-completeness check (or at least a visible nudge) before a researcher can submit.

---

## 5. Code review findings

### 5.1 UX / robustness issues in the source

- **Native browser dialogs break the design system.** Delete-confirmation uses `window.confirm(...)`, and both delete-failure and report-generation-failure use `alert(...)`. These are hardcoded English strings that bypass the `t()` translation calls used everywhere else in the same files, and they produce a jarring native popup instead of the app's own MUI `Dialog`/`Snackbar`.
- **Silent failure on delete.** If the delete request itself throws (e.g. a network error), the catch block only does `console.error('Delete failed:', error)` — the user sees nothing and may assume the delete succeeded.
- **Inconsistent modal accessibility.** The image-preview overlay is a proper MUI `Dialog` (focus trap, `role="dialog"`, Escape-to-close) on the Researcher list, but a hand-rolled `position: fixed` `<Box>` with none of those affordances on the Institution list — the same feature, two different implementations, one materially less accessible.
- **No server-side pagination.** Both list API routes (`GET /api/researcher/image-integrity`, `GET /api/institution/image-integrity`) fetch the entire result set with no `take`/`skip`; all pagination and most filtering happens client-side in the browser. Fine at current (zero-record) scale; will degrade as submission volume grows, especially for the institution-wide list.
- **Filtering is inconsistently split** between server and client: the Institution list route does server-side `status`/`search` filtering but the page *also* re-filters client-side for type/findings; the Researcher route does no server-side filtering at all. Not a bug today, but a sign the two flows evolved independently rather than from a shared design.
- Repeated magic literal `const PURPLE = '#8b6cbc'` copy-pasted across all 5 page files instead of a shared theme token — cosmetic, but worth cleaning up alongside the component consolidation in §5.4.

### 5.2 Security: likely missing institution-tenant scoping

This is the most significant code-review finding and should be verified as a priority. Across all four Institution-facing API routes reviewed:

- `GET /api/institution/image-integrity` — builds its Prisma `where` clause from `status`/`search` query params only; no filter tying results to the acting admin's own institution, despite the `User` model clearly carrying `primaryInstitution`/`secondaryInstitution`.
- `GET /api/institution/image-integrity/[id]` — fetches by raw `id` with no ownership/institution check.
- `POST /api/institution/image-integrity/compare` — accepts arbitrary `caseIds` from the request body with no check that they belong to the admin's institution.
- `GET /api/institution/image-integrity/usage` — usage analytics appear to be computed over all cases platform-wide, filtered later only by date range and an optional `org` parameter (not enforced to the caller's own institution).

If institution scoping isn't happening implicitly somewhere outside these files (e.g., inside `getAuthenticatedUser` or a middleware layer not reviewed), then any institution admin can currently view, compare, and pull usage numbers for every institution on the platform — a cross-tenant data isolation gap. **This needs to be confirmed against the actual auth/middleware code before triage, but nothing in the route bodies reviewed shows the scoping happening.**

### 5.3 Other robustness gaps

- The 10-record cross-comparison cap is enforced only in React component state (`toggleSelected`); the compare API route validates a minimum of 2 records but no maximum.
- File upload validation is extension-based only (client and server) — no content/magic-byte sniffing before a file is forwarded to ImaChek and persisted.
- A raw (truncated) ImaChek API error response is persisted to `errorMessage` and rendered verbatim to end users on a FAILED case — minor upstream-response disclosure.
- One genuinely good pattern worth keeping: the batch-upload route validates every file in a batch *before* creating any database rows, specifically to avoid partial/orphaned records if one file in a batch is invalid.

### 5.4 Researcher vs. Institution: near-duplicate code

The Researcher and Institution versions of both the list page and the detail page are close to line-for-line duplicates (identical `STATUS_CONFIG`, formatters, icon components, and — notably — the entire compare-selection mechanism, copy-pasted with only the API path and redirect path changed). Two shared components (`CompareCasesDialog`, `IntegrityResultSummary`) are reused, but everything else is forked. This is exactly how the KPI-card gap (§4.2) and the accessibility gap (§5.1) happened — one side got a fix or feature the other didn't. Recommend extracting shared hooks/components before the two diverge further.

---

## 6. Feature coverage: ImaChek's capabilities vs. what's live in HospitiumRIS

| ImaChek capability | In HospitiumRIS today | Notes |
|---|---|---|
| Upload png/tiff/jpg/jpeg/zip/pdf ≤25MB | ✅ Yes | Validated client + server |
| Batch upload up to 25 files | ⚠️ Capped at 20 | Deviation from vendor doc, undocumented in UI |
| DOI/Crossref author autofill | ✅ Yes | |
| Compare against global repository | ✅ Yes (on/off toggle) | ImaChek's "None/Global" choice simplified to a boolean — reasonable |
| Duplication similarity High/Medium/Low | ✅ Yes (aggregate) | |
| Features/Color/Fingerprint sub-metrics | ❌ No | Only aggregate counts shown; no breakdown |
| Manual analysis tool (adjust/edit/intersection) | ❌ No | Deep analysis fully delegated to ImaChek's own hosted report link |
| Manipulation filter breakdown (Beautification/Splicing/Contrast/Edge/Noise) | ❌ No | Only an aggregate `manipulationCount` |
| AI-generated / C2PA badge | ❌ No | Not surfaced anywhere in the reviewed pages |
| Image cropping / manual redetection | ❌ No | `croppedAmount` shown as a static number only |
| Cross-document comparison (≤10 records) | ✅ Yes | Cap matches vendor guide; needs server-side enforcement (§5.3) |
| "My Collections" (folders/tags/notes/links) | ❌ No | Flat, ungrouped submission list |
| Usage reporting (session/monthly/account/group/lab) | ⚠️ Built, but broken | See §4.1 — the UI and API exist and match the vendor's report types, but Search currently fails |
| Lab/Unit + Group management, optional Repository module | ❌ Not represented | HospitiumRIS uses a 2-role model (Researcher/Institution); ImaChek's 3-tier org structure and pre-submission Repository aren't mirrored |
| Account-level analysis caps / validity periods | ❌ Not visible in this module | (May exist elsewhere in HospitiumRIS's user administration — out of scope for this review) |

**Reading this table plainly:** the integration currently covers "submit and see a headline result," and treats everything past that as ImaChek's job (via the external report link). That's a legitimate product choice — it minimizes maintenance burden and leans on ImaChek's own, more mature UI for the deep-dive work — but it should be a *chosen* strategy, not a default. Section 7 lays out the decision.

---

## 7. Strategic question worth deciding deliberately

There are really two different products hiding inside "Image Integrity": (a) a lightweight *submission and triage* workflow (upload, see a status, see a headline number, hand off), and (b) a full *investigation* workflow (manual comparison tools, per-metric evidence, annotation, cropping) that ImaChek's own UI already does well.

Right now HospitiumRIS builds (a) and links out to ImaChek for (b). That's defensible, but two things argue for revisiting it:

1. The vendor's report link appears to expire (~5 minutes, per its UI copy) — worth confirming that a regenerate/refresh path exists in HospitiumRIS so a researcher isn't stuck re-requesting a report mid-review.
2. If HospitiumRIS's differentiator is being a single pane of glass for the whole research-integrity workflow (ethics, publications, image integrity, etc. all live under `researcher/` and `institution/` already), sending users out to a separate ImaChek-branded UI for the actual investigative work undercuts that. Worth deciding, product-side, whether investing in Section 6's "❌" rows over time is worth it, versus explicitly embracing "HospitiumRIS is the front door, ImaChek is the lab" as the permanent design.

Either answer is fine — the report exists to make the choice visible rather than left implicit by what happened to get built first.

---

## Appendix: what was reviewed

**Vendor documentation:** `ImaChek v2 – GETTING STARTED GUIDE (INST_ADMIN)`, `(LAB_ADMIN)`, `(USER)` — read in full, all pages.

**Source files (read in full via code review):**
`src/app/researcher/image-integrity/page.js`, `.../[id]/page.js`, `src/app/institution/image-integrity/page.js`, `.../[id]/page.js`, `.../usage/page.js`, `src/app/api/researcher/image-integrity/route.js`, `src/app/api/institution/image-integrity/route.js`, `.../[id]/route.js`, `.../compare/route.js`, `.../usage/route.js`.

**Not reviewed (would refine several findings above if read):** `lib/imachek.js` (the actual ImaChek HTTP client/auth), `lib/image-integrity-sync.js`, `lib/image-integrity-compare.js`, `lib/image-integrity-files.js`, `lib/image-integrity-usage.js`, `lib/auth-server.js`, the Prisma schema, and the Researcher-side `[id]/route.js`, `[id]/report/route.js`, `[id]/resubmit/route.js`, `[id]/file/route.js`, `lookup-doi/route.js` sub-routes.

**Live testing:** `/researcher/image-integrity` (empty state, New Integrity Check modal), `/institution/image-integrity` (empty state), `/institution/image-integrity/usage` (Summary tab, Search action), `/researcher/image-integrity/[nonexistent-id]`, `/institution/image-integrity/[nonexistent-id]`. No real submissions existed in this environment, so the populated detail-page state, actual analysis results, and the file-upload round-trip to ImaChek itself were **not** exercised live — those are code-review-only findings above and should be re-verified with a real test upload.

---

*One process note, since this kind of review (read the vendor docs → read the code → cross-check live) is repeatable: it would make a good recurring skill if you expect to audit other integrated modules (Ethics, Clinical Trials, Publications) the same way — happy to turn this into one if that'd be useful.*
