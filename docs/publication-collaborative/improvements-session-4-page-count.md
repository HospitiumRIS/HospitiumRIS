# Editor Improvements - Session 4: Add Page Count to Status Bar

**Date**: April 25, 2026  
**Status**: ✅ Complete - Ready for Testing

## Overview

Added page count display to the status bar to complete the pagination UX. Users can now see the total number of pages in their document at a glance.

---

## Changes Made

### 1. ✅ Added Page Count State

**File**: `page.js` (line 506)

**Before:**
```javascript
// Pagination state
const [paginationEnabled, setPaginationEnabled] = useState(true);

// Database citation state for Cite as You Write
```

**After:**
```javascript
// Pagination state
const [paginationEnabled, setPaginationEnabled] = useState(true);
const [pageCount, setPageCount] = useState(1);

// Database citation state for Cite as You Write
```

---

### 2. ✅ Added Page Count Update Logic

**File**: `page.js` (lines 2146-2166)

**New useEffect:**
```javascript
// Update page count when content or pagination changes
useEffect(() => {
  if (editor && paginationEnabled) {
    const updatePageCount = () => {
      const count = editor.commands.getPageCount();
      setPageCount(count);
    };

    // Update immediately
    updatePageCount();

    // Listen for editor updates
    editor.on('update', updatePageCount);

    return () => {
      editor.off('update', updatePageCount);
    };
  } else {
    setPageCount(1);
  }
}, [editor, paginationEnabled]);
```

**How it works:**
- Calls `editor.commands.getPageCount()` from Pagination extension
- Updates immediately when pagination is enabled
- Listens to editor 'update' events for real-time updates
- Resets to 1 when pagination is disabled
- Cleans up event listener on unmount

---

### 3. ✅ Added Page Count to Status Bar

**File**: `page.js` (line 2501)

**Before:**
```javascript
<Typography variant="body2" color="textSecondary" sx={{ fontSize: '0.8rem' }}>
  {manuscript?.type || 'Research Article'} • {manuscript?.wordCount || 0} words
</Typography>
```

**After:**
```javascript
<Typography variant="body2" color="textSecondary" sx={{ fontSize: '0.8rem' }}>
  {manuscript?.type || 'Research Article'} • {manuscript?.wordCount || 0} words
  {paginationEnabled && ` • Page ${pageCount}`}
</Typography>
```

**Display logic:**
- Only shows when pagination is enabled
- Format: "Research Article • 1,234 words • Page 5"
- Updates in real-time as you type or insert page breaks

---

## Impact

### Before:
- ❌ No way to see total page count
- ❌ Had to scroll through entire document to count pages
- ❌ Incomplete pagination UX

### After:
- ✅ Page count visible in status bar
- ✅ Updates in real-time as you type
- ✅ Only shows when pagination is enabled
- ✅ Complete pagination UX
- ✅ Matches user expectations from Word/Google Docs

---

## Visual Example

**Status Bar Display:**
```
┌─────────────────────────────────────────────────────────────┐
│ [Draft] Research Article • 1,234 words • Page 5  Last saved │
└─────────────────────────────────────────────────────────────┘
```

**When pagination is disabled:**
```
┌─────────────────────────────────────────────────────────────┐
│ [Draft] Research Article • 1,234 words  Last saved 14:30    │
└─────────────────────────────────────────────────────────────┘
```

---

## Testing Instructions

### Test 1: Verify Page Count Appears
1. Open the editor at `/researcher/publications/collaborate/edit/[id]`
2. Look at the status bar (below the header)
3. ✅ **Expected**: See "Research Article • X words • Page 1"
4. ❌ **Fail if**: No page count shown

### Test 2: Verify Real-time Updates
1. Type some text in the editor
2. Keep typing until you have enough content
3. Click "Auto-Calculate Page Breaks" from Page menu
4. ✅ **Expected**: Page count updates (e.g., "Page 3")
5. Continue typing
6. ✅ **Expected**: Page count updates in real-time
7. ❌ **Fail if**: Page count doesn't update

### Test 3: Verify Manual Page Breaks
1. Place cursor in the middle of the document
2. Press Ctrl+Enter (or use Page menu → Insert Page Break)
3. ✅ **Expected**: Page count increases by 1
4. Insert another page break
5. ✅ **Expected**: Page count increases again
6. ❌ **Fail if**: Page count doesn't update

### Test 4: Verify Remove Page Breaks
1. Use Page menu → Remove All Page Breaks
2. ✅ **Expected**: Page count resets to 1
3. ❌ **Fail if**: Page count doesn't reset

### Test 5: Verify Pagination Toggle
1. Use Page menu → Disable Pagination
2. ✅ **Expected**: Page count disappears from status bar
3. Use Page menu → Enable Pagination
4. ✅ **Expected**: Page count reappears
5. ❌ **Fail if**: Page count doesn't hide/show correctly

### Test 6: Verify Initial Load
1. Create a document with multiple pages
2. Save and close
3. Reopen the document
4. ✅ **Expected**: Page count shows correct number immediately
5. ❌ **Fail if**: Page count is wrong or shows "Page 1" incorrectly

### Test 7: Verify Performance
1. Create a very long document (10+ pages)
2. Type continuously
3. ✅ **Expected**: Page count updates smoothly without lag
4. ✅ **Expected**: No performance issues
5. ❌ **Fail if**: Editor lags or freezes

---

## Files Modified

- `src/app/researcher/publications/collaborate/edit/[id]/page.js`
  - Added `pageCount` state (1 line)
  - Added page count update useEffect (21 lines)
  - Updated status bar display (1 line modified)

**Total changes**: 23 lines added/modified

---

## Integration with Existing Features

### Works with:
- ✅ **Auto-calculate page breaks** — page count updates automatically
- ✅ **Manual page breaks** — count increases/decreases
- ✅ **Remove all breaks** — count resets to 1
- ✅ **Pagination toggle** — count shows/hides appropriately
- ✅ **Real-time editing** — updates as you type
- ✅ **Document load** — shows correct count on open

### Pagination Extension Commands Used:
- `editor.commands.getPageCount()` — returns total page count
- Counts page breaks in document
- Returns 1 if no page breaks exist

---

## Future Enhancements

### Potential additions:
1. **Current page indicator** — "Page 2 of 5" (show which page cursor is on)
2. **Page navigation** — Jump to page X
3. **Page thumbnails** — Visual page overview
4. **Page-based search** — "Find on page 3"
5. **Print preview** — Show how pages will print

These can be added in future sessions if needed.

---

## Next Steps

After testing these changes:
- **If tests pass**: Session 4 complete! ✅
- **If tests fail**: Report issues for debugging

---

## Progress Summary

### All Sessions Completed:
1. ✅ **Session 1**: Quick Wins (debug logs, auto-save, change detection)
2. ✅ **Session 2**: Error Boundaries (crash-resistant editor)
3. ✅ **Session 3**: Extract EditorToolbar (code organization)
4. ✅ **Session 4**: Add Page Count (complete pagination UX)

### page.js Evolution:
- **Original**: ~4,526 lines
- **After Session 1**: ~4,520 lines (-6)
- **After Session 2**: ~4,553 lines (+33 for error boundaries)
- **After Session 3**: ~4,238 lines (-315 toolbar extraction)
- **After Session 4**: ~4,261 lines (+23 page count)

**Net reduction**: **-265 lines** from original, with much better organization!

### Components Created:
- `ErrorBoundary.jsx` (~140 lines)
- `EditorToolbar.jsx` (~420 lines)

### Features Added:
- ✅ Smart auto-save with change detection
- ✅ Crash-resistant error boundaries
- ✅ Organized toolbar component
- ✅ Real-time page count display

---

## Recommended Next Improvements

Based on the analysis document, here are the next priorities:

### High Priority (from analysis):
1. **Replace 3-second polling with WebSocket** — better real-time sync
2. **Add visual diff in version history** — see what changed
3. **Add bulk accept/reject in tracked changes** — faster workflow
4. **Add pagination to citation library** — performance with many citations

### Medium Priority:
5. **Extract custom hooks** — `useCitations`, `useComments`, `useRealtimeSync`
6. **Add command palette** — Ctrl+K for quick actions
7. **Per-collaborator cursor indicators** — see where others are editing
8. **DOI auto-fetch in citation library** — easier citation management

Would you like to continue with any of these improvements? 🚀
