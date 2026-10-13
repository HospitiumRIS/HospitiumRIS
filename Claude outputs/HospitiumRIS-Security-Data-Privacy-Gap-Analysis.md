# HospitiumRIS — Data Security & Privacy Gap Analysis

**Prepared for:** Stephen Gaita, HospitiumRIS
**Date:** September 18, 2026
**Scope:** Whole-system static review — authentication, session management, authorization/tenant isolation, file uploads, secrets management, sensitive-data handling (Ethics, Health, Grants, Publications, Manuscripts, Network), admin/privileged operations, logging, and deployment configuration.
**Method:** Static code and configuration review only (no live penetration testing this pass, per scope agreed with the client). Reviewed `src/lib`, `src/services`, `src/app/api/**` across auth, ethics, grants, network, institution, institution-admin, global-admin, training, and image-integrity modules, plus `prisma/schema.prisma`, `next.config.mjs`, `Dockerfile`, `.gitignore`/`.dockerignore`, and env templates. This builds on and extends the September 17, 2026 *Image Integrity (ImaChek)* report, which flagged a likely cross-tenant scoping gap in that module — this review confirms that gap is part of a wider, systemic pattern, not an isolated bug.

Every finding below cites the specific file(s) it comes from so it can be verified and fixed directly. Findings are graded **Critical / High / Medium** by combined impact and ease of exploitation, not by effort to fix — several Critical items are one-line fixes.

---

## 1. Executive summary

HospitiumRIS has the right *ingredients* for a secure system — bcrypt password hashing at a sensible cost factor, `httpOnly`/`SameSite` cookies, secrets kept out of git and out of the Docker image, and several endpoints (`institution-admin/users`, `institution/ethics/applications`, the Ethics file-download route) that implement authentication and tenant-scoping correctly. The problem is **consistency**: the same categories of risk that were correctly handled in some routes were skipped entirely in others, and one of those gaps — an unauthenticated full-database export — is as severe as a web application vulnerability gets.

Four findings in particular mean that, as currently deployed, **the confidentiality of every record in the system (including password hashes) cannot be assured**, independent of each other:

1. Any user's session can be forged by simply setting a cookie to their database ID — no signature, no secret, no expiry check.
2. Any account linked to ORCID can be logged into using nothing but that person's public ORCID iD (which is *designed* to be public and is printed on every paper they've published).
3. The entire Ethics module (human-subjects research applications — consent forms, participant data, risk assessments) and the Grants module have **no authentication at all** on list/read/write/delete.
4. A single unauthenticated `POST` to `/api/institution-admin/database/export` dumps the entire production database — every user record including `passwordHash`, every institution, every donor/donation record, and third-party API keys stored in user settings — to a file on the server.

On top of these, a mid-tier authenticated role (`RESEARCH_ADMIN`) can escalate itself to `GLOBAL_ADMIN` through `/api/institution/users` (PATCH), because that endpoint accepts an arbitrary `accountType` with no allow-list and no ownership check.

None of this requires a sophisticated attacker. Sections 3–5 give the evidence, impact, and fix for each item; Section 8 maps the set against OWASP ASVS/API Security Top 10, the Kenya Data Protection Act 2019, GDPR, and HIPAA-style controls (per your request to benchmark against all four); Section 9 gives a prioritized, "fix now / this quarter / roadmap" punch list in the same style as the Image Integrity report.

---

## 2. Methodology & scope

This was a **static code and configuration review**, not a live penetration test (per your selection) — findings marked "confirmed" are read directly from the code path that would execute; findings marked "likely" or "worth verifying" involve a code path I could trace but didn't execute end-to-end (e.g., because doing so would require running the app against a live database). I sampled representatively across every top-level API module (`auth`, `ethics`, `grants`, `network`, `training`, `institution`, `institution-admin`, `global-admin`, `researcher`, `settings`) rather than reading all ~150 route files line by line; Section 10 lists what wasn't opened and should be checked next given the pattern found here.

Because this pass touches data ranging from ordinary account PII to (potentially) human-subjects research data, I benchmarked findings against all four frameworks you selected: **OWASP ASVS / API Security Top 10** (as a vendor-neutral baseline), **the Kenya Data Protection Act, 2019** (since HospitiumRIS and its users are Kenya-based), **GDPR** (in case EU/UK researchers or collaborators use the platform), and **HIPAA-style controls** (applied only where the Ethics/Health modules could plausibly hold identifiable health information — see the caveat in Section 8.4).

---

## 3. Critical findings — exploitable today, fix first

### C1. Unauthenticated full-database export, including password hashes

**File:** `src/app/api/institution-admin/database/export/route.js`

This route has **no call to `getAuthenticatedUser` or any other auth check** — it is the only data-export endpoint in the codebase without one (contrast with `global-admin/database/backup/route.js`, which correctly requires `GLOBAL_ADMIN`). A single unauthenticated request:

```
POST /api/institution-admin/database/export
{ "format": "json", "scope": "all" }
```

triggers `exportAllData()`, which runs `prisma.user.findMany({ include: {...} })` **with no `select`**, meaning every scalar field on `User` comes back — including `passwordHash` (a bcrypt hash, but still a credential that should never leave the database), `emailVerifyToken`, ORCID identifiers, and institution/foundation links — plus every `Publication`, `Manuscript`, `Proposal`, `Campaign`, and `Donation` record (donor/financial data) in the system. The result is written to `exports/<timestamp>.<format>` on the server and the response confirms the file path.

**Impact:** Complete, unauthenticated compromise of the production database's confidentiality in one request, including credentials that could be cracked offline and third-party API tokens stored in `UserSettings` (see H4). This is the single highest-priority item in this report.

**Fix:** Add the same `getAuthenticatedUser()` + `accountType !== 'GLOBAL_ADMIN'` guard used in `global-admin/database/backup/route.js` (three lines, copy-paste). Separately, stop including `passwordHash`/`emailVerifyToken` in *any* export — use an explicit `select` that excludes them, even for admin-only tooling; exported files often get emailed, copied to laptops, or dropped into cloud storage where the "admin-only API" boundary no longer applies.

### C2. Privilege escalation: any Institution Admin can promote any account to Global Admin

**File:** `src/app/api/institution/users/route.js` (`PATCH`)

The handler correctly requires `RESEARCH_ADMIN` or `INSTITUTION_ADMIN`, but then does:

```js
const { userId, status, accountType } = body;
...
if (status) updateData.status = status;
if (accountType) updateData.accountType = accountType;
const updatedUser = await prisma.user.update({ where: { id: userId }, data: updateData, ... });
```

There is no allow-list on `accountType` (contrast with the correct `MANAGEABLE_ACCOUNT_TYPES = ['RESEARCHER', 'RESEARCH_ADMIN']` check in `institution-admin/users/[id]/route.js`) and no check that `userId` belongs to the caller's own institution, or even that it isn't the caller's own account. A `RESEARCH_ADMIN` — the lowest-privilege of the three admin tiers — can therefore:

- `PATCH` their own `userId` with `{ "accountType": "GLOBAL_ADMIN" }` and gain full platform administration, or
- Suspend, reactivate, or reclassify **any user at any other institution**, since the query has no institution filter at all.

**Impact:** Full vertical privilege escalation to the highest role in the system, from an ordinary institution-admin account. Combined with C1's database export (which would hand an attacker a valid `userId` and email to target), this is a two-step path from "created a free RESEARCH_ADMIN account" to "owns the platform."

**Fix:** Restrict `accountType` to the same manageable-type allow-list used elsewhere, scope the `where` clause to the caller's own institution (the codebase already has `getOwnedInstitution`/`institutionUserWhere` helpers in `lib/institution-admin.js` — reuse them here), and block self-modification of `accountType`/`status`, exactly as `institution-admin/users/[id]/route.js` already does correctly. This route appears to be an older/duplicate implementation of that same feature that never received the same hardening — worth deleting one of the two if they're both still reachable.

### C3. Session cookie is the user's raw, unsigned database ID

**Files:** `src/lib/session-cookie.js`, `src/lib/auth-server.js`, and every route that reads `cookieStore.get('hospitium_session')` directly (e.g. `src/app/api/network/route.js`)

```js
// session-cookie.js
export function setSessionCookie(response, userId, { rememberMe = false } = {}) {
  ...
  response.cookies.set(SESSION_COOKIE_NAME, userId, getSessionCookieOptions(maxAge));
}

// auth-server.js
const sessionCookie = cookieStore.get('hospitium_session');
const user = await prisma.user.findUnique({ where: { id: sessionCookie.value }, ... });
```

The session "token" *is* the primary key. There is no signature (HMAC/JWT), no server-side session table, and no random component. Anyone who learns another user's ID — which appears in URLs, API responses (`author_id`, `co_authors`, `userId` query params across half the routes reviewed), and now in the unauthenticated exports above — can become that user by setting one cookie:

```
document.cookie = "hospitium_session=<victim's user id>"
```

`httpOnly` prevents this specific line from running in the *victim's* browser via XSS, but it does nothing to stop an attacker setting this cookie in *their own* browser to impersonate someone else — `httpOnly` protects against cookie theft, not cookie forgery, and there is nothing here that requires the value to have ever been legitimately issued.

Interestingly, `NEXTAUTH_SECRET` is defined in the environment (`.env.docker.example`) but is never referenced by `session-cookie.js` or `auth-server.js` — it looks like scaffolding left over from an earlier or planned NextAuth.js integration that was never wired into the custom session logic that actually ships.

**Impact:** Full account takeover for any user whose ID is known or guessable, no password required. cuid IDs aren't sequential, but they are not intended to be secrets, and this report alone lists several ways they leak.

**Fix:** Replace the cookie value with a cryptographically random, unguessable session token (e.g. 32 bytes from `crypto.randomBytes`), stored server-side in a `Session` table (or table-backed cache) mapping token → `userId` + expiry, with revocation on logout/password change. If a stateless approach is preferred, sign a JWT with `NEXTAUTH_SECRET` (already provisioned) and verify the signature in `getAuthenticatedUser`. Either way, add absolute and idle session expiry — there currently is none beyond the cookie's own `maxAge`.

### C4. ORCID login accepts a client-asserted identity with no proof

**File:** `src/app/api/auth/login/route.js` (the `orcidLogin` branch)

```js
const { email, password, rememberMe, orcidLogin, orcidId, orcidData } = requestBody;
if (orcidLogin && orcidId && orcidData) {
  const user = await prisma.user.findFirst({ where: { orcidId: orcidId }, ... });
  ...
  setSessionCookie(response, user.id, { rememberMe: rememberMe || false });
```

This is a *separate* code path from the properly-implemented OAuth exchange in `api/auth/orcid/callback/route.js` (which does correctly swap an authorization `code` for a token server-to-server, using the client secret). The client-side flow instead calls `POST /api/auth/orcid/token` (which returns the real ORCID iD after a genuine exchange) and then calls `POST /api/auth/login` with `{ orcidLogin: true, orcidId, orcidData }` — but **`/api/auth/login` never re-validates that this request actually came from a completed ORCID exchange.** It trusts whatever `orcidId` the client sends.

Because ORCID iDs are *by design* public — printed on every paper, CV, and academic profile a researcher has — this means:

```
POST /api/auth/login
{ "orcidLogin": true, "orcidId": "0000-0002-XXXX-XXXX", "orcidData": { "name": "Any Name" } }
```

logs the attacker in as whichever HospitiumRIS user has that ORCID iD linked, for **any researcher whose ORCID iD you can find** — no password, no ORCID account, no token.

**Impact:** Account takeover for any user who has linked ORCID, which is likely most researchers given ORCID integration is a flagship feature, using only a publicly-known identifier.

**Fix:** `/api/auth/login`'s ORCID branch must not accept a bare `orcidId` from the client. Either (a) have the client send the ORCID `access_token` and have the server independently call ORCID's `/userinfo`-equivalent to confirm the token is valid and belongs to that `orcidId` before issuing a session, or (b) collapse this into the server-side `orcid/callback` flow only, and remove the client-trusting path entirely.

### C5. The entire Ethics module has no authentication (list, read, update, delete)

**Files:** `src/app/api/ethics/applications/route.js` (GET/POST), `src/app/api/ethics/applications/[id]/route.js` (GET/PUT/DELETE)

None of these five handlers call `getAuthenticatedUser` or any auth helper. `GET /api/ethics/applications` with no parameters returns **every ethics application in the system** — principal investigator, department, full lay summary and research objectives, participant population and sample size, vulnerable-population flags and justification, risk assessment and mitigation text, consent process description, data storage/security notes, and a `documents` array naming every uploaded consent form, participant information sheet, and investigator CV. `GET/PUT/DELETE /api/ethics/applications/[id]` extend this to reading, editing, or deleting any single application by ID with no ownership check at all.

By contrast, the *file-download* route for the same documents (`ethics/applications/[id]/file/route.js`) **does** check auth and ownership (`application.userId === user.id` or staff role) — so the actual PDF/image bytes are somewhat protected, but the metadata that describes exactly what human-subjects research is being conducted, by whom, on whom, is not protected at all, and is precisely the kind of data an IRB/ethics system exists to keep confidential.

**Impact:** Unauthenticated disclosure of the most sensitive data category in the system, plus unauthenticated tampering (edit/delete of draft applications, injection of fabricated applications with an arbitrary `userId`).

**Fix:** Add `getAuthenticatedUser` + ownership/role checks to all five handlers, mirroring the pattern already used correctly in `institution/ethics/applications/route.js` (institution-scoped) and the file-download route (owner-or-staff). This is the same three-line pattern used elsewhere in the codebase — it just wasn't applied here.

### C6. Grant applications endpoint has no authentication

**File:** `src/app/api/grants/applications/route.js` (GET/POST)

Same pattern as C5: no auth check. `GET` returns every grant application platform-wide including grantor contact name/email/phone, requested amounts, and linked proposal budgets; `POST` allows creating grant applications tied to an arbitrary `userId`/`proposalId`. Lower sensitivity than C5 (no human-subjects data), but the same fix is needed.

### C7. Cross-tenant data leakage across the "Institution" admin surface (confirms and extends the Image Integrity report)

**Files:** `src/app/api/institution/researchers/route.js`, `src/app/api/institution/users/route.js` (GET)

The September 17 Image Integrity report flagged that none of the institution-facing image-integrity routes filter by the acting admin's institution, and recommended verifying this against the broader codebase. That verification is done: the same gap exists on the two core "who's in my institution" endpoints:

- `institution/researchers/route.js` requires only *that a user is logged in* — no role check, no institution filter — and returns every researcher on the platform, with academic profile and publication/manuscript stats, to any authenticated account of any type.
- `institution/users/route.js` (GET) correctly requires `RESEARCH_ADMIN`/`INSTITUTION_ADMIN`, but its `where` clause is built only from `search`/`status`/`accountType` query parameters — there is no institution filter — so any institution admin can list every user at every institution, platform-wide (it does, to its credit, correctly strip `passwordHash`/`emailVerifyToken` before returning — a good pattern that C1's export route should copy).

I also looked at `institution/ethics/applications/route.js`, which *does* attempt institution scoping (`where: { user: { institutionId: user.institutionId } } }`) — but `institutionId` doesn't appear to exist as a field on the `User` model in `schema.prisma` (the actual field is `secondaryInstitutionId`), so this filter is more likely to error out or silently match nothing than to leak data; it's flagged here as a **probably-broken feature** rather than an active leak, but it's the same class of bug as the Usage Report issue in the Image Integrity report and should be fixed alongside it.

**Impact:** Any institution admin (a role institutions self-provision) can enumerate every researcher and every user across every competing institution on the platform.

**Fix:** Every "Institution" (`RESEARCH_ADMIN`) and "Institution Admin" (`INSTITUTION_ADMIN`) route that queries `User`, and doesn't already use the `getOwnedInstitution`/`institutionUserWhere` helpers from `lib/institution-admin.js`, needs to. Given how many places this pattern needed fixing (image-integrity × 4 routes, `institution/researchers`, `institution/users`, probably others not yet reviewed — see Section 10), this is worth a short, dedicated sprint: grep every `prisma.user.findMany`/`findFirst` call under `api/institution/**` and `api/institution-admin/**` and confirm each one scopes to the caller's institution.

---

## 4. High-severity findings

### H1. Registration silently skips email verification (regression)

**File:** `src/app/api/auth/register/route.js`

Every new account is created with `emailVerified: true` and `status: 'ACTIVE'` immediately (`emailVerifyToken: null`), and the response says "Your account is now active." But the codebase still has a complete, working token-based activation flow: `POST /api/auth/resend-activation` generates a random token with a 24-hour expiry and emails it, and `GET/POST /api/auth/activate` verifies it — this flow is simply never invoked at registration anymore. Given the file's recent modification date relative to the activation routes, this looks like a regression (a change that stopped calling the activation flow) rather than an intentional design.

**Impact:** Anyone can register using an email address they don't control — including, for `RESEARCH_ADMIN`/`FOUNDATION_ADMIN` accounts, an address at a domain your admins have already "verified" for institutional access (`findVerifiedDomainByEmail`), since domain-matching only checks the *string*, not that the registrant received and clicked a confirmation link. This is both an identity-spoofing risk (registering as `dean@partner-university.ac.ke` without access to that inbox) and removes a basic anti-abuse control (disposable/typo'd email registration).

**Fix:** Restore the call to the activation flow at registration — set `emailVerified: false`, generate a token via `generateActivationToken()`, send via `sendActivationEmail`, and gate login on `emailVerified` (the login route already checks this flag, so re-enabling it at registration is the whole fix).

### H2. No rate limiting or account lockout anywhere, plus a user-enumeration side channel at login

**File:** `src/app/api/auth/login/route.js`, and generally: no rate-limiting library or middleware anywhere in `package.json`/`next.config.mjs`

Login, registration, resend-activation, and every other unauthenticated endpoint have no throttling, CAPTCHA, or lockout after repeated failures — they're only as strong as the passwords chosen, against an unlimited-speed online guessing attack. Separately, the login route responds differently depending on *why* a login failed:

```js
if (!user) { ... return NextResponse.json({ message: 'Invalid email or password', field: 'email' }, { status: 401 }); }
...
if (!isPasswordValid) { ... return NextResponse.json({ message: 'Invalid email or password', field: 'password' }, { status: 401 }); }
```

The displayed `message` is identical, but the `field` value tells the caller whether the email exists at all — a classic user-enumeration oracle that a scripted attacker can use to build a target list before a credential-stuffing run.

**Fix:** Add rate limiting (per-IP and per-account) on all `auth/*` routes, e.g. a sliding-window counter in Redis/Postgres or a library like `@upstash/ratelimit`; add a lockout or exponential backoff after N failed attempts; and make the `field` value identical (or absent) regardless of which check failed.

### H3. No self-service password reset, no MFA anywhere

I did not find a `forgot-password`/`reset-password` route under `api/auth` or `api/settings`. The only way a user's password is ever changed appears to be an institution admin or global admin doing it for them (`institution-admin/users/[id]/route.js` PATCH accepts a new `password`). That's a legitimate admin capability, but as the *only* recovery path it means a locked-out user depends entirely on admin availability and trustworthiness, and it means a compromised or socially-engineered admin account can silently take over any account they manage by resetting its password. Combine this with the complete absence of MFA/2FA anywhere in the codebase (no TOTP, WebAuthn, or SMS/email one-time-code flow), and a single leaked password is sufficient for full account access, indefinitely, with no second factor to catch it.

**Fix:** Add a token-based self-service reset flow (the same `generateActivationToken`/email pattern already exists and can be reused), and evaluate TOTP-based MFA at minimum for `INSTITUTION_ADMIN`/`GLOBAL_ADMIN` accounts, which hold the most leverage.

### H4. Third-party credentials stored in plaintext, and swept up by C1

**Files:** `prisma/schema.prisma` (`UserSettings.settings Json`), `src/services/zoteroService.js`, `src/services/citereadyService.js`, `src/lib/citereadyAuth.js`

Zotero API keys and CiteReady OAuth tokens are stored as plain JSON in `UserSettings.settings` with no field-level encryption, and are included wholesale whenever a `User` is fetched with its `settings` relation (which C1's database export does, via `exportUsers()`'s `include: { settings: true }`). Separately, `zoteroService.js` passes the API key as a URL query parameter (`?key=${apiKey}`) rather than a header, which risks the key being written into server access logs, browser history, or any intermediary proxy log.

**Fix:** Encrypt third-party tokens at rest (e.g. application-level AES-GCM with a key from a secrets manager, not the database itself), and switch the Zotero client to send the key via header rather than query string.

### H5. File uploads validated by extension/declared MIME type only

**Files:** `src/lib/ethics-files.js`, `src/lib/image-integrity-files.js`

Both upload paths check the file's extension against an allow-list and trust `file.type` (a client-supplied string) for the stored MIME type — there is no magic-byte/content sniffing, and no malware/AV scanning before a file is written to disk and later served back (inline, for images) to other users, including staff reviewers. A file renamed to `.pdf` or `.png` with disallowed content, or a polyglot file, would pass validation. This matches a gap the Image Integrity report already flagged for that module specifically; it applies equally to Ethics attachments (consent forms, investigator CVs).

**Fix:** Validate actual file content (magic bytes) server-side regardless of extension/declared type, and consider routing uploads through an antivirus/content-scanning step before they're persisted, especially for the Ethics module where documents may originate from external collaborators.

---

## 5. Medium-severity findings

- **No security headers configured.** `next.config.mjs` has no `headers()` block — no `Content-Security-Policy`, `X-Frame-Options`/`frame-ancestors`, `X-Content-Type-Options`, `Referrer-Policy`, or `Strict-Transport-Security`. This doesn't cause a breach by itself but removes a layer of defense against XSS impact and clickjacking, and is a quick, low-risk fix.
- **Unbounded, plaintext activity log with personal data and no retention policy.** `src/utils/activityLogger.js` appends JSON lines (email, name, account type, IP, user agent, endpoint) to `logs/activity.log` forever, with no rotation, size cap, or automatic purge visible anywhere. It's correctly restricted to `GLOBAL_ADMIN` when read back via the API (`global-admin/logs`, `global-admin/security`), but the underlying file has no encryption at rest and no defined retention period — a data-minimization and storage-limitation gap under both GDPR and the Kenya DPA (see Section 8). It also trusts `X-Forwarded-For` for the logged IP with no check that the request came through a trusted proxy, which matters if this log is ever used as audit evidence.
- **Secrets live as flat files on the app server.** `.env`, `.env.backup`, and `.env.production` sit in the project root. They're correctly excluded from git (`.env*` in `.gitignore`) and from the Docker build context (`.dockerignore`), which is good practice — but there's no secrets-manager/vault, no rotation schedule evident, and `.env.backup` in particular looks like an old copy that should either be deleted or moved somewhere access-controlled once confirmed unneeded.
- **Ethics "anonymization" is a self-reported checkbox, not an enforced control.** The `dataAnonymization` field on `EthicsApplication` is just `Boolean(data.anonymizationMethod)` — whatever the submitting researcher ticks. HospitiumRIS itself performs no de-identification, pseudonymization, or redaction of anything in the Ethics workflow; it only records whether the researcher *says* their own study data will be anonymized. See Section 7 for what this means in practice.
- **Public, unauthenticated API documentation.** `src/app/api-doc` renders a live Swagger UI (via `next-swagger-doc`) generated from every `@swagger` JSDoc comment under `src/app/api`, with no auth check on the page itself. It's a minor issue on its own (OWASP API9 — improper inventory management) but it hands an attacker a map of the API surface, including endpoint shapes for the sensitive routes above.
- **Inconsistent sensitive-field stripping.** Some routes carefully exclude `passwordHash`/`emailVerifyToken` before returning user data (`institution/users` GET, `institution-admin/users` serializers); others (`global-admin/database/route.js`'s recent-activity query, and critically C1's export) do not. Worth a single shared `serializeUser()`/`select` used everywhere `User` rows leave the server, rather than each route re-implementing it.

---

## 6. What's already working well

It's worth being explicit about this, since a report like this reads as all-bad otherwise: HospitiumRIS is not built on unsound foundations, it's built inconsistently on sound ones.

- Passwords are hashed with **bcrypt at 12 rounds** (`lib/auth.js`) — a solid, current default.
- Session cookies are `httpOnly`, `SameSite=Lax`, and conditionally `Secure` based on the deployment URL — the *cookie handling* is reasonable; it's the *value inside the cookie* (C3) that's the problem.
- `institution-admin/users/*`, `institution/ethics/applications`, and the Ethics file-download route all implement the correct auth + tenant-scoping pattern — this is the template the rest of the codebase should be brought up to, not a pattern that needs to be invented.
- The ORCID **server-side** OAuth exchange (`auth/orcid/callback`, `auth/orcid/token`) correctly performs the code-for-token exchange with a client secret — the design is right, it's just bypassed by the separate client-trusting path in C4.
- Secrets are kept out of both git history and the Docker build context, and the production image runs as a non-root user (`Dockerfile`) — good baseline container hygiene.
- The batch ethics/image-integrity upload paths sanitize filenames before writing to disk (`sanitizeFileName`), which prevents path traversal even though content-type validation (H5) still needs work.

---

## 7. Data classification & anonymization gaps

You asked me to determine what sensitive data the system actually holds rather than assume — here's what I found, mapped to how well-protected it currently is:

| Data category | Where it lives | Currently protected by | Gap |
|---|---|---|---|
| Account PII (name, email, ORCID, institution) | `User` table, most API responses | Auth checks on *most* (not all — see C5–C7) routes; no field-level encryption | Exposed wholesale by C1; enumerable via login (H2) |
| Human-subjects research data (participant population, sample size, vulnerable-population details, risk assessments, consent process) | `EthicsApplication` table + `documents` (consent forms, info sheets, CVs) in `uploads/ethics/` | Nothing at the list/detail API level (C5); file bytes are owner/staff-gated | This is your highest-sensitivity data category and currently your least-protected one |
| Donor/financial data | `Campaign`/`Donation` tables | Not reviewed in depth this pass (out of the modules sampled); swept into C1's export | Needs its own access-control review |
| Third-party API credentials | `UserSettings.settings` JSON | Nothing (plaintext, no encryption) | H4 |
| Password hashes | `User.passwordHash` | bcrypt (good) + normally hidden from API responses | Exposed by C1's export, which doesn't `select` around it |
| Activity/audit trail (who did what, IP, email) | `logs/activity.log` (file) + `ActivityLog`/`RegistrationLog` tables | Read access is `GLOBAL_ADMIN`-only (good) | No retention limit, no encryption at rest, no redaction |

On anonymization specifically: HospitiumRIS doesn't anonymize anything itself today. The `dataAnonymization` flag on ethics applications is a researcher's self-declaration, not a platform control, and every other data category above is stored and returned in fully identifiable form. If de-identified research outputs, aggregate reporting, or anonymized dataset sharing is a goal, that would need to be built as a genuine transformation (e.g., k-anonymity/pseudonymization applied when data leaves the Ethics/Grants modules for reporting or export), not inferred from a checkbox.

---

## 8. Compliance mapping

### 8.1 OWASP ASVS / API Security Top 10 (2023)

| Finding | ASVS area | API Top 10 |
|---|---|---|
| C1 (unauth DB export) | V8 Data Protection | API3 Broken Object Property Level Authorization, API9 Improper Inventory Management |
| C2 (privilege escalation) | V4 Access Control | API5 Broken Function Level Authorization |
| C3 (raw-ID session) | V3 Session Management (V3.2.1: sessions must use an unpredictable, high-entropy value) | API2 Broken Authentication |
| C4 (ORCID trust) | V2 Authentication | API2 Broken Authentication |
| C5–C7 (unauth/cross-tenant data access) | V4 Access Control | API1 Broken Object Level Authorization |
| H2 (no rate limiting, enumeration) | V2.2 Anti-automation | API4 Unrestricted Resource Consumption |
| Medium: no security headers | V14 Configuration | API8 Security Misconfiguration |

### 8.2 Kenya Data Protection Act, 2019

The DPA requires "appropriate technical and organisational measures" against unauthorized or unlawful processing and against accidental loss, destruction, or damage (s.41) — C1 through C7 are direct instances of the risk this section exists to prevent. Ethics-application data revealing health status, and any data about vulnerable participants, likely qualifies as **sensitive personal data** under s.2, which the Act subjects to stricter processing conditions (s.44) than ordinary personal data — meaning C5 (unauthenticated Ethics access) is not just a generic data breach risk but a breach of a specially-protected category. The Act also gives data subjects rights to access, correct, and request deletion of their data (ss.26, 34–40); HospitiumRIS has no visible mechanism for a data subject (a manuscript collaborator, a research participant referenced in an ethics application, a donor) to exercise these rights today. Finally, s.43 requires breach notification to the Office of the Data Protection Commissioner within 72 hours and to affected individuals — worth having a documented incident-response runbook ready given the findings in this report, independent of whether any of them have already been exploited.

### 8.3 GDPR

If any EU/UK-based researcher, collaborator, or donor's data passes through the system, the same findings map to: Article 5(1)(f) (integrity and confidentiality) and Article 32 (security of processing — pseudonymization, confidentiality, and the ability to restore availability after an incident) are not currently met given C1–C7; Article 25 (data protection by design and default) is undermined by the inconsistency documented in Section 3–7 (the *default* posture on several routes is "no check" rather than "deny unless permitted"); Article 9 (special category data, which includes health data) applies to the Ethics module's participant information; and Articles 33/34 carry the same 72-hour breach-notification expectation as the Kenya DPA.

### 8.4 HIPAA-style controls (with a caveat)

HospitiumRIS is not a HIPAA-covered entity, and the Ethics module as reviewed stores research **protocol and application metadata** (study design, participant *counts* and *categories*, risk assessments) rather than obviously identifiable treatment records — so it isn't automatically "PHI" in the HIPAA sense. That said, if researchers ever attach real, identifiable patient/participant data as supporting documents (the upload fields make this possible and nothing in the code prevents it), HIPAA's Security Rule safeguards are a reasonable bar to hold that module to regardless of formal applicability: unique user identification and audit controls (undermined today by C3's shared/forgeable session identity), encryption of data at rest and in transit for anything identifiable, automatic session timeout (currently absent — see C3), and minimum-necessary access (undermined by C5–C7). **Recommended first step:** a short data-mapping exercise with whoever owns the Ethics module to confirm whether identifiable participant-level health data ever actually transits the system, since that answer determines how strictly this section should be enforced going forward.

---

## 9. Prioritized remediation roadmap

### Fix now (days, not sprints — these are all small code changes with outsized impact)

1. Add auth to `institution-admin/database/export` (C1) and strip `passwordHash`/`emailVerifyToken` from every export path.
2. Restrict `accountType` and add institution scoping in `institution/users` PATCH (C2).
3. Replace the session cookie value with a random, server-validated token or signed JWT (C3) — this is the single highest-leverage fix in the report, since C7's "any authenticated user" gaps are only as safe as the authentication itself.
4. Remove the client-trusting ORCID branch in `auth/login`, or require server-side token verification (C4).
5. Add auth + ownership checks to the Ethics (C5) and Grants (C6) application routes.
6. Add institution filtering to `institution/researchers` and `institution/users` GET, and fix or remove the broken `institutionId` filter in `institution/ethics/applications` (C7).

### Next (this quarter)

7. Re-enable email verification at registration (H1).
8. Add rate limiting/lockout to auth endpoints and remove the enumeration side-channel in the login response (H2).
9. Build a self-service password reset flow; evaluate MFA for admin roles (H3).
10. Encrypt third-party tokens in `UserSettings` at rest; move the Zotero key out of the URL (H4).
11. Add content-based (magic-byte) validation to both upload paths (H5).
12. Add a `headers()` block to `next.config.mjs` (CSP, X-Frame-Options, HSTS, X-Content-Type-Options).
13. Gate `/api-doc` behind authentication, or disable it in production builds.

### Later (roadmap)

14. Introduce a real anonymization/de-identification step for Ethics data leaving the module for reporting, rather than the current self-reported flag.
15. Define and implement a log-retention/rotation policy for `logs/activity.log`, and consider encrypting it at rest.
16. Stand up a documented data-subject-rights process (access/correction/deletion requests) and a breach-notification runbook, ahead of any Kenya DPA/GDPR obligation actually being triggered.
17. Extend the audit done here to the modules not yet sampled (Section 10) — the pattern found in Ethics/Grants/Institution strongly suggests more of the same exists elsewhere.

---

## 10. Scope & limitations — what wasn't reviewed

In the interest of the same honesty the Image Integrity report modeled: this was a representative sample, not an exhaustive line-by-line audit of all ~150 API route files. Given that every module I *did* sample beyond the already-known Image Integrity issue turned up the same missing-auth or missing-scoping pattern (Ethics, Grants, `institution/researchers`, `institution/users`), I'd treat that as a signal to audit the remaining modules with the same checklist rather than assume they're fine:

**Not opened this pass:** `publications/*`, `manuscripts/*`, `proposals/*`, `training/*` (beyond a directory listing), `foundation`/donation-specific routes, `auto-review/*`, `citations/*`, `orcid` profile-linking beyond login, the full `EthicsApplication`/`Foundation`/`Campaign` sections of `schema.prisma` (72KB total; only the `User`/`Institution` region was read in full), `database-service.js` (referenced by the properly-authenticated global-admin backup route — worth confirming what it actually backs up and where), and the frontend pages themselves (this was an API/data layer review, not a client-side XSS/CSRF review, though the absence of any CSRF token mechanism alongside `SameSite=Lax` cookies is worth a follow-up look for state-changing `GET`-adjacent flows).

**Not attempted:** live exploitation/penetration testing against a running instance (out of scope per your selection), a dependency/CVE audit of `package.json` (recommend running `npm audit` or Snyk as a quick companion check), and a review of database-level access controls (row-level security, connection-string privilege scoping) versus relying entirely on application-layer checks — given how many application-layer checks were found missing in this report, defense-in-depth at the database layer would meaningfully reduce the blast radius of the next missed check.

---

*Process note, in the same spirit as the Image Integrity report's closing suggestion: the checklist that found C1–C7 — "for every route touching `User`/institution-scoped data, confirm it calls `getAuthenticatedUser`, confirm its `where` clause is scoped to the caller's institution/ownership, confirm sensitive fields are excluded via `select`" — is mechanical enough to run as a recurring skill or even a lightweight static-analysis rule (e.g., a lint rule flagging any `prisma.*.findMany` under `src/app/api/institution*` with no accompanying auth import in the same file). Given how much of this report came from applying that one checklist repeatedly, it would likely keep paying off as new routes are added — happy to set that up if useful.*
