# Editor Improvements - Session 5: Auto-References (Phase 2)

**Date**: April 25, 2026  
**Status**: ✅ Utilities Created - Integration Pending

## Overview

Implemented automatic reference list generation that updates dynamically as citations are inserted or removed from the manuscript. This completes Phase 2 of the pagination-auto-references plan.

---

## Files Created

### 1. ✅ referencesManager.js (~280 lines)

**Location**: `utils/referencesManager.js`

**Functions:**
- `findReferencesSection(editor)` - Finds existing References/Bibliography heading
- `ensureReferencesSection(editor)` - Creates References section if not found
- `extractCitationsFromDocument(editor)` - Gets all citation IDs from document
- `generateReferenceList(citations, style)` - Formats citations into reference list
- `updateReferenceList(editor, citations, style)` - Updates the References section
- `removeReferencesSection(editor)` - Removes References section when no citations

**Features:**
- Supports all 7 citation styles (APA, MLA, Chicago, Harvard, Vancouver, IEEE, AMA)
- Automatic alphabetical sorting (APA, MLA, Chicago, Harvard)
- Numbered references (Vancouver, IEEE, AMA)
- Finds or creates "References" heading at document end
- Preserves manual edits outside References section
- Clean HTML generation

---

### 2. ✅ useAutoReferences.js Hook (~170 lines)

**Location**: `hooks/useAutoReferences.js`

**Responsibilities:**
- Track citations in document
- Detect citation changes
- Fetch full citation data from database
- Trigger reference list updates
- Debounce updates (2-second delay)
- Provide manual refresh option

**API:**
```javascript
const {
  autoUpdateEnabled,      // Boolean - is auto-update on?
  enableAutoUpdate,       // Function - turn on auto-update
  disableAutoUpdate,      // Function - turn off auto-update
  manualRefresh,          // Function - force update now
  isUpdating,             // Boolean - currently updating?
  citationCount,          // Number - total citations in doc
} = useAutoReferences(editor, manuscriptId, citationStyle);
```

**Smart Features:**
- Only updates when citations actually change (not on every keystroke)
- Debounces updates to avoid performance issues
- Fetches citation data from database API
- Removes References section when no citations exist
- Tracks previous state to detect changes

---

## How It Works

### Citation Detection Flow:
```
1. User inserts citation → CitationMark added to document
2. Editor 'update' event fires
3. useAutoReferences detects change
4. Waits 2 seconds (debounce)
5. Extracts all citation IDs from document
6. Fetches full citation data from API
7. Generates formatted reference list
8. Finds/creates References section
9. Updates reference list content
```

### Reference List Generation:
```
1. Get all citations from document
2. Fetch full data (authors, title, year, etc.)
3. Sort based on style:
   - APA/MLA/Chicago/Harvard: Alphabetical by author
   - Vancouver/IEEE/AMA: Order of appearance (numbered)
4. Format each citation using existing formatters
5. Generate HTML paragraphs
6. Insert at end of document under "References" heading
```

---

## Integration Points

### Required Changes to page.js:

**1. Import the hook:**
```javascript
import { useAutoReferences } from './hooks/useAutoReferences';
```

**2. Use the hook:**
```javascript
const {
  autoUpdateEnabled,
  enableAutoUpdate,
  disableAutoUpdate,
  manualRefresh,
  isUpdating,
  citationCount,
} = useAutoReferences(editor, manuscriptId, citationStyle);
```

**3. Add UI controls:**
- Toggle in Citation menu or toolbar
- Manual refresh button
- Status indicator (updating/idle)
- Citation count badge

---

## Testing Plan

### Test 1: Basic Auto-Update
1. Open a document
2. Insert a citation
3. Wait 2 seconds
4. ✅ **Expected**: "References" section appears at end
5. ✅ **Expected**: Citation formatted correctly
6. Insert another citation
7. ✅ **Expected**: References section updates with both

### Test 2: Citation Removal
1. Document with 3 citations
2. Delete one citation from text
3. Wait 2 seconds
4. ✅ **Expected**: References section updates (only 2 citations)
5. Delete all citations
6. ✅ **Expected**: References section disappears

### Test 3: Style Changes
1. Document with citations in APA style
2. Change citation style to MLA
3. ✅ **Expected**: References reformat to MLA style
4. Change to Vancouver
5. ✅ **Expected**: References become numbered

### Test 4: Manual Refresh
1. Disable auto-update
2. Insert citations
3. ✅ **Expected**: References don't update
4. Click manual refresh
5. ✅ **Expected**: References update immediately

### Test 5: Performance
1. Insert 50+ citations
2. ✅ **Expected**: No lag or freezing
3. ✅ **Expected**: Debounce prevents excessive updates
4. ✅ **Expected**: Updates complete within 3 seconds

---

## Next Steps

**Pending:**
1. Integrate hook into page.js
2. Add toggle control to Citation menu
3. Add manual refresh button
4. Add status indicator
5. Add citation count badge
6. Test all scenarios

**Future Enhancements:**
1. Persist auto-update preference to database
2. Allow custom References section placement
3. Detect manual edits and warn before overwriting
4. Add "Insert Bibliography" command
5. Support multiple reference sections

---

## Benefits

### For Users:
- ✅ **No manual work** - references update automatically
- ✅ **Always accurate** - matches citations in document
- ✅ **Proper formatting** - uses correct citation style
- ✅ **Time-saving** - no need to maintain reference list
- ✅ **Error-free** - no missing or duplicate references

### For Developers:
- ✅ **Reusable utilities** - clean separation of concerns
- ✅ **Testable** - hook and utilities can be unit tested
- ✅ **Maintainable** - clear responsibilities
- ✅ **Extensible** - easy to add new features

---

## Technical Details

### API Endpoint Used:
```
GET /api/manuscripts/[id]/citations
```

Returns all citations for the manuscript with full data.

### Citation Styles Supported:
- APA (alphabetical)
- MLA (alphabetical)
- Chicago (alphabetical)
- Harvard (alphabetical)
- Vancouver (numbered, order of appearance)
- IEEE (numbered, order of appearance)
- AMA (numbered, order of appearance)

### Performance Optimizations:
- **Debouncing**: 2-second delay prevents excessive updates
- **Change detection**: Only updates when citations actually change
- **Set data structure**: O(1) lookups for citation tracking
- **Efficient DOM operations**: Batch updates, minimal re-renders

---

## Progress Summary

### Sessions Completed:
1. ✅ **Session 1**: Quick Wins (auto-save, debug logs)
2. ✅ **Session 2**: Error Boundaries (crash-resistant)
3. ✅ **Session 3**: Extract EditorToolbar (code organization)
4. ✅ **Session 4**: Page Count Display (pagination UX)
5. ✅ **Session 5**: Auto-References (utilities created)

### Files Created This Session:
- `utils/referencesManager.js` (~280 lines)
- `hooks/useAutoReferences.js` (~170 lines)

**Total new code**: ~450 lines of well-organized, reusable utilities! 🎉

---

## Ready for Integration

The core functionality is complete. Next step is to integrate into page.js and add UI controls. Type **"continue"** to proceed with integration!
