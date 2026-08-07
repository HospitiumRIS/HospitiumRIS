# CiteReady Integration Opportunities in HospitiumRIS

**Scope reviewed:** `/researcher/publications/import`, `/researcher/publications/collaborate/edit/[id]` (manuscript editor), the "My Publication Library" feature, and the underlying API routes and Prisma models that support them.

## Short answer

Yes, it's not just possible — the codebase already has the exact shape of integration this would need, built three times over (PubMed, Zotero, Mendeley, EndNote, OpenAlex, Research4Life, ORCID, BibTeX). Adding CiteReady means writing one more import tab that follows a pattern already proven in the code, not inventing new architecture.

One clarification worth flagging on the "read from My Publication Library" question: CiteReady's API is read-only and one-directional. It lets HospitiumRIS **pull a user's items and folders out of CiteReady**, not the other way around. There's no path in the CiteReady guide for it to read HospitiumRIS's library, and no write endpoint to push HospitiumRIS publications back into CiteReady. So the realistic integration is: CiteReady becomes a ninth import source that feeds a user's existing "My Publication Library," the same way Zotero and Mendeley do today.

## How the two routes actually work today

`/researcher/publications/import` renders `ImportPublications.jsx`, which is a grid of source cards (PubMed, DOI/Crossref, OpenAlex, Research4Life, BibTeX, Zotero, EndNote, Mendeley). Each card lazy-loads its own tab component from `src/components/Publications/ImportTabs/`, collects publications in whatever shape that source provides, and hands them to a single shared handler that `POST`s to `/api/publications/import`. That route normalizes fields (title, authors, DOI, journal, year, etc.), checks for duplicates by DOI, then PubMed ID, then title+year, and writes a `Publication` row. Nothing about this pipeline is source-specific past the transform step — a `CiteReadyImport.jsx` tab would plug into the same handler untouched.

`/researcher/publications/collaborate/edit/[id]` is the manuscript editor. Inside it, `CitationLibraryModal.jsx` is literally "My Publication Library" surfaced in-editor: it calls `GET /api/publications/library` for the user's folder tree and `GET /api/citations` for search, then lets the author insert a citation into the document. `ManageSourcesModal.jsx` shows what's already cited in the current manuscript. Both read from the same `Publication` / `LibraryFolder` / `LibraryFolderPublication` Prisma models that the import pipeline writes to. That's the important structural fact: **anything imported via the import route is automatically citable in the editor** — there's no separate plumbing to bridge import and editing.

## Mapping CiteReady onto this

CiteReady's read-only API (`GET /api/v1/items`, `GET /api/v1/folders`, `GET /api/v1/search`, CSL-JSON via `type=csl`) lines up almost one-to-one with what `/api/publications/library` and `/api/citations` already model: folders with parent/child relationships, items pinned to folders, search by keyword. That means a CiteReady import could do something none of the existing 8 sources do — preserve the user's folder structure. Today, `ImportPublications.jsx` imports a flat list; folder assignment happens later, manually, via `addPublication` on the library route. CiteReady's `GET /api/v1/folders` plus `GET /api/v1/items?recursive=true` gives enough to recreate the same folder tree in `LibraryFolder`/`LibraryFolderPublication` automatically on import — a real differentiator, not just parity with Zotero.

The existing `ZoteroImport.jsx` is the closest template: it authenticates (API key + user ID, stored via a per-user settings route at `/api/settings/zotero`), fetches collections, lets the user pick one, transforms items, and posts to the shared import endpoint. A CiteReady tab would follow the same shape but authenticate via OAuth 2.0/OIDC instead of a static key — `client_info.txt` already stages redirect URIs for both testing and production, suggesting OAuth was the intended path from the start, with the password-login flow only as a fallback until a public callback route exists in this app.

## What's missing before this can be built

Three gaps, none large: first, there's no credentials table for OAuth tokens yet — the Zotero pattern (`/api/settings/zotero`) stores a flat API key/user ID per user, but CiteReady needs `access_token`, `refresh_token`, and `expires_at` persisted per user with the rotation behavior the guide describes (new refresh token every use, single-flight locking, reactive fallback to full re-auth on `invalid_grant`). Second, the actual `client_id`/`client_secret` pair from CiteReady administrators — `client_info.txt` still has these as "to be issued," and a real production redirect URI needs to replace the placeholder before requesting credentials. Third, a callback route in this app (something like `/api/integrations/citeready/callback`) to receive the authorization code and complete the token exchange — none of the existing 8 sources needed this since they're all key-based, so it's new surface area, but small.

Worth noting separately: the `Publication` model has no field for an external item ID (CiteReady's `uuid`/`itemid`/`accesscode`). Duplicate detection on re-import currently falls back to DOI, then title+year — which works, but won't support clean incremental re-sync (e.g., "pull anything new since last import"). Adding a `sourceItemId` column would future-proof that without touching the current dedup logic.

## Suggested next step

Given the effort here is small relative to the existing pattern, this is a good candidate for a scoped build: one new import tab, one settings/credentials route modeled on the Zotero one, one OAuth callback route, and an optional folder-preservation step on import. Happy to draft the implementation plan or start on the OAuth callback route and settings model if you want to move forward — just say the word.
