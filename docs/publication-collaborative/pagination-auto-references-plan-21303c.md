# Document Pagination & Automatic Reference List Implementation

Add page numbering service and automatic reference list generation that updates dynamically as citations are inserted into the manuscript editor.

## Current State Analysis

### Citation System
- **Citation insertion**: Uses TipTap `CitationMark` extension with `setCitation` command
- **Citation tracking**: Citations stored in manuscript database via `/api/manuscripts/${manuscriptId}/citations`
- **Bibliography generator**: Exists as modal (`BibliographyGenerator.jsx`) that manually inserts formatted references
- **Reference hover button**: Detects "References" heading and shows button to generate bibliography
- **Citation styles**: Supports APA, MLA, Chicago, Harvard, Vancouver, IEEE, AMA

### Current Workflow (Manual)
1. User inserts citations using `@author` or `cite:` triggers
2. Citations tracked in database automatically
3. User manually adds "References" heading
4. User hovers over "References" heading → button appears
5. User clicks button → Bibliography Generator modal opens
6. User clicks "Insert Bibliography" → formatted list inserted at cursor

### Issues Identified
1. **No pagination** - Document appears as continuous scroll
2. **Manual reference insertion** - User must manually trigger bibliography generation
3. **No auto-update** - References don't update when citations added/removed
4. **No reference positioning** - References inserted at cursor, not automatically at end

## Requirements

### 1. Pagination Service
- Add page breaks at configurable intervals (default: A4 page ~800 words or fixed height)
- Display page numbers (bottom center or configurable position)
- Visual page boundaries in editor
- Print-friendly page breaks
- Configurable page size (A4, Letter, Legal)
- Configurable margins

### 2. Automatic Reference List
- **Auto-detection**: Detect when citations are inserted/removed
- **Auto-positioning**: Always place "References" section at document end
- **Auto-update**: Regenerate reference list when citations change
- **Smart insertion**: 
  - If "References" heading exists, update content below it
  - If not, create "References" heading + spacing + reference list
- **Formatting**: Use selected citation style (APA, MLA, etc.)
- **Spacing**: Proper spacing between heading and list

## Implementation Plan

### Phase 1: Pagination Service

#### 1.1 Create Pagination Extension
**File**: `src/app/researcher/publications/collaborate/edit/[id]/extensions/Pagination.js`

**Features**:
- TipTap extension for page breaks
- Calculate page height based on content
- Insert visual page break markers
- Page number tracking
- Print CSS for proper page breaks

**Configuration**:
```javascript
{
  pageSize: 'A4', // A4, Letter, Legal
  orientation: 'portrait', // portrait, landscape
  margins: { top: 72, right: 72, bottom: 72, left: 72 }, // in pixels
  showPageNumbers: true,
  pageNumberPosition: 'bottom-center', // bottom-center, bottom-right, etc.
  wordsPerPage: 800, // approximate
}
```

#### 1.2 Add Page Break Commands
- `insertPageBreak()` - Manual page break insertion
- `autoCalculatePageBreaks()` - Auto-calculate based on content
- `removePageBreaks()` - Remove all page breaks
- `updatePageNumbers()` - Recalculate page numbers

#### 1.3 Update Editor Styles
**File**: `src/app/researcher/publications/collaborate/edit/[id]/page.js`

Add CSS for:
- Page break visualization (dashed line)
- Page numbers (footer)
- Print media queries
- Page containers with proper margins

#### 1.4 Add Pagination Controls
**Location**: Document toolbar or menu bar

**Controls**:
- Toggle pagination on/off
- Page size selector
- Margin settings
- Page number format
- Auto-pagination toggle

### Phase 2: Automatic Reference List

#### 2.1 Create Reference Manager Hook
**File**: `src/app/researcher/publications/collaborate/edit/[id]/hooks/useAutoReferences.js`

**Responsibilities**:
- Track citations in document
- Detect citation changes
- Generate formatted reference list
- Find/create "References" section
- Update reference list automatically

**Key Functions**:
```javascript
{
  // Track all citations in document
  trackCitations: () => Set<citationId>,
  
  // Generate formatted reference list
  generateReferenceList: (citations, style) => string,
  
  // Find References section in document
  findReferencesSection: () => { pos, node } | null,
  
  // Insert/update References section
  updateReferencesSection: (formattedRefs) => void,
  
  // Auto-update on citation change
  enableAutoUpdate: () => void,
  disableAutoUpdate: () => void,
}
```

#### 2.2 Create References Section Manager
**File**: `src/app/researcher/publications/collaborate/edit/[id]/utils/referencesManager.js`

**Functions**:
```javascript
// Find or create References section at document end
ensureReferencesSection(editor) {
  // 1. Search for "References" or "Bibliography" heading
  // 2. If found, return position
  // 3. If not found, create at end:
  //    - Add spacing (2 line breaks)
  //    - Add "References" heading (H1)
  //    - Add spacing (1 line break)
  //    - Return position for content
}

// Update reference list content
updateReferenceList(editor, position, formattedRefs) {
  // 1. Find content after References heading
  // 2. Delete old reference list
  // 3. Insert new formatted list
  // 4. Maintain proper spacing
}

// Format references based on style
formatReferences(citations, style) {
  // Use existing citation formatters
  // Sort alphabetically
  // Number if needed (Vancouver, IEEE)
  // Return formatted string
}
```

#### 2.3 Integrate with Citation System

**Modify**: `src/app/researcher/publications/collaborate/edit/[id]/page.js`

**Changes**:
1. Add `useAutoReferences` hook
2. Enable auto-update on mount
3. Listen to citation insertion/deletion events
4. Trigger reference list update on changes

**Implementation**:
```javascript
// In main component
const {
  enableAutoUpdate,
  disableAutoUpdate,
  updateReferences,
  autoUpdateEnabled
} = useAutoReferences(editor, manuscriptId, citationStyle);

// Enable on mount
useEffect(() => {
  if (editor && autoUpdateEnabled) {
    enableAutoUpdate();
  }
  return () => disableAutoUpdate();
}, [editor, autoUpdateEnabled]);

// Listen to citation changes
useEffect(() => {
  if (!editor) return;
  
  const handleUpdate = () => {
    // Debounce to avoid too many updates
    updateReferences();
  };
  
  editor.on('update', handleUpdate);
  return () => editor.off('update', handleUpdate);
}, [editor, updateReferences]);
```

#### 2.4 Add Toggle Control

**Location**: Citation menu or toolbar

**Features**:
- Toggle auto-update on/off
- Manual refresh button
- Status indicator (auto-updating/manual)
- Settings for reference placement

### Phase 3: UI Enhancements

#### 3.1 Pagination UI
- Page number display in editor
- Page break indicators
- Page navigation (jump to page)
- Page count in status bar

#### 3.2 References UI
- Auto-update indicator
- Reference count badge
- Quick jump to references
- Reference style selector in toolbar

#### 3.3 Settings Panel
**Add to Document Settings**:
- Pagination settings
  - Enable/disable pagination
  - Page size
  - Margins
  - Page number format
- Reference settings
  - Auto-update toggle
  - Reference placement (end/custom)
  - Citation style
  - Sort order

### Phase 4: Database & API Updates

#### 4.1 Store Pagination Settings
**Table**: `Manuscript`

**New fields**:
```prisma
paginationEnabled Boolean @default(false)
pageSize String @default("A4")
pageMargins Json? // { top, right, bottom, left }
showPageNumbers Boolean @default(true)
```

#### 4.2 Store Reference Settings
**New fields**:
```prisma
autoUpdateReferences Boolean @default(true)
referencePlacement String @default("end") // end, custom
```

#### 4.3 API Endpoints
- `PATCH /api/manuscripts/[id]` - Update pagination/reference settings
- `GET /api/manuscripts/[id]/citations` - Already exists, enhance with sorting

## Technical Considerations

### Performance
- **Debounce reference updates** - Wait 2 seconds after last citation change
- **Optimize citation tracking** - Use Set for O(1) lookups
- **Lazy reference generation** - Only generate when needed
- **Cache formatted references** - Avoid re-formatting unchanged citations

### Edge Cases
1. **Multiple "References" sections** - Use first occurrence or last
2. **User deletes References heading** - Recreate on next update
3. **Manual edits to references** - Detect and warn user before overwriting
4. **Empty citation list** - Remove references section or show placeholder
5. **Citation style change** - Regenerate all references
6. **Large documents** - Virtualize pagination for performance

### User Experience
- **Non-intrusive updates** - Don't interrupt typing
- **Clear indicators** - Show when auto-updating
- **Manual override** - Allow disabling auto-update
- **Undo support** - Reference updates should be undoable
- **Conflict resolution** - Handle manual edits gracefully

## File Structure

```
/edit/[id]/
├── extensions/
│   ├── Pagination.js (NEW)
│   └── CitationMark.js (EXISTING)
├── hooks/
│   └── useAutoReferences.js (NEW)
├── utils/
│   ├── referencesManager.js (NEW)
│   └── paginationHelper.js (NEW)
├── components/
│   ├── PaginationControls.jsx (NEW)
│   └── ReferenceSettings.jsx (NEW)
└── page.js (MODIFY)
```

## Implementation Steps

### Step 1: Pagination Extension (2-3 hours)
1. Create `Pagination.js` extension
2. Add page break commands
3. Add CSS for page visualization
4. Test page break insertion

### Step 2: Pagination UI (1-2 hours)
1. Create `PaginationControls.jsx`
2. Add to toolbar/menu
3. Wire up settings
4. Test pagination toggle

### Step 3: Reference Manager Hook (3-4 hours)
1. Create `useAutoReferences.js`
2. Implement citation tracking
3. Implement reference generation
4. Test auto-update logic

### Step 4: References Manager Utility (2-3 hours)
1. Create `referencesManager.js`
2. Implement section detection
3. Implement section creation
4. Implement content update
5. Test edge cases

### Step 5: Integration (2-3 hours)
1. Integrate hook into main component
2. Connect to citation events
3. Add debouncing
4. Test full workflow

### Step 6: UI Polish (1-2 hours)
1. Add status indicators
2. Add toggle controls
3. Add settings panel
4. Test UX flow

### Step 7: Database & API (1-2 hours)
1. Update Prisma schema
2. Run migration
3. Update API endpoints
4. Test persistence

**Total Estimated Time**: 12-19 hours

## Success Criteria

### Pagination
- ✅ Pages visually separated in editor
- ✅ Page numbers displayed correctly
- ✅ Page breaks print correctly
- ✅ Settings persist across sessions
- ✅ Performance acceptable for 50+ page documents

### Auto-References
- ✅ References section created automatically
- ✅ Reference list updates when citations added
- ✅ Reference list updates when citations removed
- ✅ Proper formatting for all citation styles
- ✅ Proper spacing (heading → space → list)
- ✅ References always at document end
- ✅ No duplicate references
- ✅ Alphabetical sorting (or style-appropriate)
- ✅ Toggle auto-update works
- ✅ Manual refresh works

## Questions for User

1. **Page size preference**: Should we default to A4 or Letter?
2. **Page number format**: "Page 1 of 10" or just "1"?
3. **Reference heading**: "References" or "Bibliography" or user-configurable?
4. **Auto-update timing**: Update immediately or wait for user to stop typing?
5. **Manual edits**: Should we warn before overwriting manual edits to references?
6. **Multiple references sections**: Allow or prevent?

## Next Steps

Once you approve this plan, I will:
1. Create the pagination extension
2. Create the auto-references hook
3. Integrate both into the editor
4. Add UI controls
5. Update database schema
6. Test thoroughly

Please confirm if this approach meets your requirements or if you'd like any modifications.
