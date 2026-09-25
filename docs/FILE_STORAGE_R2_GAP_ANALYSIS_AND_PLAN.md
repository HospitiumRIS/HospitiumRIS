# HospitiumRIS — File Uploads: Gap Analysis & Cloudflare R2 Implementation Plan

**Prepared for:** Stephen Gaita, HospitiumRIS
**Date:** September 19, 2026
**Scope:** Whole-system static review of every path by which a file enters, is stored in, is read from, or is deleted from HospitiumRIS, and a plan to move all of it onto S3-compatible object storage (Cloudflare R2) in a way that respects tenant isolation.
**Method:** Source and config review of `src/app/api/**`, `src/lib/*-files.js`, `prisma/schema.prisma`, `docker-compose.yml`, `docker/nginx/*`, `Dockerfile`, `scripts/deploy.sh`, `.gitignore`, plus the existing project docs (Security & Privacy Gap Analysis, Review Process Design, Image Integrity report, `docs/SAAS_MULTI_TENANT_ARCHITECTURE.md`, `docs/PYTHON_BACKEND_MIGRATION.md`). R2 platform facts were checked against Cloudflare's current documentation (see Sources). No live testing and no access to the production volume this pass.

**Decisions taken for this plan (confirmed with you):** one bucket with a per-tenant key prefix; short-lived presigned URLs issued only after an authentication and tenant check; existing files migrated by script with a temporary dual-read fallback; deliverable is report and plan only (no code changes).

**A note on naming.** "AWS R2" is not a product: R2 is Cloudflare's object store, and "Cloudflare S3" is R2's S3-compatible API. AWS S3 is the separate Amazon service. Because R2 speaks the S3 API, this plan uses the standard AWS SDK pointed at an R2 endpoint, so moving to AWS S3 (or any other S3-compatible store) later is a configuration change, not a rewrite.

---

## 1. Executive summary

Today every upload in HospitiumRIS is written to a folder on the application server (`uploads/`, a single Docker volume) by ten different endpoints, six of which contain their own copy of the write logic. Files are then referenced from the database in four incompatible ways, and — most importantly for a tenant system — **nginx serves the entire `uploads/` volume to the internet with no authentication**, which makes the application-level access checks on ethics and image-integrity files optional for anyone who has a URL.

The migration to R2 is worth doing for reliability and scaling reasons alone (the volume is not backed up, blocks running more than one app container, and drifts from the database). But the more urgent reason is security: moving to R2 with private buckets and presigned URLs removes the public-directory exposure by design, and a central storage service gives you one place to enforce tenant isolation instead of ten.

Five findings matter most:

1. **Public exposure of every upload.** `docker/nginx/default.conf` maps `/uploads/` to the shared volume with `Cache-Control: public`. Ethics documents, image-integrity submissions, training certificates and proposal documents are all under that path (F1).
2. **Unauthenticated endpoints accept file uploads.** `POST /api/proposals`, `PUT /api/proposals/[id]` and `PUT /api/ethics/applications/[id]` have no authentication, and the proposal file-download route has none either (F2).
3. **Likely path traversal on the proposal upload routes.** The client's file name is concatenated straight into the write path in six places, on an unauthenticated endpoint (F3). This needs a same-week fix regardless of the R2 project.
4. **There is no tenant in any storage path or file record** except institution logos. Tenancy today is inferred through joins (user → institution), so it cannot be enforced at the storage layer and is missing entirely for proposals (F4).
5. **Signed URLs are only as trustworthy as the login.** The session cookie is the raw user ID (`src/lib/auth-server.js`), which the Sept 18 security report already flagged as forgeable. Presigned URLs do not fix that; authentication hardening is a prerequisite for calling the R2 design "tenant-safe" (F5).

The plan (Section 7) is five phases and roughly 16–22 developer-days: a one-week stop-gap phase that closes the worst exposure immediately, then foundation, module-by-module cutover, migration, and decommissioning of the local volume. One item needs a decision from you before anything is created in Cloudflare: **R2 has no Africa region or jurisdiction**, and Kenya's data-protection regime treats offshore cloud storage as a cross-border transfer (Section 6).

---

## 2. How uploads work today

### 2.1 Write paths (10 endpoints)

| # | Feature | Endpoint (file) | Written to | Reference stored in DB | Authentication | Tenant scoping | Server-side validation |
|---|---|---|---|---|---|---|---|
| 1 | Proposal documents (create) | `POST /api/proposals` (`proposals/route.js`, lines 105–180) | `uploads/proposals/{ethics\|dmp\|other}_{ts}_{clientName}` | `Proposal.ethicsDocuments / dataManagementPlan / otherRelatedFiles` (JSON) incl. **absolute server `filePath`** | **None** (`dev-user-id` placeholder, line 105) | **None** — `Proposal` has no owner or institution | None |
| 2 | Proposal documents (update) | `PUT /api/proposals/[id]` (`[id]/route.js`, lines 135–230) | same folder, same naming | same JSON fields | **None** | None | None |
| 3 | Deliverable documents | `POST/PUT /api/proposals/[id]/deliverables` | `uploads/proposals/deliverables/deliverable_{ts}_{safe}` | JSON inside `Proposal.deliverables[]`, root-relative `url` | Session required | No ownership or tenant check found | None (name sanitised) |
| 4 | Milestone documents | `POST/PUT /api/proposals/[id]/milestones` | `uploads/proposals/milestones/milestone_{ts}_{safe}` | JSON inside `Proposal.milestones[]`, `url` | Session required | No ownership or tenant check found | None (name sanitised) |
| 5 | Training materials | `POST /api/training/[id]/materials` | `uploads/training/materials/{ts}_{safe}` | `TrainingMaterial.fileUrl` (`/uploads/...`) | Session + owns the training's institution | Yes (`training.institutionId`) | None (no size or type check) |
| 6 | Training certificates | `POST /api/training/[id]/certificates/[regId]` | `uploads/training/certificates/cert_{userId}_{ts}_{safe}` | `TrainingCertificate.certificateUrl` | `RESEARCH_ADMIN` only | Yes | None |
| 7 | Ethics documents | `PUT /api/ethics/applications/[id]` (via `lib/ethics-files.js`) | `uploads/ethics/{applicationId}/{ts}_{safe}` | `EthicsApplication.documents` (JSON) | **None** | None | None server-side (client `FileUploadZone` caps at 10 MB) |
| 8 | Ethics certificate | `POST /api/ethics/applications/certificate` | same folder | same JSON | `RESEARCHER` | Owner | Extension allowlist + 15 MB |
| 9 | Institution logo | `POST /api/institution-admin/profile/logo` (`lib/institution-logo.js`) | `uploads/institutions/{institutionId}/logo.{ext}` | `Institution.logo` (`/uploads/institutions/...`) | Institution admin | Yes (own institution) | Client-declared MIME + 2 MB |
| 10 | Image-integrity submissions | `POST /api/researcher/image-integrity` (`lib/image-integrity-files.js`) | `uploads/image-integrity/{caseId}/{safe}` **and** forwarded to ImaChek | Derived by convention from `record.id` + `fileName` | `RESEARCHER` | Owner (institution admins reach it through a submitter join) | Extension allowlist, 25 MB, max 25 files |

Three of these go through a small helper module (ethics, image-integrity, logo). Six (rows 1–6) contain their own inline `mkdir` + `writeFile` code. Every route reads the whole upload into memory with `await file.arrayBuffer()`.

### 2.2 Read paths

| Path | What serves it | Access control |
|---|---|---|
| `GET /api/ethics/applications/[id]/file` | App reads disk | Session; owner, **or any staff account type from any institution** (`canAccess`, lines 6–12) |
| `GET /api/researcher/image-integrity/[id]/file` | App reads disk | Session; owner only |
| `GET /api/institution/image-integrity/[id]/file` | App reads disk | Institution admin; scoped to their institution via submitter join |
| `GET /api/proposals/[id]/files/[fileName]` | App reads disk using the stored absolute `filePath` | **None** |
| `GET /api/institution-admin/profile/logo` | App reads disk | Institution admin, own logo |
| **`/uploads/**` (nginx)** | nginx `alias /var/www/uploads/` on the shared volume | **None** — public, `Cache-Control: public`, 30-day expiry |

The UI links directly to the nginx path for proposal documents (`/uploads/proposals/...`), deliverable and milestone documents, training materials, training certificates and institution logos. In `next dev` there is no nginx, so those links only work in Docker deployments.

### 2.3 Delete paths

File deletion exists only for ethics applications (whole directory), image-integrity cases, and the institution logo. Deleting a proposal, removing a deliverable or milestone document, deleting a training material, or replacing a training certificate **never removes the file** (the only `unlink`/`rm` calls in `src/` are in the three helper modules).

### 2.4 Other places files touch local disk

- `institution-admin/database/backup` writes JSON backups to `backups/` (it does authenticate); `institution-admin/database/export` writes full exports to `exports/` and **has no authentication call at all** (it reads the request body and starts exporting).
- Activity logs are appended to `logs/activity.log` (`utils/activityLogger.js` and three admin routes read it).
- `submit-africarxiv` receives a manuscript and forwards it to OSF/AfricArXiv without storing it — no change needed beyond noting it is a pass-through.
- `GrantCommunication.attachments` and `InternalGrantRequest.attachments` are `Json[]` columns with **no upload endpoint behind them** — clients can store arbitrary metadata today, and these need a real storage backend when they are wired up. The manuscript editor's "insert image" action is a `TODO` and will need the same.

### 2.5 Infrastructure

- `docker-compose.yml` defines one `uploads_data` volume mounted read/write into the app and read-only into nginx. There is a `redis` service under a `scaled` profile, i.e. horizontal scaling is anticipated; a local volume prevents it.
- `scripts/deploy.sh` backs up the database only. **Nothing backs up `uploads_data`.**
- nginx allows 50 MB request bodies; the image-integrity limits permit 25 files × 25 MB in one request, and the app buffers all of it in memory.
- The working copy currently holds 100 files / 42 MB across `ethics`, `handbook`, `image-integrity`, `institutions`, `proposals`, `training`. I have not seen the production volume, so real volume, file count and orphan rate are unknown (the migration inventory in Phase 3 answers this).

### 2.6 What is already in good shape

- Ethics and image-integrity access is already confined to small helper modules, which makes them the cheapest to move (swap the internals, keep the call sites).
- The image-integrity batch route validates every file before creating any rows, which avoids partial or orphaned records. Keep that pattern.
- Training routes correctly check that the acting admin owns the training's institution.
- Logos already live under a per-institution path, and ethics/image-integrity files under per-record folders.
- Filenames are sanitised in the helper modules and in deliverables/milestones/training routes (the exception is Finding F3).

---

## 3. Findings

Severity is by combined impact and ease of exploitation.

### Critical

**F1 — nginx publishes the whole uploads volume without authentication.**
`docker/nginx/default.conf` (`location /uploads/ { alias /var/www/uploads/; ... Cache-Control: public }`) and the `uploads_data:/var/www/uploads:ro` mount in `docker-compose.yml`. This covers every subdirectory, including `ethics/{applicationId}/` (consent forms, participant information sheets), `image-integrity/{caseId}/` and `training/certificates/`. The app-level checks on the ethics and image-integrity download routes are therefore bypassable by anyone who obtains a path; the IDs are cuids and the names are timestamped, which slows guessing but they appear in URLs, logs, browser history and shared links. Training materials with `accessLevel = REGISTERED_ONLY` and training certificates (whose file names embed the user ID) are equally public at the byte level.

**F2 — Unauthenticated endpoints accept files and expose them.**
`POST /api/proposals` (placeholder session, line 105), `PUT/PATCH/DELETE /api/proposals/[id]`, `GET /api/proposals/[id]/files/[fileName]`, and `PUT/GET/DELETE /api/ethics/applications/[id]` contain no authentication call. Anyone can upload files into a proposal or ethics application, download proposal documents by ID and file name, or delete an ethics draft. (This is consistent with, and a file-specific view of, the Ethics/Grants findings in the Sept 18 security report.)

**F3 — Likely path traversal in proposal uploads.**
`proposals/route.js` lines 135, 153, 171 and `proposals/[id]/route.js` lines 189, 207, 225 build `` `ethics_${Date.now()}_${file.name}` `` and pass it to `path.join(uploadsDir, fileName)` with no sanitisation. `path.join` normalises `..` segments lexically, so a crafted multipart file name can resolve outside `uploads/proposals`, and the process user (`nextjs`) owns `uploads`, `logs`, `public` and `.next` in the container image. Combined with F2 (no authentication) this is potentially an arbitrary-file-write on the app server. **Confirm with a proof of concept in a test environment** (whether the runtime's multipart parser preserves slashes in file names), but treat it as real until proven otherwise. The fix is one line per site and does not depend on the R2 project.

### High

**F4 — Tenant is absent from storage paths and from three of the core file-bearing records.**
Only logos carry an institution ID in their path. `Proposal`, `EthicsApplication` and `ImageIntegrityCase` have no `institutionId`; tenancy is derived at request time from the acting user (`secondaryInstitutionId`, or the owned `Institution`). Consequences: proposals cannot be tenant-scoped at all (this is PR-5 in the Review Process design); a researcher who changes institution changes which admins can see their historical files; and tenant-level operations (export, offboarding, usage/quotas) cannot be done at the storage layer because nothing in the path identifies the tenant. Additionally, `ethics/applications/[id]/file` lets **any** `RESEARCH_ADMIN`, `INSTITUTION_ADMIN` or `GLOBAL_ADMIN` from any institution read any application's documents. *Reconciliation note:* the Sept 18 security report lists this route as a correct tenant-scoping example; on my reading of the current file there is no institution comparison, so that statement should be re-checked.

**F5 — Signed URLs do not compensate for a forgeable session.**
`getAuthenticatedUser` (`src/lib/auth-server.js`, lines 13–31) accepts the `hospitium_session` cookie value as the user ID. Any presigned-URL scheme issues links to whoever the app believes is logged in, so until sessions are signed or server-side, tenant isolation for files is only as strong as that cookie. This is finding C3 in the security report and must land before (or with) the R2 cutover of sensitive modules.

**F6 — No server-side type validation on six of ten upload endpoints, and public same-origin serving.**
Rows 1–7 in the table have no type or size limit beyond the 50 MB nginx cap. nginx picks `Content-Type` from the file extension and serves from the application's own origin, so an uploaded `.html` or `.svg` is a stored-XSS vector against logged-in users. Where validation exists (ethics certificate, image-integrity) it is extension-only, with no magic-byte check (also noted in the Image Integrity report §5.3), and the logo check trusts the browser-declared MIME type.

**F7 — Local disk is a single point of failure with no backup.**
One Docker volume, no upload backup in `deploy.sh`, DB rows that hard-reference paths. A lost or re-created volume produces silent 404s on every historical document, and the `scaled` compose profile cannot work with local storage.

**F8 — Documents and DB backups are committed to git.**
`git ls-files uploads` returns 41 PDFs (37 in `uploads/proposals`, 3 in `uploads/training`, 1 in `uploads/handbook`) despite the `.gitignore` entries, and three `backups/backup-*.json` files are tracked; each contains user records with `passwordHash` fields. `.gitignore` also omits `/uploads/training/certificates/`, `/uploads/institutions/`, `/backups/` and `/exports/`. Anything in git history should be assumed exposed to everyone with repository access.

**F9 — Access levels exist in the data model but not at the file layer.**
`TrainingMaterial.accessLevel` (`PUBLIC` / `REGISTERED_ONLY`) is enforced when listing materials (`materials/route.js`, lines 84–86) but not when fetching the bytes, because the URL is a public nginx path. It is also unclear what `PUBLIC` means (anyone on the internet, any logged-in user, or any user of that tenant) — this needs a product decision when moving to signed URLs.

### Medium

**F10 — Four incompatible reference formats.** (a) absolute server path inside JSON (`Proposal.*Documents[].filePath`, which is also returned to the client), (b) root-relative `url` inside JSON (deliverables, milestones), (c) root-relative string columns (`TrainingMaterial.fileUrl`, `TrainingCertificate.certificateUrl`, `Institution.logo`), (d) derived by convention from record ID + file name (ethics, image-integrity). There is no `File` table, no stored MIME, hash, size (except JSON copies) or checksum. `docs/PYTHON_BACKEND_MIGRATION.md` (risk #5) already identifies this coupling as a hazard for the planned FastAPI migration.

**F11 — Orphans and no erasure/retention.** Proposal delete, deliverable/milestone document removal, training material delete and certificate replacement leave files behind. There is no way to honour a data-subject erasure request or a tenant offboarding at the file level.

**F12 — Memory and limit mismatch.** Every route buffers the full file (`arrayBuffer()`); image-integrity allows 25 × 25 MB = 625 MB in one request while nginx rejects bodies over 50 MB, so large batches fail at the proxy in production, and would exhaust memory if the proxy limit were raised.

**F13 — Duplicated implementations.** Six inline copies plus three helpers. Each new upload type will copy one of them, and each copy has to be secured separately (F3 is exactly this failure).

**F14 — Backups, exports and logs are local files** (Section 2.4). The export/backup routes are the highest-value files on the system and should not sit on the app volume.

**F15 — Architecture doc and reality diverge on tenancy.** `docs/SAAS_MULTI_TENANT_ARCHITECTURE.md` describes database-per-tenant with subdomain routing and says nothing about file storage. The running code is a single shared database with `Institution` as the tenant and no tenant middleware (no reference to `x-tenant-id` or a per-tenant Prisma client exists in `src/`). The storage design below is written so it works under either model (Section 4.2), but you should decide which model is the real target because it changes bucket strategy.

**F16 — Data residency and compliance.** See Section 6.

**F17 — Minor:** `Content-Disposition` is built from the raw original name in the proposal download route (line 70); `uploads/handbook/hospitiumris-brandbook.pdf` duplicates `public/handbook/`.

---

## 4. Target design

### 4.1 Principles

1. **Nothing is served from the app's filesystem or by nginx.** Private files are reachable only through the app, which authorises and then hands out a short-lived presigned R2 URL. Public assets (logos, brand book) live in a separate public bucket behind a custom domain.
2. **The database, not the path, is the source of truth for access.** The tenant is encoded in the key for organisation, export and offboarding, but every access decision is made from the `StoredFile` row and the caller's identity. Clients never send or receive storage keys, only file IDs.
3. **One storage service.** All routes call `src/lib/storage/*`; no route imports `fs`. An ESLint `no-restricted-imports` rule for `fs`/`fs/promises` under `src/app/api` keeps it that way.
4. **Bytes go to R2 directly** wherever the browser can do it, so the Next.js server no longer buffers files.
5. **Portable.** S3 API via the AWS SDK; key schema and `StoredFile` table are language-neutral so the same service can be ported to FastAPI (`PYTHON_BACKEND_MIGRATION.md`) — doing this before the Python phases removes risk #5 there.

### 4.2 Tenancy model

**One bucket per environment and visibility, tenant prefix in every key.**

| Bucket | Purpose | Access |
|---|---|---|
| `hospitium-{env}-private` | Every non-public file | No public access, no custom domain; reached only by server credentials and presigned URLs |
| `hospitium-{env}-public` | Logos, brand book, other deliberately public assets | Custom domain (e.g. `assets.<your-domain>`) with Cloudflare caching |
| `hospitium-{env}-backups` | DB backups/exports, and the periodic copy of the private bucket | Separate credentials; short lifecycle rules |

**Key schema (private bucket):**

```
t/{tenantId}/{module}/{entityId}/{fileId}.{ext}

t/cmtk9wype0000wsdwr780m25p/ethics/cmp6kd3nz000twsawe3rxeqg2/cm9x2k1a70003.pdf
t/_none/u/{userId}/...        # users with no institution yet (personal namespace)
t/_platform/...               # platform/global-admin files
```

- `tenantId` is the `Institution.id`, resolved by a single function `resolveTenant(user)`: verified `secondaryInstitutionId` first, then the owned institution, else the personal namespace. Because it is one seam, the same code works if you later move to database-per-tenant (the seam returns the tenant-config ID instead).
- The **client's file name is never part of the key.** It is stored as `originalName` on the row and used only in `Content-Disposition`. `fileId` is a fresh ID, extension comes from the module's allowlist.
- `tenantId` is written to the row at upload and never changes when a user later changes institution. Authorisation uses current membership plus the row; the key is organisational, not a security boundary.
- **R2 cannot enforce the prefix.** Standard R2 API tokens are scoped to buckets (Object Read & Write / Read Only), not to key prefixes, so isolation between tenants in a shared bucket is enforced by the application. Cloudflare documents "temporary credentials" derived from a token, but the pages I reviewed do not state whether they can be prefix-scoped — verify before relying on that. For a customer that contractually needs hard isolation, add a nullable `Institution.storageBucket`; the driver picks that bucket for the tenant and everything else is unchanged (hybrid model, no redesign).

**Public assets:** `public/t/{tenantId}/logo/{contentHash}.{ext}`. Content-hashed names allow long immutable caching and remove the stale-logo problem the current fixed `logo.png` name has.

### 4.3 Data model

One new table replaces the four reference formats. Existing JSON arrays and URL columns gain a `fileId` and, after cutover, drop path/URL fields.

```prisma
model StoredFile {
  id           String    @id @default(cuid())
  tenantId     String?               // Institution.id; null => personal namespace
  ownerUserId  String                // uploader
  module       StoredFileModule      // enum, see 4.5
  entityType   String                // e.g. 'EthicsApplication'
  entityId     String
  bucket       String
  storageKey   String    @unique
  visibility   FileVisibility        // PRIVATE | PUBLIC
  originalName String
  mimeType     String                // server-sniffed, not client-declared
  sizeBytes    BigInt
  sha256       String?
  status       FileStatus @default(PENDING)  // PENDING | AVAILABLE | QUARANTINED | DELETED
  legacyPath   String?               // populated by the migration; drives dual-read
  createdAt    DateTime  @default(now())
  availableAt  DateTime?
  deletedAt    DateTime?
  purgeAfter   DateTime?

  @@index([tenantId, module])
  @@index([entityType, entityId])
  @@index([status, createdAt])
}
```

A tenant's usage is `SUM(sizeBytes) WHERE tenantId = ? AND status = 'AVAILABLE'`, which gives metering and quotas without listing the bucket.

### 4.4 Flows

**Upload (default, direct to R2):**

1. Browser → `POST /api/files/uploads` with `{ module, entityId, fileName, size, contentType }`.
2. Server authenticates, checks the caller may attach a file to that entity (same policy function the entity's routes use), checks the module policy (type, size, tenant quota), creates a `StoredFile` in `PENDING`, and returns a presigned **PUT** URL (5–10 minute expiry) for the generated key.
3. Browser PUTs the file straight to R2 (R2 presigned URLs support PUT, GET, HEAD and DELETE, and work only on the S3 API endpoint, not custom domains; **presigned POST/form uploads are not supported**).
4. Browser → `POST /api/files/uploads/{id}/complete`. Server does a HEAD (size must match), reads the first few KB with a ranged GET to sniff the real type (magic bytes), records `sha256` if supplied, moves the row to `AVAILABLE` (or `QUARANTINED`), and attaches it to the entity.
5. Anything still `PENDING` after 24 h is deleted by the sweeper.

Because size cannot be capped with a POST policy, the **completion check is the authoritative size and type control**; sign `Content-Type` (and `Content-Length` where the SDK supports it) on the PUT as defence in depth. Bucket CORS must allow `PUT`/`GET`/`HEAD` from the app origins and expose `ETag`.

**Server-proxied upload (kept for small or server-consumed files):** logos (2 MB) and any case where the server needs the bytes. Same `StoredFile` row and same validation, but the server calls `PutObject` after checks.

**Image integrity → ImaChek:** upload directly to R2; the completion step (or a small background job) streams the object from R2 to ImaChek, so the request no longer holds up to 625 MB in memory. Deleting a case must delete the R2 object and the remote ImaChek case together.

**Download:**

1. `GET /api/files/{id}` — authenticate, load the row, evaluate `canRead(user, file)`, write an audit event.
2. Return `302` to a presigned GET (60–300 seconds) with `response-content-disposition` and `response-content-type` set from server-side values, `Cache-Control: private, no-store` on the redirect. Return **404, not 403**, for files the caller cannot see, so IDs cannot be enumerated across tenants.
3. Because R2 objects are served from Cloudflare's storage domain, not the app's origin, an uploaded HTML/SVG file can no longer execute in the app's origin; still force `attachment` for anything that is not PDF or a raster image.

Presigned URLs are bearer tokens: anyone holding one can use it until it expires. Keep the lifetimes short, never log the query string, and never email them.

**Delete:** soft-delete on the row (`deletedAt`, `purgeAfter = +30 days`), a sweeper hard-deletes object and row after the grace period; deleting a parent (proposal, ethics application, training) marks all its files. Tenant offboarding = `deleteObjects` under `t/{tenantId}/` after export.

### 4.5 Per-module policy (initial proposal — to confirm)

| Module | Visibility | Allowed types | Max | Who uploads | Who can read |
|---|---|---|---|---|---|
| `ETHICS_DOCUMENT` | private | pdf, doc, docx, png, jpg | 25 MB | Application owner while editable | Owner + admins of the same tenant (audited) |
| `ETHICS_CERTIFICATE` | private | pdf, png, jpg, webp | 15 MB (existing) | Researcher | Owner + same-tenant admins |
| `PROPOSAL_DOCUMENT` / `_DELIVERABLE` / `_MILESTONE` | private | pdf, doc, docx, txt, xls, xlsx, ppt, pptx, csv, jpg, png, zip | 25 MB | Proposal editors | Proposal members + same-tenant admins |
| `IMAGE_INTEGRITY` | private | png, jpg, tif, pdf, zip | 25 MB, 25 files | Researcher | Owner + admins of the submitter's tenant |
| `TRAINING_MATERIAL` | private | pdf, doc(x), ppt(x), png, jpg (video: separate decision) | 50 MB | Tenant admin who owns the training | Per `accessLevel` — **decide what `PUBLIC` means** (F9) |
| `TRAINING_CERTIFICATE` | private | pdf, png, jpg | 5 MB | Tenant research admin | The certificate's user + same-tenant admins |
| `INSTITUTION_LOGO` | **public** | png, jpg, webp (no SVG) | 2 MB | Institution admin | Anyone |
| Brand book / static | public bucket (or stay in `public/`) | pdf | — | Deploy | Anyone |

Type checks use the magic-byte sniff (`file-type` or equivalent), not the extension or the browser MIME. ZIP is accepted only for image-integrity and proposals; add archive-size and entry-count limits and run malware scanning (below) before a zip becomes readable by another user.

### 4.6 Security controls beyond the storage service

- **Malware scanning.** R2 has no built-in scanner. New files stay `PENDING` until a worker (ClamAV container is the usual choice) has scanned them; download is refused until `AVAILABLE`. At minimum do this for anything one user uploads and another user opens (proposals, training materials, ethics documents).
- **Encryption.** R2 encrypts objects at rest by default; TLS in transit. Ethics and health-adjacent files may warrant an additional application-layer key per tenant — keep that as an option, not a launch requirement.
- **Credentials.** One server-side token with Object Read & Write on the private and public buckets; a separate token for the backup bucket. Never expose them to the browser, keep them out of the `.env` committed anywhere, and rotate on staff change. Presigned URLs are the only credential browsers see.
- **No versioning or object lock.** The lifecycle documentation I reviewed lists expiration, transition to Infrequent Access and multipart cleanup, and does not mention versioning or object lock. Accidental or malicious deletion is therefore not recoverable inside R2: use soft-delete in the app and a scheduled copy of the private bucket to the backup bucket (or a second provider) with `rclone`.
- **Lifecycle rules** (prefix-based, up to 1,000 per bucket): abort incomplete multipart uploads after 1 day; expire `tmp/` staging objects; expire backups after N days. Rules take up to ~24 h to run.
- **Audit log.** Record file create, download (who, which tenant, which file), delete and permission-denied events; the existing activity logger can carry them.
- **CSP and CORS.** Add the R2 S3 endpoint and the assets domain to `connect-src` / `img-src` once a CSP exists (none is set in `next.config.mjs` today).
- **Rate limits.** nginx `api` zone already limits `/api/`; add per-user limits on `uploads` initiation and a per-tenant daily quota.

### 4.7 Code layout (JavaScript, matching the current stack)

```
src/lib/storage/
  index.js            // getStorage(): driver factory by STORAGE_DRIVER=r2|local
  drivers/r2.js       // S3Client({ region:'auto', endpoint: https://<ACCOUNT_ID>.r2.cloudflarestorage.com })
  drivers/local.js    // dev and CI; also used for legacy dual-read
  keys.js             // buildKey(), resolveTenant()
  policy.js           // module policies (table 4.5); framework-agnostic so it ports 1:1 to Python
  sniff.js            // magic-byte detection
  files-service.js    // initiateUpload, completeUpload, getDownloadUrl, deleteFile, deleteByEntity, usage
src/app/api/files/uploads/route.js
src/app/api/files/uploads/[id]/complete/route.js
src/app/api/files/[id]/route.js         // authorise + 302 to presigned GET
scripts/storage-sweeper.js              // PENDING, purgeAfter, orphan reconciliation
scripts/storage-migrate.js              // Phase 3
```

Driver interface: `put`, `get` (stream), `head`, `delete`, `deletePrefix`, `presignPut`, `presignGet`, `copy`. Dependencies: `@aws-sdk/client-s3`, `@aws-sdk/s3-request-presigner`, `file-type`.

Configuration:

```
STORAGE_DRIVER=r2
R2_ACCOUNT_ID=
R2_ACCESS_KEY_ID=
R2_SECRET_ACCESS_KEY=
R2_ENDPOINT=                       # https://<ACCOUNT_ID>.r2.cloudflarestorage.com (EU jurisdiction uses a different host: confirm in dashboard)
R2_BUCKET_PRIVATE=hospitium-prod-private
R2_BUCKET_PUBLIC=hospitium-prod-public
R2_BUCKET_BACKUPS=hospitium-prod-backups
ASSETS_BASE_URL=https://assets.example.org
STORAGE_PRESIGN_GET_TTL=120
STORAGE_PRESIGN_PUT_TTL=600
STORAGE_LEGACY_FALLBACK=true       # Phase 3 only; remove after cutover
```

### 4.8 Cost (Cloudflare list pricing at time of writing)

Standard storage $0.015/GB-month, Class A (writes) $4.50/million, Class B (reads) $0.36/million, **egress free**; free tier 10 GB-month, 1M Class A, 10M Class B per month.

| Stored data | Approx. monthly storage cost |
|---|---|
| 10 GB | $0 (inside free tier) |
| 100 GB | ~$1.35 |
| 1 TB | ~$14.85 |
| 5 TB | ~$74.85 |

Request costs are negligible at this application's scale (an upload is roughly one PUT plus a HEAD/range GET; a download is one GET). Compared with the current setup, the real change is that you stop paying for and managing server disk, and free egress makes presigned downloads and image previews cost nothing to serve.

---

## 5. Gap-to-remedy map

| Finding | Closed by |
|---|---|
| F1 public `/uploads/` | Phase 0 nginx deny for `ethics` and `image-integrity` now; Phase 4 removes the alias and mount entirely |
| F2 unauthenticated endpoints | Phase 0 (add auth + ownership to proposal and ethics routes); Phase 2 (the storage service enforces `canWrite`/`canRead` per file) |
| F3 path traversal | Phase 0 sanitisation; disappears in Phase 2 because client names no longer reach a path |
| F4 tenant missing | `tenantId` on `StoredFile` + key prefix + `resolveTenant()`; Proposal ownership fields from the Review Process plan (P1-1) |
| F5 forgeable session | Prerequisite work outside this project (security report C3); block sensitive-module cutover on it |
| F6 validation / XSS | Module policy + magic-byte sniff + attachment disposition + separate origin |
| F7 SPOF / no backup | R2 durability + backup bucket job |
| F8 files in git | Phase 0 hygiene (history rewrite, credential reset) |
| F9 access levels | Per-file `canRead` and presigned URLs |
| F10 formats | `StoredFile` + `fileId` references |
| F11 orphans | Soft-delete, sweeper, delete-by-entity |
| F12 memory / limits | Direct-to-R2 uploads; streaming to ImaChek |
| F13 duplication | Single storage service + lint rule |
| F14 backups/exports/logs | Backup bucket; logs to stdout/central logging (out of scope here beyond noting it) |
| F15 tenancy model | Decision item; `resolveTenant()` seam |
| F16 residency | Section 6 |

---

## 6. Data residency and compliance (needs your decision)

- R2 offers **location hints** (WNAM, ENAM, WEUR, EEUR, APAC, OC — best-effort, set only at bucket creation) and **jurisdictions** (EU, US, FedRAMP for Enterprise — enforced, cannot be changed later). **Africa is not offered as either.** Nothing stored in R2 will be located in Kenya.
- Kenya's Data Protection Act 2019 restricts transfers of personal data outside Kenya to four bases (adequacy, appropriate safeguards, necessity, consent) and, for **sensitive personal data**, requires explicit consent and confirmation of safeguards. The Data Protection (General) Regulations 2021 include a "requirement for specified processing to be done in Kenya" (Regulation 26), which secondary sources describe as covering certain public-interest processing including health; I could not retrieve the regulation text itself, so confirm scope with counsel. The ODPC issued cross-border transfer guidance dated September 8, 2026, which per the commentary I read treats offshore cloud processing as a cross-border transfer and introduces standard clauses and transfer impact assessments.
- Ethics applications (consent forms, participant information, risk assessments) and image-integrity submissions are the highest-sensitivity content.

**What to decide before creating buckets:** (1) which jurisdiction to pin the private bucket to (EU is the closest enforceable option R2 gives; it is a residency commitment, not a Kenyan one); (2) whether any tenant has a contractual or regulatory requirement for in-country storage, in which case use the `storageBucket` override to point that tenant at an S3-compatible store hosted where they need it (the driver interface makes this a configuration matter); (3) whether a transfer impact assessment and a data-processing agreement with Cloudflare are needed and who owns them. I am not a lawyer; treat this section as a checklist for counsel, not advice.

---

## 7. Implementation plan

Effort figures are rough single-developer estimates and exclude the security-remediation work in other reports.

### Phase 0 — Stop the bleeding (about 2 days, do this week)

Independent of R2; each item is small and reversible.

1. **nginx:** add, above the generic `/uploads/` block, `location ~ ^/uploads/(ethics|image-integrity)/ { return 404; }`. Current code never links to those paths: ethics documents are stored with an API URL (`ethicsFileUrl()` → `/api/ethics/applications/{id}/file?name=...`, and the UI opens the stored `doc.url`), and image-integrity previews use `/api/researcher/image-integrity/{id}/file`. **Pre-check first:** an older design note (`docs/ETHICS_DOCUMENTS_FIX.md`) shows a `/uploads/ethics/...` URL format, so run a one-off query for `EthicsApplication.documents` entries whose `url` starts with `/uploads/ethics/` and rewrite any to the API URL before enabling the block; also confirm the deployed nginx config matches the repo. Do **not** block `/uploads/proposals|training|institutions` yet — the UI opens those nginx paths directly (institution proposal review opens `doc.url`, and the training pages open `material.fileUrl` / `certificate.certificateUrl`); that is Phase 4.
2. **F3 fix:** sanitise `file.name` (reuse `sanitizeFileName`) at the six proposal write sites, and stop storing/returning the absolute `filePath`.
3. **F2 minimum:** require an authenticated user (and ownership/tenant check where a field exists) on `POST /api/proposals`, `PUT /api/proposals/[id]`, `GET /api/proposals/[id]/files/[fileName]`, and `PUT/DELETE /api/ethics/applications/[id]`. Coordinate with the Review Process plan so this is done once.
4. **Ethics file route:** add an institution comparison to `canAccess` for non-global staff.
5. **Server-side size and type limits** on training materials, training certificates and ethics documents (they currently have none).
6. **Git hygiene:** `git rm --cached` the tracked `uploads/` PDFs and `backups/*.json`, extend `.gitignore` (`/uploads/`, `/backups/`, `/exports/`), then purge history (`git filter-repo`) after confirming nobody needs the files, and reset credentials for the users in those backups.
7. **Snapshot the production uploads volume** to a tarball stored somewhere other than the server (this is your rollback for the whole project).
8. **Decisions:** jurisdiction (Section 6), what `PUBLIC` training access means, bucket naming, who owns the Cloudflare account and billing.

### Phase 1 — Foundation (about 4–5 days)

1. Cloudflare: create the three buckets per environment, private bucket with **no** public access or custom domain, public bucket with a custom domain; set CORS on the private bucket; create scoped API tokens; add lifecycle rules (abort incomplete multipart after 1 day, backup-bucket expiry).
2. Add dependencies and the `src/lib/storage/` modules, the `local` driver (dev/CI, no R2 needed to run the app), and unit tests for `keys`, `policy`, `sniff`.
3. Prisma: `StoredFile`, enums; nullable `fileId` columns added beside the existing fields (no drops yet). `Institution.storageBucket` nullable.
4. `/api/files/*` endpoints with authorisation, audit events, per-user rate limit and tenant quota.
5. Frontend: extend `FileUploadZone` (it already has an unused `uploading` state and progress bar) or add a `useFileUpload` hook that performs initiate → direct PUT with progress → complete; replace the `alert()` size errors with the MUI Snackbar the rest of the app uses.
6. Cross-tenant test suite (see acceptance criteria) running against the local driver in CI.

### Phase 2 — Module cutover (about 6–8 days)

Ordered lowest-risk first. Each module ships behind `STORAGE_DRIVER` per module so it can be rolled back individually.

1. **Ethics, image-integrity, logo** — swap the three helper modules' internals for the storage service; keep call sites. Image-integrity moves to direct upload plus streaming to ImaChek. These are already the best-isolated modules, so this proves the pattern.
2. **Training materials and certificates** — replace the two inline writers; apply `accessLevel` at download time.
3. **Proposals, deliverables, milestones** — replace six inline writers. Requires an owner/tenant on `Proposal` (Review Process plan P1-1) so `canRead` has something to check; if that is not ready, gate this step on it rather than shipping tenant-less file access on the new system.
4. Remove `fs` imports from `src/app/api` and add the lint rule.

Gate for sensitive modules (ethics, image-integrity, certificates): F5 (session signing) resolved.

### Phase 3 — Migrate existing files (about 3–4 days plus a verification window)

Run from a one-off container with the `uploads_data` volume mounted, not over HTTP.

1. **Inventory (dry run).** Walk `uploads/` and every DB reference; output a manifest: file, size, sha256, referencing record, resolved tenant, and classification (`referenced`, `orphan`, `missing-on-disk`). This answers the volume, tenant-mix and orphan questions I could not answer from the repo.
2. **Tenant resolution for legacy rows:** ethics → `userId` → user's tenant; image-integrity → `submittedById`; training → `training.institutionId`; logos → institution ID; **proposals → `principalInvestigatorOrcid` → user → tenant, with unresolved rows placed in `t/_unassigned/` and listed for an admin to assign.**
3. **Copy and backfill (idempotent, resumable).** Deterministic key per legacy file; HEAD-check before upload; verify sha256 after; create `StoredFile` with `legacyPath`; add `fileId` to each JSON entry / column. Bounded concurrency; safe to re-run.
4. **Dual-read.** With `STORAGE_LEGACY_FALLBACK=true` the download service reads R2 first and falls back to local disk, logging every fallback hit. Writes already go only to R2.
5. **Verification.** Counts and hashes match the manifest; fallback hit count stays at zero for 14 days; spot-check downloads per module and per tenant.
6. **Rollback path:** the Phase 0 tarball plus the untouched volume (kept read-only for 30 days after cutover).

### Phase 4 — Decommission and harden (about 2–3 days)

1. Repoint UI links that use `/uploads/...` to `/api/files/{id}` (private) or the assets domain (logos); then **remove the nginx `/uploads/` location and the `uploads_data` mount from nginx and app**, and delete the legacy code paths and the fallback flag.
2. Sweeper cron (compose service or host cron running `scripts/storage-sweeper.js`): stale `PENDING`, `purgeAfter`, orphan reconciliation between `StoredFile` and the bucket.
3. Malware-scan worker; nightly copy of the private bucket to the backup bucket; moving DB backups/exports to the backup bucket (and fixing the export route's missing authorisation).
4. Tenant operations: per-tenant usage view for admins, export-by-prefix and delete-by-prefix tooling for offboarding.
5. Restore drill: rebuild a tenant's files from the backup bucket into a scratch environment.

### Timeline summary

| Phase | Effort | Depends on |
|---|---|---|
| 0 Stop the bleeding | ~2 days | Nothing |
| 1 Foundation | ~4–5 days | Phase 0 decisions |
| 2 Module cutover | ~6–8 days | Phase 1; Proposal owner/tenant (for proposals); session signing (for sensitive modules) |
| 3 Migration | ~3–4 days + 2 weeks observation | Phase 2 modules live |
| 4 Decommission | ~2–3 days | Phase 3 verified |
| **Total** | **~16–22 dev-days**, ~6–8 calendar weeks with the observation window | |

Sequencing note: doing this before the FastAPI migration's training/proposals phases (`PYTHON_BACKEND_MIGRATION.md`, phases 3–4) removes the file-path-coupling risk from that migration.

---

## 8. Acceptance criteria

**Tenant isolation (automated, run in CI against the local driver and in staging against R2):**
- Tenant A user requests a file ID belonging to Tenant B → 404 for every module and every role, including `RESEARCH_ADMIN` and `INSTITUTION_ADMIN`.
- Tenant A user cannot initiate an upload against a Tenant B entity ID.
- A presigned GET URL fails after expiry, and fails when its path or query is altered.
- A user who changes institution no longer gets tenant-admin access to their old tenant's files, and their old tenant's admins no longer see files they should not (per the module policy).
- No API response contains a storage key, bucket name or server path.

**Security:**
- HTML, SVG and executable content is rejected on document modules; a `.pdf` whose bytes are not a PDF is rejected.
- A file name containing `..`, `/`, `\` or control characters cannot influence the key.
- The private bucket has no public access and no custom domain; `curl` on a bare object URL returns 403.
- Sizes are enforced at completion even when the PUT sends more than declared.

**Platform:**
- The app runs with **no writable uploads directory** (read-only root filesystem, no volume) and every feature works — this is the proof that local storage is gone.
- Two app containers behind nginx serve and accept the same files.
- A restore from the backup bucket reproduces a tenant's files and their `StoredFile` rows.

**Migration:**
- Manifest count and sha256 match between disk and R2; zero legacy-fallback hits for 14 days; zero `referenced` files reported `missing-on-disk` without an owner-approved explanation.

---

## 9. Risks and open questions

| # | Risk / question | Mitigation or owner |
|---|---|---|
| 1 | Residency: no Africa location; Kenyan cross-border rules apply | Section 6 decisions; counsel review |
| 2 | Session cookie is forgeable, so any signed-URL scheme inherits that weakness | Land C3 first for sensitive modules |
| 3 | `Proposal` has no owner or tenant, blocking correct file authorisation | Add fields (Review Process P1-1) before Phase 2 step 3 |
| 4 | Target tenancy model unclear (shared DB today vs database-per-tenant in the architecture doc) | Decide; design already isolates the choice in `resolveTenant()` and `storageBucket` |
| 5 | No R2 versioning or object lock | Soft-delete in app, backup bucket copy, restore drill |
| 6 | Presigned URLs are bearer tokens | Short TTL, no logging of query strings, 404 on unauthorised requests |
| 7 | What does `TrainingMaterial.accessLevel = PUBLIC` mean? | Product decision (F9) |
| 8 | Unknown real production volume, orphan rate, and whether production nginx matches the repo | Phase 3 inventory; check the deployed config before Phase 0 step 1 |
| 9 | Prefix-scoped temporary credentials in R2 are unverified | Do not rely on them; use the app-enforced model or bucket-per-tenant for hard isolation |
| 10 | Vendor dependency | S3 API and driver interface; AWS S3 or another S3-compatible store is a config change |
| 11 | Is the F3 traversal reachable in the deployed runtime? | Proof of concept in a test environment; fix regardless |

**What I could not verify:** production data, deployed configuration, Cloudflare account state, whether the runtime's multipart parser preserves slashes in file names, R2 temporary-credential scoping, and the exact legal text of Kenya's Regulation 26.

---

## 10. Suggestions for repeatability

- **Make this a Skill.** "Add a new upload type to HospitiumRIS" is a repeatable procedure (declare a module policy, add the entity-level `canWrite`/`canRead`, wire `useFileUpload`, add the cross-tenant test). Once Phase 1 lands, capturing it as a Skill keeps future modules from re-creating the six inline copies; worth revisiting your Skills and preferences after this project to record the key schema and module-policy conventions.
- **Guardrails in CI:** an ESLint rule forbidding `fs`/`fs/promises` under `src/app/api`, and a cross-tenant test that iterates every registered module policy, so a new module cannot ship without tenant tests.
- **Reuse:** the same `StoredFile` and storage service can back the empty `attachments` columns on grant communications and internal grants, and the manuscript editor's unimplemented image insert.

---

## Sources

- [Cloudflare R2 limits](https://developers.cloudflare.com/r2/platform/limits/) — object and part sizes, bucket counts, key length, rate limits
- [Cloudflare R2 presigned URLs](https://developers.cloudflare.com/r2/api/s3/presigned-urls/) — GET/HEAD/PUT/DELETE supported, 1 second–7 days expiry, S3 endpoint only, no POST form uploads
- [Cloudflare R2 API tokens](https://developers.cloudflare.com/r2/api/tokens/) — bucket-level scoping; no documented key-prefix scoping
- [Cloudflare R2 temporary access credentials](https://developers.cloudflare.com/r2/api/s3/tokens/) — short-lived scoped credentials; scoping details not stated on the page reviewed
- [Cloudflare R2 data location](https://developers.cloudflare.com/r2/reference/data-location/) — location hints, EU/US/FedRAMP jurisdictions, no Africa option
- [Cloudflare R2 object lifecycles](https://developers.cloudflare.com/r2/buckets/object-lifecycles/) — expiration, Infrequent Access transition, multipart cleanup, 1,000-rule limit
- [Cloudflare R2 pricing](https://developers.cloudflare.com/r2/pricing/) — storage, operations, free tier, free egress
- [Inside Privacy — Kenya cross-border transfer guidance](https://www.insideprivacy.com/cross-border-transfers/kenya-issues-new-cross-border-data-transfer-guidance-familiar-concepts-but-important-local-differences/)
- [Data Protection (General) Regulations 2021 — Kenya Law](https://new.kenyalaw.org/akn/ke/act/ln/2021/263/eng@2022-12-31)
- Project documents: `claude/security-data-privacy-gap-analysis.md`, `claude/review-process-analysis-and-design.md`, `claude/image-integrity-analysis-report.md`, `docs/SAAS_MULTI_TENANT_ARCHITECTURE.md`, `docs/PYTHON_BACKEND_MIGRATION.md`
