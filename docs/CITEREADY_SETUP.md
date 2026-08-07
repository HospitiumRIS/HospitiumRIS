# CiteReady Import Setup Guide

This guide covers the CiteReady integration added to HospitiumRIS: an import source on
**Import Publications** and a **Citation Menu** entry in the manuscript editor. Both share
one connection per user.

See also `docs/CITEREADY_INTEGRATION_OPPORTUNITIES.md` for the original feasibility analysis
this build came from, and `3RD_PARTY_INTEGRATION_READONLY_v2_en.md` for CiteReady's own API guide.

## How authentication works right now

CiteReady's OAuth 2.0/OIDC flow (their recommended path) needs a real `client_id` /
`client_secret` issued by CiteReady administrators. As of this build those are not yet
issued (`client_info.txt` still lists them as "to be issued"), so this integration ships
with **password login** as the working path today, and OAuth **scaffolded** so switching
over later is a config change, not a rebuild.

- **Password login (active today):** the user enters their CiteReady email and password once.
  We exchange it server-side for a bearer token (`POST /auth/login`) and store only the
  resulting token (never the password), per CiteReady's own guidance. The token is valid ~7
  days; after that, reconnect the same way.
- **OAuth 2.0/OIDC (scaffolded, inactive):** routes exist at
  `src/app/api/citeready/oauth/authorize` and `.../callback`, implementing the authorization-code
  flow with HTTP Basic client auth exactly as CiteReady's guide requires. They stay inactive
  and return a clear "not configured" error until `CITEREADY_CLIENT_ID`, `CITEREADY_CLIENT_SECRET`,
  and `CITEREADY_REDIRECT_URI` are set in `.env` (currently blank).

## Using CiteReady Import in HospitiumRIS

### From Import Publications

1. Navigate to **Publications → Import Publications**
2. Click the **CiteReady** import method
3. Enter your CiteReady email and password, click **Connect to CiteReady**
4. Pick a folder (or "All Items"), review the publications listed, select the ones you want
5. Click **Import Selected**

### From the manuscript editor

1. Open a manuscript in the collaborative editor
2. Open the **Citation** menu in the toolbar
3. If not yet connected, click **Connect CiteReady** and sign in
4. Once connected, the same entry (now **CiteReady Library**) opens the CiteReady import tab
   in a new tab, pre-selected

Either path uses the same stored connection — connecting once from the editor also connects
the Import Publications page, and vice versa.

## What gets imported

Items come back from CiteReady as CSL-JSON (`GET /api/v1/items?type=csl`) and are mapped to
HospitiumRIS's publication fields (title, authors, journal, year, DOI, ISBN, URL, abstract,
volume, pages, publisher). This first version imports **flat**, matching how the other seven
import sources (PubMed, DOI/Crossref, OpenAlex, Research4Life, BibTeX, Zotero, EndNote,
Mendeley) behave — CiteReady folder structure is not yet mirrored into HospitiumRIS's own
"My Publication Library" folders. That's a natural follow-up, not a limitation of the API
(CiteReady's `GET /api/v1/folders` already returns everything needed for it).

## Environment

This build points at CiteReady's **testing** environment (`https://dev-api.citeready.com`) by
default. To use production (`https://apiv2.citeready.com`), a production `client_id`/`client_secret`
pair needs to be requested from CiteReady administrators first — dev and prod credentials are
not interchangeable.

## Disconnecting

Click **Disconnect** on the CiteReady import tab, or clear it via `DELETE /api/settings/citeready`.
This removes the stored token; it does not affect anything already imported.

## Files added

| Purpose | Path |
| --- | --- |
| Settings enum + Prisma migration needed | `prisma/schema.prisma` (`SettingsType.CITEREADY`) |
| Per-user connection settings | `src/app/api/settings/citeready/route.js` |
| Server-side CiteReady API client | `src/lib/citereadyClient.js`, `src/lib/citereadyAuth.js` |
| Password login proxy | `src/app/api/citeready/auth/login/route.js` |
| Folders / items proxies | `src/app/api/citeready/folders/route.js`, `src/app/api/citeready/items/route.js` |
| OAuth scaffold (inactive) | `src/app/api/citeready/oauth/authorize/route.js`, `.../callback/route.js` |
| Client-side helper | `src/services/citereadyService.js` |
| Import Publications tab | `src/components/Publications/ImportTabs/CiteReadyImport.jsx` |
| Editor connect dialog | `src/app/researcher/publications/collaborate/edit/[id]/components/CiteReadyConnectDialog.jsx` |

## Before this works end to end

Run the Prisma migration to add the `CITEREADY` enum value to the database:

```bash
npx prisma migrate dev --name add-citeready-settings
```

Until that migration runs, the settings routes fail gracefully with a `503` pointing back to
this command (same defensive pattern the existing Zotero settings route uses).
