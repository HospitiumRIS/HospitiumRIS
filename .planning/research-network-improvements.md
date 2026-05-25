# Research Network: Improvements & Institution-Wide Admin View

This plan covers targeted bug fixes and improvements to the existing `ResearchNetworkWidget`, then adds a new institution-wide collaboration network for the research admin role.

---

## Part 1 — Fix & Improve Existing `ResearchNetworkWidget`

### Bugs

1. **Label bug in `ResearcherSidebar`** (`line 280`) — The Publications collapse button says "Shared Manuscripts" instead of "Shared Publications". One-line fix.

2. **`onEngineStop` resets zoom on every re-stabilization** (`NetworkGraph.jsx line 238`) — Add a `hasInitialFit` ref so `zoomToFit` only fires once after the graph first loads, not every time the simulation settles.

3. **`filterNodes` crashes on null specialization** (`networkDataProcessor.js line 69`) — `node.specialization.split(',')` throws if `specialization` is null/undefined. Add `?.` optional chaining guard.

4. **`FilterPanel` local state drifts from parent filters** — `localFilters` is initialised from `filters` prop once but never re-synced when the parent resets filters externally. Add a `useEffect` to sync `localFilters` when `filters` prop changes.

### Improvements

5. **Remove duplicate handlers** — `handleNodeClick` and `handleNodeSelect` in `ResearchNetworkWidget` are identical. Merge to one.

6. **Wire up `refetch`** — It is destructured from `useNetworkData` but never used. Add a refresh `IconButton` to `NetworkControls` and pass `onRefresh`.

7. **Hover tooltip** — `hoveredNode` state is tracked but drives zero UI. Render a small floating `Paper` tooltip near the hovered node showing name + institution.

8. **Link thickness by collaboration strength** — `link.strength` is already set in `processNetworkData` but all links render at identical width. Scale `lineWidth` in `paintLink` by `Math.min(link.strength, 5)`.

9. **Inter-collaborator edges** — `processNetworkData` currently only creates star edges (lead ↔ each collaborator). Add a second pass: for every pair of collaborators who share a publication/manuscript, create an edge between them too (with lower visual weight/opacity).

10. **Export uses fragile `document.querySelector('canvas')`** — Replace with `fgRef.current.renderer().domElement` (the actual canvas from the force-graph instance) to avoid grabbing a wrong canvas.

11. **Color alignment** — `ResearcherSidebar` header gradient hardcodes `#6366f1`/`#8b5cf6`; should use `theme.palette.primary.main` so it respects the Hospitium purple theme.

12. **`useNetworkData` duplicated fetch logic** — Extract the fetch body into a shared inner function used by both the initial `useEffect` and `refetch`.

---

## Part 2 — Institution-Wide Network (Research Admin)

### Mental model
- **No central node** — equal-peer graph of all researchers in the institution
- **Default**: institution members only; toggle to include external collaborators
- **Edges** between any two researchers who share ≥1 publication, manuscript, or proposal
- **Edge weight** = number of shared works (thicker = stronger collaboration)
- **External nodes**: shown with a dashed border in a distinct muted color when the toggle is on
- **Node size**: scaled by total activity (publications + manuscripts), same as researcher view

### New files to create

| File | Purpose |
|------|---------|
| `src/app/api/institution-admin/network/route.js` | API: fetch all institution researchers + build pairwise edges |
| `src/components/InstitutionNetwork/hooks/useInstitutionNetworkData.js` | Data hook for `/api/institution-admin/network` |
| `src/components/InstitutionNetwork/utils/institutionNetworkDataProcessor.js` | Full-mesh link builder (all researcher pairs) |
| `src/components/InstitutionNetwork/InstitutionNetworkWidget.jsx` | Main orchestrator widget |
| `src/components/InstitutionNetwork/InstitutionNetworkLegend.jsx` | Updated legend (no lead node; adds internal/external) |
| `src/components/InstitutionNetwork/index.js` | Barrel export |
| `src/app/institution-admin/network/page.js` | Page with Hospitium purple stats header + graph |

### Reused without modification
- `NetworkGraph.jsx` — accepts `nodes`/`links`, already paint-agnostic
- `NetworkControls.jsx` — search bar, zoom, export, filter button
- `FilterPanel.jsx` — will need an extra "Show External Collaborators" toggle added
- `ResearcherSidebar.jsx` — researcher detail drawer (no "Lead Investigator" label for admin view, plus "View in User Management" button)
- `styles/theme.js` — shared color/size/force config

### API endpoint: `GET /api/institution-admin/network`
- Auth: `accountType === 'INSTITUTION_ADMIN'`
- Query all users in admin's institution with `researchProfile`, `institution`
- For each user, gather their publications (all co-author relations) and manuscripts (all collaborators)
- Build pairwise edge map: for every publication/manuscript, emit an edge for every pair of participants; accumulate weight
- Separate external collaborators (users whose `institutionId !== adminInstitutionId`)
- Return `{ researchers, links, external_collaborators, metadata }`

### `institutionNetworkDataProcessor.js`
- `processInstitutionNetworkData(rawData, includeExternal)` — maps researchers to nodes, builds full-mesh links; if `includeExternal` is false, filters out external nodes and their links
- `calculateInstitutionStats(nodes, links)` — returns `totalResearchers`, `totalLinks`, `avgCollaborations`, `externalCollaborators`, `totalPublications`

### `InstitutionNetworkWidget.jsx` key differences from researcher widget
- No `isLead` concept in nodes
- New `includeExternal` boolean state (default `false`), passed to `processInstitutionNetworkData`
- "Show External" toggle chip in `NetworkControls` bar (or filter panel)
- Stats chips: "N Researchers", "N Internal Links", "N External Collaborators", "N Publications"
- `NetworkLegend` replaced with `InstitutionNetworkLegend`

### `institution-admin/network/page.js`
- Uses `InstitutionAdminLayout` (or equivalent layout wrapper)
- Purple stats cards row (Hospitium pattern): Total Researchers, Active Collaborations, External Partners, Total Publications
- Full-width `InstitutionNetworkWidget` below

---

## Implementation Order

1. Bug fixes in existing `ResearchNetworkWidget` (steps 1–4, highest priority)
2. Improvement passes (steps 5–12)
3. API route `institution-admin/network`
4. `InstitutionNetwork` components
5. `institution-admin/network` page
