# HospitiumRIS: Migrating the API Layer to a Python Backend

*Prepared 2026-07-28. Grounded in a direct audit of the current codebase (`src/app/api`, `prisma/schema.prisma`, `src/lib`, `src/services`) — not a generic migration template.*

## 1. Current State

HospitiumRIS is a single Next.js 16 / React 19 codebase. There is no separate backend today: **157 API route handlers** live under `src/app/api`, each a `route.js` file exporting `GET`/`POST`/etc., calling Prisma directly against Postgres. There's no framework-level middleware (no root `middleware.js`) — every route does its own auth check by calling `getAuthenticatedUser()` / `requireAuth()` from `src/lib/auth-server.js`.

Key facts that shape this migration, all verified in code:

- **Auth**: a single cookie, `hospitium_session`, holds the raw Postgres `User.id` — no JWT, no signing, no expiry. Every authenticated request does a live `prisma.user.findUnique` with `institution`/`foundation` joins. Passwords are hashed with `bcryptjs` (12 salt rounds).
- **Data layer**: Prisma ORM against Postgres, **64 models**, 2,461-line schema. IDs are `cuid()`. No raw `pg.Pool` usage outside Prisma — a few admin routes use `prisma.$queryRaw`/`$queryRawUnsafe` directly (database stats, table sizes, connection counts).
- **Stateful-in-process code**: `api/manuscripts/[manuscriptId]/presence/route.js` tracks "who's viewing this manuscript" in an in-memory JS `Map`. This has to be redesigned regardless of language the moment there's more than one backend process.
- **File uploads**: written to local disk and referenced by path from JSON fields on Postgres rows (`Proposal.ethicsDocuments`, etc.) — confirmed in `ethics/applications/[id]`, `proposals/[id]`, `training/[id]/materials`, `training/[id]/certificates/[regId]`.
- **External integrations, all outbound HTTP**: Google Gemini (`@google/genai`) and OpenAI SDKs for AI summaries; ORCID OAuth for researcher identity; CiteReady OAuth for reference-manager sync; Zotero, Crossref, OpenAlex, PubMed, OSF, Research4Life, ImaChek REST APIs; SMTP via `nodemailer`.
- **API docs**: the project already generates OpenAPI docs via `next-swagger-doc` + `swagger-ui-react` (`src/app/api-doc`), so there's presumably JSDoc-style OpenAPI annotations scattered across routes worth harvesting as a starting contract for the Python side.

## 2. Recommended Stack

| Layer | Choice | Why |
|---|---|---|
| Framework | **FastAPI** | Matches your stated Python-backend default, async-native (this app is I/O-bound: DB + 8+ outbound APIs), Pydantic models give you request/response validation Next.js route handlers currently do by hand, and FastAPI auto-generates OpenAPI — a direct, better-typed replacement for the existing `next-swagger-doc` setup. |
| ORM | **SQLAlchemy 2.0 (async) + Alembic** | Prisma Client Python exists but is the least mature of the three ORM options and ties you back to the Node-oriented Prisma CLI for migrations, which defeats the point of leaving Node. SQLAlchemy is the de facto standard, has first-class async support via `asyncpg`, and Alembic gives you a real migration story once Python owns schema changes. |
| DB | **Postgres, same database** | No data migration needed — point the new service at the same `DATABASE_URL`. Schema stays Postgres-native; only the ORM layer changes. |
| Validation | **Pydantic v2** | Drop-in replacement for the manual `if (!field) return 400` checks scattered through the current routes. |
| Auth | Signed session cookie (`itsdangerous`) or JWT, **same cookie name (`hospitium_session`)** during the transition | Preserves compatibility with the parts of Next.js that haven't been migrated yet (see Phase 1). This is also a good moment to fix the fact that the current cookie is an unsigned raw DB ID — flag this to the team as a security fix riding along with the migration, not a separate project. |
| Background jobs | **Celery or RQ + Redis** for AI calls, email sending, and CiteReady/ORCID sync | These are currently synchronous, blocking calls inside request handlers (e.g. `ai/summarize` calls Gemini in the request path). Worth fixing during the rewrite rather than porting the blocking behavior as-is. |
| Server | **Uvicorn behind Gunicorn** (or plain Uvicorn workers) | Standard FastAPI production setup, pairs with the containerization plan in the companion Docker report. |

**Why not Django / DRF**: Django's batteries (admin panel, ORM migrations, forms) duplicate things this app already has via Prisma Studio and its own hand-built admin UI (`global-admin`, `institution-admin`). Django REST Framework's serializer/viewset ceremony is heavier than 157 fairly small, route-per-file handlers need. FastAPI's file-per-route style is a closer structural match to what you're migrating from, which lowers translation risk.

**Why not Flask**: no built-in async, no built-in validation/serialization, no auto OpenAPI — you'd end up hand-rolling what FastAPI gives for free, and hand-rolling is exactly the failure mode you're trying to leave behind with the current route-by-route Next.js API.

**Should you keep Prisma as the schema source of truth during the transition?** Recommended: **yes, until Phase 5.** Let Prisma keep owning migrations while both the Next.js and Python services read/write the same tables via their own ORMs. Only cut Alembic over to being authoritative once the Next.js API routes are fully retired — running two migration tools against one schema concurrently is a common source of drift.

## 3. Route Inventory (157 routes, by domain)

| Domain | Routes | Notes |
|---|---|---|
| `institution` | 26 | Analytics, auto-review workflow engine (stages/reviewers/parameters), ethics, image-integrity, proposal-review-pipeline (kanban-style stage moves). Largest, most workflow-heavy domain. |
| `manuscripts` | 18 | Versioning, tracked changes, comments, collaborators, invitations, **presence (in-memory, needs redesign)**. |
| `foundation` | 17 | Campaigns, donations, grantors, grant-opportunities import, financial central-fund-pool. Financial data — treat with the same care as auth. |
| `researcher` | 12 | Profile, stats, analytics (impact/publications), deadlines, tasks, image-integrity. |
| `institution-admin` | 12 | User/account-type management, verified domains, **raw-SQL database admin/export/backup/maintenance**. |
| `global-admin` | 12 | Cross-tenant analytics, **raw-SQL DB stats/backup**, security, settings, an authenticated `health` endpoint (not usable as a container health check — see Docker report). |
| `training` | 11 | Modules, registrations, certificates, materials (file uploads). |
| `proposals` | 9 | Submission, review-stage/status, ethics linking, **file downloads by path**. |
| `auth` | 9 | Login, register, activate, ORCID callback/token, resend-activation, validate, `me`, logout. Highest-risk domain — see Section 4. |
| `publications` | 6 | Library, citations, import, preprints, AfricArXiv submission. |
| `notifications` | 5 | Preferences, stats, test, training-created trigger. |
| `citeready` | 5 | OAuth authorize/callback, folders, items, auth/login. External OAuth integration. |
| `ethics` | 4 | Applications CRUD, review, submit. |
| `grants` | 3 | Applications, communications. |
| `settings` | 2 | CiteReady, Zotero settings. |
| `orcid` | 2 | Search, test. |
| `network`, `logs`, `citations`, `ai` | 1 each | `ai/summarize` is the only AI route but calls out to Gemini synchronously — good first candidate for the background-job pattern. |

**Total: 157**, matching the count on disk (`find src/app/api -name route.js | wc -l`).

## 4. High-Risk Areas to Get Right

1. **Auth cookie compatibility.** If Next.js and FastAPI run side-by-side during the strangler migration (recommended — see Section 5), both must recognize the same `hospitium_session` cookie, on the same domain, with compatible `SameSite`/`Secure`/`HttpOnly` attributes. Decide this in Phase 0, not per-domain later.
2. **Password hash compatibility.** `bcryptjs` (Node) defaults to the `$2a$` prefix; Python's `bcrypt`/`passlib[bcrypt]` typically produce `$2b$`. Both prefixes are mutually verifiable by standard bcrypt implementations, but **confirm this explicitly with a test against real hashes from the `User` table** before cutting over login — don't assume.
3. **ID generation.** Prisma's `@default(cuid())` needs a Python-side equivalent (`cuid2` PyPI package) if any new rows are created from the Python service before the whole schema is migrated, so IDs stay collision-free and in the same format across both services.
4. **Manuscript presence.** Currently an in-memory `Map`. Don't port it as-is — this is the one piece of "current behavior" that's actually a bug waiting to happen under concurrency, in either language. Move it to Redis (or drop it in favor of a real WebSocket/SSE presence channel) as part of the `manuscripts` domain migration, not before.
5. **File path coupling.** Uploaded file paths live inside JSON fields on Postgres rows, not a dedicated `File` table. Both the old and new backend must agree on the same absolute/relative path convention while both are live, or downloads will 404 depending on which service touched the row last.
6. **OAuth redirect URIs.** ORCID (`api/auth/orcid/callback`) and CiteReady (`api/citeready/oauth/callback`) have redirect URIs registered with those providers pointing at the current Next.js routes. Moving these to Python means **updating the registered redirect URI with ORCID and CiteReady**, coordinated with the cutover — plan for a maintenance window or dual-routing (see Phase 5).
7. **Raw SQL admin/backup routes.** `global-admin/database/*` and `institution-admin/database/*` use `prisma.$queryRaw` for live DB introspection (table sizes, connection counts) and shell out for backups. These need direct `asyncpg`/`sqlalchemy.text()` equivalents and, for backups, a Python-side `subprocess` call to `pg_dump` — functionally portable, just not ORM-abstracted work.

## 5. Phased Migration Plan (Strangler Fig)

The approach: stand up FastAPI as a second service behind the same edge (Nginx or Next.js `rewrites()` in `next.config.mjs`), and move routes over domain-by-domain, low-risk first. Next.js keeps serving pages and any API routes not yet migrated. At every point in the migration the app is fully working — there's no big-bang cutover.

| Phase | Scope | Rationale |
|---|---|---|
| **0. Foundation** | FastAPI skeleton, SQLAlchemy models generated from the existing Postgres schema (`sqlacodegen` against the live DB as a starting point, then hand-refine relations/enums), shared `DATABASE_URL`, unauthenticated `/health` endpoint, CI pipeline, Next.js `rewrites()` config for path-based routing to the new service. | Nothing user-facing moves yet; de-risks the plumbing (DB connection, container networking, deploy pipeline) before any real route depends on it. |
| **1. Auth + one throwaway route** | Migrate `auth/login`, `auth/me`, `auth/logout`, `auth/register`, `auth/validate` (5 of the 9 auth routes), plus `network` (1 route) as a low-stakes canary. | Proves cookie compatibility and password-hash compatibility end-to-end before anything valuable depends on it. Keep `auth/orcid/*`, `auth/activate`, `auth/resend-activation` on Next.js until Phase 5 (OAuth redirect URI coordination). |
| **2. Read-heavy, low-risk domains** | `publications` (6), `notifications` (5), `logs` (1), `orcid/search` + `orcid/test` (2), `citations` (1) — 15 routes. | Mostly reads, no file uploads, no OAuth, no financial data. Good throughput for the team to build migration muscle memory. |
| **3. Researcher & training domains** | `researcher` (12), `training` (11) — 23 routes. | Introduces file uploads (training materials/certificates) as the first real complexity beyond CRUD. |
| **4. Workflow-heavy domains** | `proposals` (9), `ethics` (4), `grants` (3) — 16 routes. | Multi-step review workflows and file downloads; moderate complexity. |
| **5. Auth completion + external OAuth** | Remaining `auth/*` (4 routes: orcid callback/token, activate, resend-activation), `citeready` (5) — 9 routes. | Coordinate ORCID/CiteReady redirect URI changes with the provider dashboards; this phase needs a scheduled window, not just a code deploy. |
| **6. Manuscripts** | `manuscripts` (18). | Requires the presence-tracking redesign (Redis or WebSocket/SSE) as a prerequisite, plus versioning/tracked-changes logic — the most stateful, highest-complexity domain. Do it once the team has five prior phases of migration experience. |
| **7. Admin & financial domains** | `institution` (26), `institution-admin` (12), `global-admin` (12), `foundation` (17), `settings` (2) — 69 routes, ~44% of the whole API. | Largest single chunk, includes raw-SQL admin tooling and financial data. Save for last so the team is migrating this with maximum experience and the smallest possible blast radius (internal/admin users, not the general researcher base). |
| **8. AI + cutover** | `ai/summarize` (1) — move to the background-job pattern (Celery/RQ) rather than a straight port. Once Phase 7 lands, decommission remaining Next.js API routes, flip Alembic to authoritative, and remove Prisma from the Next.js dependency tree. | Last because it's low-risk technically but the cutover step (removing Prisma) is irreversible-ish and should happen after everything else is proven. |

Cumulative route count check: 5 (auth partial) + 1 (network) + 15 + 23 + 16 + 9 + 18 + 69 + 1 (ai) = 157. ✓

## 6. Rough Effort & Risk Sizing

*Order-of-magnitude only — treat as planning input, not a commitment. Assumes 1–2 backend engineers who don't yet know FastAPI, learning as they go.*

| Phase | Size (routes) | Complexity | Rough effort |
|---|---|---|---|
| 0. Foundation | — | Medium (new infra, no prior art) | 1–2 weeks |
| 1. Auth canary | 6 | High (correctness-critical, blocks everything else) | 1–2 weeks |
| 2. Read-heavy | 15 | Low | 1 week |
| 3. Researcher/training | 23 | Medium (file uploads) | 1.5–2 weeks |
| 4. Workflow domains | 16 | Medium | 1.5–2 weeks |
| 5. OAuth completion | 9 | High (external coordination, redirect URIs) | 1–1.5 weeks |
| 6. Manuscripts | 18 | High (presence redesign, versioning) | 2–3 weeks |
| 7. Admin & financial | 69 | Medium-High (volume, raw SQL, financial data) | 4–6 weeks |
| 8. AI + cutover | 1 + decommission | Medium | 1 week |
| **Total** | 157 | | **~14–20 weeks** |

This roughly matches the scale of effort the existing Docker containerization plan estimated for infra work alone (14–20 hours) — the API rewrite is the same order of magnitude bigger than that as you'd expect for rewriting the entire backend layer versus packaging it.

**Biggest risks to the estimate, not the routes**: (a) how much of the current Prisma schema's implicit business logic — cascading deletes, default values, enum constraints — is enforced in the DB versus in application code that has to be re-discovered route by route; (b) whether the team runs both stacks in parallel in production (safer, slower) or migrates in a staging-only shadow environment before each phase's cutover (faster, riskier); (c) ORCID/CiteReady provider-side coordination in Phase 5 is outside your control and can stall on their support turnaround.

## 7. Next Steps

1. Decide on the parallel-run strategy for Phase 0 (Next.js `rewrites()` vs. an Nginx path-based split) — this is a one-time architectural decision that shapes every later phase.
2. Spike Phase 1 (auth) in a branch to validate the bcrypt-hash and cookie-compatibility assumptions in Section 4 before committing to the full plan.
3. Treat the presence-tracking redesign (Section 4, item 4) and the cookie security upgrade (Section 2, Auth row) as scoped side-projects that ride along with Phases 6 and 1 respectively, not new scope creep.

---

*This report pairs with the revised Docker containerization plan (`docs/hospitiumris-docker-containerization-0aab55.md`), which now also documents the in-memory presence issue and the lack of a usable container health-check endpoint — both are relevant to sequencing this migration alongside containerization rather than as two unrelated projects.*
