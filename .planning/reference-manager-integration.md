# Zotero / Mendeley / EndNote Deep Integration Plan

Integrate Hospitium RIS with Zotero (full seamless suite), Mendeley (OAuth API + file import), and EndNote (improved file import + direct desktop export) to create a unified reference manager hub for researchers.

---

## Current State Audit

### What already exists
- **Zotero**: `ZoteroImport.jsx` + `zoteroService.js` — connects via manual User ID + API key, fetches collections/items from Zotero Web API, stores credentials in `UserSettings` (type `ZOTERO`). Works but requires manual key entry.
- **Mendeley**: `MendeleyImport.jsx` — file-upload only (BibTeX, RIS, CSV, JSON). No live API connection.
- **EndNote**: `EndNoteImport.jsx` — RIS file-upload only. No XML support, no desktop push.
- **Schema**: `UserSettings` supports `ZOTERO | PUBMED | OTHER`. Needs `MENDELEY` and `ENDNOTE` types added.
- **Publication model**: Has `source` field (tracks origin), DOI/ISBN deduplication, `LibraryFolder` system.

### Gaps to close

| Feature | Zotero | Mendeley | EndNote |
|---|---|---|---|
| OAuth auth | ❌ (manual key) | ❌ | N/A |
| Auto/live sync | ❌ | ❌ | ❌ |
| Browser connector | ❌ | ❌ | ❌ |
| Desktop plugin/push | ❌ | ❌ | ❌ |
| XML format | N/A | ❌ | ❌ |
| Export filter | ❌ | ❌ | ❌ |

---

## Phase 1 — Foundation & Schema (Pre-requisite)

### 1.1 Update `SettingsType` enum in `schema.prisma`
Add `MENDELEY` and `ENDNOTE` to the enum so their OAuth tokens can be stored in `UserSettings`.

```prisma
enum SettingsType {
  ZOTERO
  PUBMED
  MENDELEY
  ENDNOTE
  OTHER
}
```

### 1.2 Add sync-tracking fields to `Publication`
Add `externalId` and `lastSyncedAt` to track external reference manager IDs for incremental sync.

```prisma
model Publication {
  // ...existing fields...
  externalId    String?   // zotero key, mendeley ID, etc.
  lastSyncedAt  DateTime? // for incremental sync
}
```

### 1.3 Create `ReferenceManagerSync` model
Tracks per-user sync state per manager (last sync version, next page cursor, etc.).

```prisma
model ReferenceManagerSync {
  id           String   @id @default(cuid())
  userId       String
  manager      String   // 'zotero' | 'mendeley'
  lastVersion  Int?     // Zotero library version header
  lastSyncedAt DateTime @default(now())
  status       String   @default("idle") // idle | syncing | error
  error        String?
  user         User     @relation(...)
  @@unique([userId, manager])
}
```

**Deliverable**: One Prisma migration.

---

## Phase 2 — Zotero Full Integration

### 2.1 Zotero OAuth 1.0a Flow

Zotero uses OAuth 1.0a. The flow:
1. `GET /api/zotero/oauth/start` → requests a temporary token from `https://www.zotero.org/oauth/request`, redirects user to Zotero authorization page.
2. User authorizes → Zotero redirects to `GET /api/zotero/oauth/callback?oauth_token=...&oauth_verifier=...`
3. Callback exchanges verifier for access token + `userID`, stores both in `UserSettings` (type `ZOTERO`).

**Files to create:**
- `src/app/api/zotero/oauth/start/route.js`
- `src/app/api/zotero/oauth/callback/route.js`
- Update `src/utils/zoteroSettings.js` — add `isOAuthConnected()` helper
- Update `ZoteroImport.jsx` — add "Connect with Zotero" OAuth button as primary CTA; keep manual key entry as secondary fallback

**OAuth library**: Use `oauth` npm package (already well-known for OAuth 1.0a). No browser-side OAuth secret exposure — all token exchange server-side.

### 2.2 Zotero Auto-Sync (Version-based Polling)

Zotero does not support webhooks. Use **library version polling**:
- Every Zotero API response includes `Last-Modified-Version` header.
- Store this version in `ReferenceManagerSync.lastVersion`.
- On next sync, pass `?since={lastVersion}` — API returns only changed/new items.

**Files to create:**
- `src/app/api/zotero/sync/route.js` — `POST` triggers an incremental sync for the authenticated user, fetches items `?since=lastVersion`, upserts them into `publications`, updates `ReferenceManagerSync`.
- `src/app/api/zotero/sync/status/route.js` — `GET` returns sync status for the UI.
- Background sync option: A `src/app/api/cron/zotero-sync/route.js` endpoint callable by a cron job (Vercel cron or OS scheduler) that iterates all users with Zotero configured and runs incremental sync.

**UI additions to `ZoteroImport.jsx`:**
- "Sync Now" button that calls `/api/zotero/sync`
- Last synced timestamp + item count delta shown
- Auto-sync toggle in researcher Settings (calls sync on page load if enabled)

### 2.3 Zotero Browser Connector Support

The Zotero browser connector (Firefox/Chrome extension) normally saves items to `http://localhost:23119` (Zotero desktop). We can expose a **compatible translation server endpoint** in Hospitium so the browser connector can target Hospitium instead.

**How it works:**
- Zotero connector POSTs translated item data to a configurable endpoint.
- We expose `POST /api/zotero/connector/save` that accepts the connector's JSON payload, transforms it to our `Publication` format, and saves it.
- User configures their browser connector to point to Hospitium's URL instead of localhost. (Instructions + a one-click bookmarklet as alternative.)

**Files to create:**
- `src/app/api/zotero/connector/save/route.js` — accepts Zotero translator output, maps to `Publication`, creates it for the authenticated user.
- `src/app/api/zotero/connector/ping/route.js` — the connector pings this to detect if the "server" is alive (`{"prefs": {"automaticSnapshots": false}}`).
- Docs page or Settings UI section: "Browser Connector Setup" with step-by-step instructions and connector URL to copy.

### 2.4 Zotero Desktop Plugin (Translator)

Zotero desktop supports custom **translators** (JavaScript files) that define how Zotero imports/exports items. We'll create a **Hospitium Export Translator**.

**What it does:** Adds "Hospitium RIS" as an export format in Zotero desktop. When user selects items and exports using this translator, items are POSTed directly to `POST /api/zotero/push` with the user's API token.

**Files to create:**
- `public/zotero/HospitiumRIS.js` — the Zotero translator file (JavaScript, follows Zotero translator spec). Translates selected items to our format and POSTs to Hospitium.
- `src/app/api/zotero/push/route.js` — receives items from the desktop translator, authenticates via API token in Authorization header, saves publications.
- Settings UI: "Desktop Plugin" section with download link for `HospitiumRIS.js` and installation instructions (copy to Zotero translators folder).

---

## Phase 3 — Mendeley Integration

### 3.1 Mendeley OAuth 2.0 Flow

Mendeley API uses standard OAuth 2.0 Authorization Code flow.

**Endpoints:**
- Auth: `https://api.mendeley.com/oauth/authorize`
- Token: `https://api.mendeley.com/oauth/token`
- Library: `https://api.mendeley.com/documents`

**Files to create:**
- `src/app/api/mendeley/oauth/start/route.js` — redirects to Mendeley authorization.
- `src/app/api/mendeley/oauth/callback/route.js` — exchanges code for access+refresh tokens, stores in `UserSettings` (type `MENDELEY`).
- `src/services/mendeleyService.js` — `fetchDocuments(accessToken, groupId, limit, offset)`, `refreshToken(refreshToken)`, `transformMendeleyDocument(doc)`.
- `src/app/api/mendeley/sync/route.js` — incremental sync using Mendeley's `modified_since` parameter.

**UI update to `MendeleyImport.jsx`:**
- Add top section: "Connect Mendeley Account" OAuth button.
- When connected: show library view (folders/groups), collection selector, sync button.
- Keep file import as "Manual Import" tab fallback.

### 3.2 Improved Mendeley File Import

- Better field mapping for Mendeley-specific CSV export columns (`Document Title`, `Authors`, `Publication Outlet`, `Source`, `Web Address`).
- Add support for Mendeley's native JSON export format (more complete than generic JSON).
- Multi-abstract field handling (Mendeley sometimes splits abstracts).
- Improve author name parsing (Last, First → First Last normalization).

---

## Phase 4 — EndNote Integration

### 4.1 Improved File Import (RIS + XML)

**Current issues with RIS parser:**
- Multi-line field values not handled (e.g. abstracts spanning multiple `AB` lines).
- `ER  -` end-of-record marker not used to finalize entries.
- `T2` (secondary title/journal) not parsed.

**Fixes + additions:**
- Fix `ER  -` end-of-record handling in `EndNoteImport.jsx`.
- Add multi-line abstract accumulation.
- Add `T2`, `C1` (affiliation), `N1` (notes) field parsing.
- Add **EndNote XML** format parsing (`.xml` export from EndNote). EndNote XML uses a well-defined schema with `<records><record>` structure.
- Add `accept=".ris,.xml,.txt"` to the file input.

**Files to update:**
- `src/components/Publications/ImportTabs/EndNoteImport.jsx` — fix RIS parser, add XML parser.

### 4.2 EndNote Export Filter (Desktop Push)

EndNote desktop supports **Connection Files** (`.enz`) and **Import Filters** (`.enf`) for importing, but the most practical approach for pushing FROM EndNote TO Hospitium is via a **custom output style** + an API endpoint.

**Approach — Hospitium Connection File:**
- Create a `.enz` (EndNote Connection File) that defines a Z39.50/HTTP connection pointing to Hospitium.
- Alternatively (more practical): Create a **custom export style** that produces a structured JSON/RIS file + provide a `POST /api/endnote/push` endpoint that EndNote's "Export to Remote Database" feature can target.

**Most feasible approach — API push endpoint:**
- `src/app/api/endnote/push/route.js` — accepts `POST` with RIS or XML body, authenticated via API token in `Authorization: Bearer <token>` header, saves publications.
- Generate per-user API tokens stored in `UserSettings` (type `ENDNOTE`).
- `src/app/api/endnote/token/route.js` — generates/rotates user API tokens.
- Provide a downloadable **EndNote Export Filter** file (`public/endnote/HospitiumRIS.enf`) that outputs RIS format + sets the submission URL.
- Settings UI: "EndNote Desktop Setup" with token display, copy button, and filter download link.

---

## Phase 5 — Shared Infrastructure

### 5.1 Reference Manager Settings Page Upgrade
Upgrade `src/components/Settings/ResearcherSettings.jsx` to include:
- **Zotero section**: OAuth Connect button, current connection status, sync settings (auto-sync toggle, last synced), browser connector URL, desktop plugin download.
- **Mendeley section**: OAuth Connect button, connection status, sync settings.
- **EndNote section**: API token display/rotate, export filter download, desktop setup guide.

### 5.2 Publication Source Tracking
Update `src/app/api/publications/import/route.js` to:
- Store `externalId` and `lastSyncedAt` on import.
- Support upsert (update existing publication if `externalId` matches) rather than always rejecting duplicates.

### 5.3 Notifications
Fire `PUBLICATION_IMPORTED` notifications after each sync with count of new items synced.

### 5.4 Export Back to Reference Managers
Add export buttons in the publications list/library:
- **Export to Zotero** — POST selected publications to Zotero Web API (creates items in user's library).
- **Export as RIS** — download file importable by all three managers.
- **Export as BibTeX** — download file importable by all three managers.

---

## Phase 6 — Documentation & UX

- In-app setup guides for each reference manager (accordion in Settings).
- Browser connector setup wizard (step-by-step with screenshots).
- Desktop plugin installation instructions with OS-specific paths.
- API token management UI with revoke/regenerate.

---

## Implementation Order

| Phase | Effort | Priority |
|---|---|---|
| 1 — Schema | Low | 🔴 Must do first |
| 2.1 — Zotero OAuth | Medium | 🔴 High |
| 2.2 — Zotero auto-sync | Medium | 🔴 High |
| 3.1 — Mendeley OAuth | Medium | 🔴 High |
| 4.1 — EndNote RIS+XML fix | Low | 🟡 Medium |
| 2.3 — Browser connector | Medium | 🟡 Medium |
| 5.1 — Settings upgrade | Medium | 🟡 Medium |
| 5.4 — Export back | Low | 🟡 Medium |
| 3.2 — Mendeley file improvements | Low | 🟢 Low |
| 4.2 — EndNote desktop push | High | 🟢 Low |
| 2.4 — Zotero desktop plugin | High | 🟢 Low |
| 6 — Docs & UX polish | Low | 🟢 Low |

---

## Key Technical Constraints

- **Zotero OAuth 1.0a** requires HMAC-SHA1 signing — use `oauth` npm package server-side only. Never expose consumer secret client-side.
- **Mendeley OAuth 2.0** — use PKCE flow for security; store refresh tokens encrypted in `UserSettings.settings` JSON.
- **Zotero browser connector** — requires HTTPS in production; connector URL must be user-configurable in the extension settings.
- **EndNote desktop** — the `.enf` export filter approach works without any OAuth; security is via user-specific Bearer tokens.
- **Rate limits**: Zotero API = 100 req/5min; Mendeley API = varies by tier. Add retry logic with exponential backoff in service layers.
