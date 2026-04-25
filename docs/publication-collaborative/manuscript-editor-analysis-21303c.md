# Collaborative Manuscript Editor - Analysis & Improvement Plan

**Last Updated**: April 25, 2026  
**URL**: `/researcher/publications/collaborate/edit/[id]`  
**Route**: `src/app/researcher/publications/collaborate/edit/[id]/page.js`

Comprehensive analysis of the collaborative manuscript editing page with improvement suggestions for each component.

---

## Page Overview

A **Google Docs-style collaborative manuscript editor** built with:
- **Next.js 14** (App Router, `'use client'`)
- **TipTap** rich text editor with custom extensions
- **Material-UI (MUI)** component library
- **Prisma** + PostgreSQL backend
- **REST API** polling for real-time sync

### Current Capabilities
- Real-time presence tracking (3-second polling)
- Document synchronization across collaborators
- Citation management with "Cite as You Write" (`@author` / `cite:` triggers)
- Comment system with text highlighting and threading
- Track Changes with accept/reject per-change
- Version history with restore
- Rich text editing (headings, tables, images, lists, links, code)
- Font family, font size, text color, highlight
- **Pagination system** with manual/auto page breaks (added Apr 2026)
- Bibliography/reference generation (APA, MLA, Chicago, Harvard, Vancouver, IEEE, AMA)
- Document structure outline (left sidebar)

---

## Current File Inventory

| File | Size | Lines (approx) | Status |
|------|------|---------|--------|
| `page.js` | main orchestrator | ~4,526 lines | ⚠️ Monolithic |
| `components/DocumentHeader.jsx` | 22 KB | ~633 lines | ✅ Stable |
| `components/DocumentMenuBar.jsx` | 71 KB | ~1,938 lines | ⚠️ Very large |
| `components/CommentsSidebar.jsx` | 31 KB | ~903 lines | ✅ Functional |
| `components/CitationLibraryModal.jsx` | 32 KB | ~871 lines | ✅ Functional |
| `components/ManageSourcesModal.jsx` | 28 KB | ~800 lines | ✅ Functional |
| `components/VersionHistorySidebar.jsx` | 28 KB | ~777 lines | ✅ Functional |
| `components/TrackedChangesSidebar.jsx` | 27 KB | ~737 lines | ✅ Functional |
| `components/TablePropertiesDialog.jsx` | 32 KB | ~900 lines | ✅ Functional |
| `components/PaginationControls.jsx` | 10 KB | ~330 lines | 🆕 New |
| `components/CitationHoverMenu.jsx` | 7 KB | ~200 lines | ✅ Stable |
| `components/CommentThread.jsx` | 25 KB | ~700 lines | ✅ Stable |
| `components/CommentTooltip.jsx` | 10 KB | ~280 lines | ✅ Stable |
| `components/AddCommentForm.jsx` | 10 KB | ~290 lines | ✅ Stable |
| `components/InsertTableDialog.jsx` | 9 KB | ~260 lines | ✅ Stable |
| `components/InviteCollaboratorDialog.jsx` | 14 KB | ~400 lines | ✅ Stable |
| `extensions/CitationMark.js` | 3.5 KB | 128 lines | ✅ Stable |
| `extensions/CommentHighlight.js` | 7 KB | 221 lines | ✅ Stable |
| `extensions/TrackChanges.js` | 13 KB | 366 lines | ✅ Stable |
| `extensions/Pagination.js` | 7 KB | ~210 lines | 🆕 New |
| `utils/paginationHelper.js` | 4 KB | ~160 lines | 🆕 New |

---

## Component Analysis

### 1. **Main Page Component** (`page.js` — ~4,526 lines)

#### Current State
- Monolithic component with **33+ `useState` hooks**
- TipTap editor configured with 14 extensions
- Real-time sync via 3-second polling interval
- Auto-save with 2-second debounce
- All toolbar JSX inline (not extracted)
- Handles: editor setup, citations, comments, track changes, version history, pagination, sync, permissions

#### State Inventory
```
Refs (5): lastKnownServerUpdateRef, lastLocalSaveTimeRef, isSavingRef, savedSelectionRef, paginationControlsRef
useState (33+):
  mounting/loading: mounted, loading, saving, savingTitle
  document: manuscript, lastSaved, collaborators, pendingInvitations, onlineUserIds, userPermissions
  UI toggles: inviteDialogOpen, showComments, menuAnchor, insertTableDialogOpen, tablePropertiesDialogOpen
  menus: citationMenuAnchor, headingDropdownAnchor, fontFamilyAnchor, fontSizeAnchor
  structure: documentStructure, showDocumentStructure
  citations: citeAsYouWrite, citationStyle, zoteroConnected, citationPopupAnchor, citationSearch
             selectedCitationIndex, triggerPosition, citationLibraryOpen, manageSourcesOpen, bibliographyGeneratorOpen
  comments: selectedText, commentsData
  tracking: trackChangesEnabled, trackedChanges, showTrackChanges, showTrackedChangesSidebar
  versioning: showVersionHistory
  pagination: paginationEnabled
  quickCitations: quickCitations, quickCitationsLoading, quickCitationsError
  autosave: autosaveEnabled
```

#### TipTap Extensions Registered
```
StarterKit, TextAlign, Underline, TextStyle, Color, Highlight (multicolor),
Link, Image, Table (resizable), TableRow, TableHeader, TableCell,
FontFamily, CharacterCount, Placeholder, CommentHighlight, TrackChanges,
CitationMark, PageBreak, Pagination
```

#### Issues
- **File size** (~4,526 lines) — very hard to maintain and navigate
- **Inline toolbar** — all toolbar buttons are JSX directly in `page.js`, not a component
- **Debug `console.log`** on every render (`params`, `manuscriptId`) left in
- **No error boundaries** — a crash in any part breaks the full editor
- **Polling vs WebSocket** — 3-second polling for sync and presence is expensive
- **No `React.memo`** on heavy sub-components
- **`autosaveEnabled` starts `false`** — user must manually enable auto-save

#### Improvements Needed

**High Priority:**
1. Extract inline toolbar into `EditorToolbar.jsx`
2. Move citation logic → `hooks/useCitations.js`
3. Move comment logic → `hooks/useComments.js`
4. Move sync/presence logic → `hooks/useRealtimeSync.js`
5. Remove debug `console.log` statements
6. Add error boundaries around editor, sidebars, modals

**Medium Priority:**
6. Replace 3-second polling with WebSocket (Socket.io or native)
7. Use `useReducer` for comments and tracked changes state
8. Enable auto-save by default (`autosaveEnabled` starts `true`)
9. Add `React.memo` to toolbar, sidebars, modals

**Low Priority:**
10. Convert to TypeScript
11. Add unit tests for action handlers

---

### 2. **DocumentHeader Component** (`DocumentHeader.jsx` — ~633 lines)

#### Current State
- Editable inline title with save/cancel
- Collaborator avatars with online/offline status (animated ripple)
- Displays pending invitations count
- Shows save status (last saved time or "Saving...")
- Role-based invite button visibility

#### Strengths
- Clean, professional UI matching Google Docs conventions
- Online presence animated with ripple effect
- Inline editing feels native
- Shows max 6 avatars with overflow count

#### Issues
- No cursor/section indicator per collaborator ("Alice is editing Introduction")
- No live typing indicators
- Title save requires clicking ✓ — no auto-save on blur option

#### Improvements

**High Priority:**
1. Add per-collaborator cursor position indicators
2. Show "editing [section]" label per active user

**Medium Priority:**
3. Add character counter to title field
4. Auto-save title on blur (with debounce)
5. Show last active timestamp for offline users

---

### 3. **DocumentMenuBar Component** (`DocumentMenuBar.jsx` — ~1,938 lines)

#### Current State
Full application-style menu bar with these menus:

| Menu | Items | Status |
|------|-------|--------|
| **File** | New, Open, Save, Save As, Export PDF, Export Word, Share, Print, Autosave | ✅ |
| **Edit** | Undo, Redo, Cut, Copy, Paste, Find, Select All | ✅ |
| **View** | Fullscreen, Zoom In/Out, Reset Zoom, Outline, Comments, Track Changes | ✅ |
| **Insert** | Table (with templates & quick grid), Link, Image, Page Break, Horizontal Rule, Special Characters | ✅ |
| **Format** | Text style, Bold, Italic, Underline, Strikethrough, Superscript, Subscript, Text Color, Highlight, Headings, Text Align, Line Spacing, Lists, Blockquote, Increase/Decrease Indent, Clear Formatting | ✅ |
| **Review** | Spell Check, Grammar Check, Language, Track Changes, Accept/Reject All, New Comment, Show Comments | ✅ |
| **Page** | Toggle Pagination, Insert Page Break (Ctrl+Enter), Auto-Calculate, Remove All Breaks, Pagination Settings | 🆕 |
| **Citation** | Delegated to parent via `setCitationMenuAnchor` | ✅ |

**Props:**
```javascript
{ onFileAction, onEditAction, onViewAction, onInsertAction,
  onFormatAction, onReviewAction, onPageAction,
  autosaveEnabled, editor, showComments,
  paginationEnabled, setCitationMenuAnchor, onTableProperties }
```

#### Issues
- **71 KB / ~1,938 lines** — the largest single file in the editor
- Complex hover/timeout logic for table submenu
- Citation menu still handled by parent (not migrated)
- No keyboard navigation within menus (arrow keys)

#### Improvements

**High Priority:**
1. Split into separate menu files: `FileMenu.jsx`, `EditMenu.jsx`, etc.
2. Migrate Citation menu into this component fully
3. Add keyboard arrow-key navigation

**Medium Priority:**
4. Implement command palette (Ctrl+K / Cmd+K)
5. Add recently used items per menu
6. Mobile: convert to hamburger or bottom sheet

---

### 4. **CommentsSidebar Component** (`CommentsSidebar.jsx` — ~903 lines)

#### Current State
- 3-second polling for live updates
- Tabs: All / Open / Resolved
- Search and filter
- Thread-based with replies
- Comment tooltips on highlighted text (`CommentTooltip.jsx`)
- Supports `COMMENT`, `SUGGESTION` comment types
- Linked to `CommentHighlight` extension for in-text highlighting

#### Issues
- Polling creates server load (especially with many users)
- No optimistic updates — new comments appear after next poll
- Component is large and mixes data fetching with rendering

#### Improvements

**High Priority:**
1. Replace polling with WebSocket for instant updates
2. Add optimistic comment insertion
3. Extract data fetching → `hooks/useComments.js`

**Medium Priority:**
4. Add `@mention` support for collaborators
5. Add emoji reactions on comments
6. Group comments by document section/heading
7. Virtualize list for documents with 100+ comments

---

### 5. **CitationLibraryModal Component** (`CitationLibraryModal.jsx` — ~871 lines)

#### Current State
- Database-backed citation library
- Search with debounce
- Folder/collection organization
- Citation styles: APA, MLA, Chicago, Harvard, Vancouver, IEEE, AMA (7 styles)
- Integration with `ManageSourcesModal` for CRUD
- Linked to `CitationMark` TipTap extension

#### Note
The previous analysis listed only 3 citation styles. **All 7 styles are now fully implemented** in `@/utils/citationFormatters`.

#### Issues
- No pagination/virtual scroll — full list loaded at once
- No import from external sources (Zotero, DOI lookup)
- No duplicate detection when adding citations

#### Improvements

**High Priority:**
1. Implement virtual scrolling / pagination
2. Add DOI auto-fetch (CrossRef API)
3. Import from BibTeX / RIS files

**Medium Priority:**
4. Add duplicate detection on insert
5. Suggest citations based on current text context
6. Add citation preview before inserting

---

### 6. **ManageSourcesModal Component** (`ManageSourcesModal.jsx` — ~800 lines)

#### Current State
- Full CRUD for citation sources
- Separate from CitationLibraryModal
- Supports all citation fields per type

#### Issues
- Overlaps responsibility with CitationLibraryModal
- Two modals to manage one concept (sources ↔ citations)

#### Improvement
1. Consider merging or clearly separating responsibilities
2. Add batch edit/delete

---

### 7. **VersionHistorySidebar Component** (`VersionHistorySidebar.jsx` — ~777 lines)

#### Current State
- Manual version creation with description
- Auto-versions triggered by save
- Version restore (replaces editor content)
- Shows author, timestamp, description

#### Issues
- **No visual diff** between versions — user must restore to see changes
- No auto-versioning on a time schedule
- Restore is destructive with no "undo restore" option

#### Improvements

**High Priority:**
1. Add inline diff view (highlight added/removed text)
2. Implement undo-restore (keep previous content in history)

**Medium Priority:**
3. Time-based auto-versioning (every 30 min or every 100 edits)
4. Word count delta per version
5. Branch/fork version (non-destructive exploration)

---

### 8. **TrackedChangesSidebar Component** (`TrackedChangesSidebar.jsx` — ~737 lines)

#### Current State
- Lists insertions and deletions with author and timestamp
- Accept / Reject per change
- Filter: Pending / Accepted / Rejected
- Linked to `TrackChanges` TipTap extension

#### Issues
- No bulk accept/reject all
- Formatting changes not tracked (only text insertions/deletions)
- No reasoning/annotation per change

#### Improvements

**High Priority:**
1. Add "Accept All" / "Reject All" buttons
2. Accept/Reject by author
3. Track formatting and citation changes

**Medium Priority:**
4. Allow annotating a change with a note
5. Add author color-coding
6. Timeline view of edits

---

### 9. **Pagination System** (🆕 Added April 2026)

#### Current State — fully implemented

**Files:**
- `extensions/Pagination.js` — `PageBreak` node + `Pagination` ProseMirror plugin
- `components/PaginationControls.jsx` — Toolbar dropdown + Settings dialog
- `utils/paginationHelper.js` — Page size, word count, print CSS utilities

**Features:**
- Enabled by default
- Manual page break insertion (`Ctrl/Cmd + Enter`)
- Auto-calculate breaks based on word count (~800 words/page)
- Remove all breaks
- Settings: page size (A4/Letter/Legal), orientation, margins, page number position
- Visual indicator: dashed purple border with "--- Page Break ---" label
- Print CSS: `break-after: page`, removes visual markers in print

**Menu integration:**
- Accessible via **Page** menu in DocumentMenuBar
- Also accessible via toolbar `<PaginationControls>` button

#### Issues
- Auto-calculate uses **word count only** — not actual rendered element height
- Page breaks don't reflow when text is edited (must re-run auto-calculate)
- No page count in status bar
- No page-based navigation ("jump to page X")
- Page number decorations (`Page X`) not yet correctly positioned relative to break

#### Improvements

**High Priority:**
1. Add page count display in status bar / header
2. Fix page number decoration positioning
3. Persist pagination settings to database

**Medium Priority:**
4. Auto-reflow breaks on document change (debounced)
5. Page navigation control (jump to page)
6. Use rendered element heights for more accurate breaks

---

### 10. **Custom TipTap Extensions**

#### `CitationMark.js` (128 lines)
- Mark extension storing `citationId` and `citationData`
- Commands: `setCitation`, `updateCitation`, `removeCitation`
- Renders as purple dotted underline
- **Missing:** hover preview card, inline editing

#### `CommentHighlight.js` (221 lines)
- Mark extension storing `commentId` and `commentType`
- Works with `CommentTooltip` for click-to-view
- **Missing:** overlapping comment support, hover preview

#### `TrackChanges.js` (366 lines)
- Extension tracking text insertions/deletions via ProseMirror steps
- Decorations for visual diff in editor
- Commands: `enableTrackChanges`, `disableTrackChanges`, `acceptChange`, `rejectChange`, `acceptAllChanges`, `rejectAllChanges`
- **Missing:** formatting change tracking, conflict resolution

#### `Pagination.js` (🆕 ~210 lines)
- `PageBreak` block node — renders `<div class="page-break">`
- `Pagination` extension — ProseMirror plugin managing state and decorations
- Commands: `insertPageBreak`, `removeAllPageBreaks`, `setPaginationEnabled`, `setPaginationOptions`, `autoCalculatePageBreaks`, `getPageCount`
- Keyboard shortcut: `Mod+Enter`

---

## Critical Issues — Current Priority

### 🔴 High (Address Now)
1. **`page.js` too large** (~4,526 lines) — extract toolbar, extract hooks
2. **Debug `console.log`** on every render — remove immediately
3. **No error boundaries** — single crash breaks entire editor
4. **Auto-save disabled by default** — users may lose work
5. **Pagination page count not in UI** — users can't see total pages

### 🟡 Medium (Next Sprint)
6. **3-second polling** — replace with WebSocket
7. **No visual diff** in version history
8. **No bulk accept/reject** in tracked changes
9. **CitationLibraryModal** has no pagination/virtual scroll
10. **Pagination breaks don't reflow** on content edit

### 🟢 Low (Backlog)
11. No TypeScript
12. No unit tests for action handlers
13. Mobile optimization (menu bar, toolbar)
14. Accessibility (ARIA, keyboard navigation in menus)
15. No offline mode / offline-first support

---

## Recommended Implementation Roadmap

### Phase 1 — Pagination ✅ Complete (Apr 2026)
- [x] Pagination extension (`PageBreak` + `Pagination`)
- [x] PaginationControls component
- [x] Page menu in DocumentMenuBar
- [x] Auto-enabled by default
- [x] Print-friendly CSS

### Phase 2 — Auto-References (Next)
- [ ] `hooks/useAutoReferences.js`
- [ ] `utils/referencesManager.js`
- [ ] Auto-detect citations → auto-update References section
- [ ] Toggle auto-update on/off
- [ ] Manual refresh button

### Phase 3 — Housekeeping
- [ ] Remove debug `console.log`
- [ ] Enable auto-save by default
- [ ] Add error boundaries
- [ ] Extract `EditorToolbar.jsx` from `page.js`
- [ ] Extract hooks: `useCitations`, `useComments`, `useRealtimeSync`

### Phase 4 — Real-time Upgrade
- [ ] Replace polling with WebSocket (Socket.io)
- [ ] Optimistic comment updates
- [ ] CRDT conflict resolution (Yjs)

### Phase 5 — Features
- [ ] Visual diff in version history
- [ ] Bulk accept/reject in tracked changes
- [ ] DOI auto-fetch in citation library
- [ ] Command palette (Ctrl+K)
- [ ] Page count in status bar
- [ ] Per-collaborator cursor indicators

---

## Architecture — Current vs Target

### Current Structure
```
/edit/[id]/
├── page.js                          (~4,526 lines — monolithic)
├── components/
│   ├── DocumentHeader.jsx
│   ├── DocumentMenuBar.jsx          (~1,938 lines — oversized)
│   ├── CommentsSidebar.jsx
│   ├── CommentThread.jsx
│   ├── CommentTooltip.jsx
│   ├── AddCommentForm.jsx
│   ├── CitationLibraryModal.jsx
│   ├── CitationHoverMenu.jsx
│   ├── ManageSourcesModal.jsx
│   ├── VersionHistorySidebar.jsx
│   ├── TrackedChangesSidebar.jsx
│   ├── InsertTableDialog.jsx
│   ├── TablePropertiesDialog.jsx
│   ├── InviteCollaboratorDialog.jsx
│   └── PaginationControls.jsx       (🆕 new)
├── extensions/
│   ├── CitationMark.js
│   ├── CommentHighlight.js
│   ├── TrackChanges.js
│   └── Pagination.js                (🆕 new)
└── utils/
    └── paginationHelper.js          (🆕 new)
```

### Target Structure
```
/edit/[id]/
├── page.js                          (orchestrator only, ~200 lines)
├── components/
│   ├── EditorToolbar.jsx            (extracted from page.js)
│   ├── DocumentHeader.jsx
│   ├── DocumentMenuBar.jsx
│   ├── menus/
│   │   ├── FileMenu.jsx
│   │   ├── EditMenu.jsx
│   │   ├── ViewMenu.jsx
│   │   ├── InsertMenu.jsx
│   │   ├── FormatMenu.jsx
│   │   ├── ReviewMenu.jsx
│   │   ├── PageMenu.jsx
│   │   └── CitationMenu.jsx
│   ├── PaginationControls.jsx
│   ├── sidebars/
│   │   ├── CommentsSidebar.jsx
│   │   ├── VersionHistorySidebar.jsx
│   │   └── TrackedChangesSidebar.jsx
│   └── modals/
│       ├── CitationLibraryModal.jsx
│       ├── ManageSourcesModal.jsx
│       └── InviteCollaboratorDialog.jsx
├── hooks/
│   ├── useCitations.js
│   ├── useComments.js
│   ├── useRealtimeSync.js
│   ├── useTrackChanges.js
│   ├── useVersionHistory.js
│   └── useAutoReferences.js        (next phase)
├── extensions/
│   ├── CitationMark.js
│   ├── CommentHighlight.js
│   ├── TrackChanges.js
│   └── Pagination.js
└── utils/
    ├── paginationHelper.js
    └── referencesManager.js        (next phase)
```

### Recommended Tech Additions
| Technology | Purpose |
|-----------|---------|
| **Socket.io** | Replace polling for real-time sync |
| **Yjs** | CRDT conflict-free collaborative editing |
| **React Query** | Server state caching + invalidation |
| **Zustand** | Lightweight shared editor state |
| **Vitest** | Unit testing |
| **Playwright** | End-to-end testing |

---

## Conclusion

The editor is **fully functional and feature-rich**. The key strengths are the comprehensive citation system, comment threading, track changes, version history, and the newly added pagination system. The main structural debt is the monolithic `page.js` and the oversized `DocumentMenuBar.jsx`.

**Immediate next steps in priority order:**
1. 🔜 **Phase 2: Auto-References** — most impactful user feature
2. 🔜 **Remove debug logs + enable auto-save** — quick wins
3. 🔜 **Extract `EditorToolbar.jsx`** — biggest DX improvement
4. 🔜 **Add page count to status bar** — complete pagination UX
