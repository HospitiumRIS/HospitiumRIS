# ORCID Publications Auto-Import into Library

Add a fully functional ORCID import tab to the Publications Import page so researchers can browse and selectively import their ORCID works directly into the HospitiumRIS library, with publications marked as ORCID-sourced.

---

## Current State

| Area | Status |
|------|--------|
| `OrcidImport.jsx` | Exists but uses **hardcoded mock data** — no real API call |
| ORCID card in import grid | **Not shown** — missing from `importMethods` array |
| `/api/orcid/works` | **Does not exist** |
| `source` field on Publication | Exists (`String?`) — already supports `'ORCID'` value |
| User–publication link | Not implemented — `PublicationAuthor` TODO in import API |
| Profile page "Recent Works" | Shows all pubs, no source badge |

## ORCID API Approach (Recommended)

Use the **ORCID Public API** (`pub.orcid.org/v3.0/{id}/works`) — **no access token or scope change needed**. Only publicly-visible works are returned, which covers the vast majority of researcher profiles. The user's stored `orcidId` is pre-populated automatically.

---

## Implementation Steps

### 1. Backend — `/api/orcid/works` GET route
- New file: `src/app/api/orcid/works/route.js`
- Accepts `?orcidId=0000-0000-0000-0000`
- Calls `https://pub.orcid.org/v3.0/{orcidId}/works` (public API, no token)
- Transforms ORCID work summaries → HospitiumRIS `Publication` shape:
  - title, type, journal, year, doi, authors, url, abstract (if fetched), source=`'ORCID'`
- Returns array of transformed works

### 2. `OrcidImport.jsx` — Full rewrite
- Auto-populate ORCID ID from `useAuth()` user profile (if `user.orcidId` is set)
- Allow manual entry of any ORCID ID
- Call `/api/orcid/works` on submit
- Display results as a **checkable list** (title, journal, year, DOI) — user selects which works to import
- "Select All / Deselect All" toggle
- Filter by year range and work type
- "Import Selected" button calls `onImportSuccess(selectedWorks)`
- Show "From ORCID" badge on each result

### 3. `ImportPublications.jsx` — Register ORCID method
- Add ORCID entry to `importMethods` array (using ORCID green `#A6CE39`, orcid logo)
- Register `OrcidImport` dynamic import
- Add `case 'orcid'` to `renderImportComponent()`

### 4. `PublicationAuthor` link on import
- Update `src/app/api/publications/import/route.js`:
  - Use `getAuthenticatedUser()` (already available) instead of mock session
  - After creating each publication, create a `PublicationAuthor` record linking `userId` + `publicationId`
  - Set `source: 'ORCID'` and `authorId: user.orcidId` when importing from ORCID

### 5. Profile page — ORCID source badge
- In `src/app/researcher/profile/page.js` "Recent Works" section
- Show a small green "ORCID" chip next to publications where `source === 'ORCID'`
- Update `/api/researcher/profile` GET to include `source` field in publication query

---

## Files Changed / Created

| File | Action |
|------|--------|
| `src/app/api/orcid/works/route.js` | **Create** |
| `src/components/Publications/ImportTabs/OrcidImport.jsx` | **Rewrite** |
| `src/components/Publications/ImportPublications.jsx` | **Update** (add ORCID to grid) |
| `src/app/api/publications/import/route.js` | **Update** (auth + PublicationAuthor link) |
| `src/app/researcher/profile/page.js` | **Update** (ORCID source badge) |

---

## Schema Note
No migration needed — `Publication.source` and `Publication.authorId` already exist. `PublicationAuthor` table already exists and just needs to be populated.
