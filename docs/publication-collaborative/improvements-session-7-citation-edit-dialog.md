# Editor Improvements - Session 7: Citation Edit Dialog

**Date**: April 25, 2026  
**Status**: ✅ Complete - Ready for Testing

## Overview

Added a comprehensive citation editing dialog that allows users to add page numbers, prefix/suffix text, and suppress author names in citations. This provides full control over citation formatting without manually editing the text.

---

## Features Added

### 1. ✅ Edit Citation Dialog Component

**File**: `components/EditCitationDialog.jsx` (new file, ~250 lines)

**Features:**
- **Page Numbers** — Single page (42) or range (42-45)
- **Prefix** — Text before citation (e.g., "see", "cf.", "see also")
- **Suffix** — Text after citation (e.g., "emphasis added", "and elsewhere")
- **Suppress Author** — Show only year (useful when author mentioned in text)
- **Live Preview** — See how citation will look before saving
- **Style-aware** — Adapts formatting to current citation style (APA, MLA, Chicago)

**UI Design:**
- Modern dialog with purple accent
- Clear field labels with help text
- Live preview box showing formatted citation
- Responsive layout
- Smooth animations

---

### 2. ✅ Updated Citation Formatting

**File**: `page.js` — `formatCitation` function (lines 547-623)

**Enhanced to support:**
- Page numbers with proper formatting per style:
  - **APA**: `(Smith, 2020, p. 42)` or `(Smith, 2020, p. 42-45)`
  - **MLA**: `(Smith 42)` or `(Smith 42-45)`
  - **Chicago**: `(Smith 2020, 42)` or `(Smith 2020, 42-45)`
- Prefix text: `(see Smith, 2020, p. 42)`
- Suffix text: `(Smith, 2020, p. 42, emphasis added)`
- Suppress author: `(2020)` when author mentioned in text

---

### 3. ✅ Integration with Hover Menu

**Updated**: `handleUpdateCitation` function (lines 594-612)

**Before**: Clicking "Edit" just refreshed the citation
**After**: Clicking "Edit" opens the Edit Citation Dialog

**Flow:**
1. Hover over citation → menu appears
2. Click "Edit" → dialog opens with current citation data
3. Add page numbers, prefix, suffix, or suppress author
4. See live preview
5. Click "Save Changes" → citation updates in document

---

## Usage Examples

### Example 1: Add Page Number
**Original**: `(Smith, 2020)`  
**After editing** (add page 42): `(Smith, 2020, p. 42)`

### Example 2: Add Page Range
**Original**: `(Jones et al., 2019)`  
**After editing** (add pages 15-18): `(Jones et al., 2019, p. 15-18)`

### Example 3: Add Prefix
**Original**: `(Brown, 2021)`  
**After editing** (add "see"): `(see Brown, 2021)`

### Example 4: Suppress Author
**Text**: "As Smith argues..."  
**Original**: `(Smith, 2020)`  
**After editing** (suppress author): `(2020)`  
**Result**: "As Smith argues (2020)..."

### Example 5: Complex Citation
**After editing**:
- Prefix: "cf."
- Page: "42-45"
- Suffix: "and elsewhere"

**Result**: `(cf. Smith, 2020, p. 42-45, and elsewhere)`

---

## Files Created/Modified

### New Files:
1. `components/EditCitationDialog.jsx` (~250 lines)
   - Dialog component with form fields
   - Live preview generation
   - Style-aware formatting

### Modified Files:
1. `page.js`
   - Added `EditCitationDialog` import (line 159)
   - Added state for dialog (lines 489-490)
   - Updated `handleUpdateCitation` to open dialog (lines 594-598)
   - Added `handleSaveEditedCitation` function (lines 600-612)
   - Enhanced `formatCitation` to handle new fields (lines 547-623)
   - Added dialog component to JSX (lines 4095-4111)

**Total changes**: 1 new file (+250 lines), page.js (+80 lines modified)

---

## Testing Instructions

### Test 1: Basic Page Number
1. Insert a citation: `(Smith, 2020)`
2. Hover over it → click "Edit"
3. ✅ **Expected**: Dialog opens
4. Enter page number: `42`
5. ✅ **Expected**: Preview shows `(Smith, 2020, p. 42)`
6. Click "Save Changes"
7. ✅ **Expected**: Citation updates in document

### Test 2: Page Range
1. Edit a citation
2. Enter page range: `15-18`
3. ✅ **Expected**: Preview shows `(Smith, 2020, p. 15-18)`
4. Save
5. ✅ **Expected**: Citation updates correctly

### Test 3: Prefix
1. Edit a citation
2. Enter prefix: `see`
3. ✅ **Expected**: Preview shows `(see Smith, 2020)`
4. Save
5. ✅ **Expected**: Citation updates

### Test 4: Suffix
1. Edit a citation
2. Enter suffix: `emphasis added`
3. ✅ **Expected**: Preview shows `(Smith, 2020, emphasis added)`
4. Save
5. ✅ **Expected**: Citation updates

### Test 5: Suppress Author
1. Edit a citation
2. Check "Suppress Author"
3. ✅ **Expected**: Preview shows `(2020)`
4. Save
5. ✅ **Expected**: Citation shows only year

### Test 6: Combined Options
1. Edit a citation
2. Add:
   - Prefix: `cf.`
   - Page: `42-45`
   - Suffix: `and elsewhere`
3. ✅ **Expected**: Preview shows `(cf. Smith, 2020, p. 42-45, and elsewhere)`
4. Save
5. ✅ **Expected**: Citation updates with all options

### Test 7: Different Styles
1. Edit citation in APA style → add page 42
2. ✅ **Expected**: `(Smith, 2020, p. 42)`
3. Change document to MLA style
4. ✅ **Expected**: Citation reformats to `(Smith 42)`
5. Change to Chicago
6. ✅ **Expected**: Citation reformats to `(Smith 2020, 42)`

### Test 8: Cancel Dialog
1. Edit a citation
2. Make changes
3. Click "Cancel"
4. ✅ **Expected**: Dialog closes, no changes applied

---

## Benefits

### For Users:
- ✅ **Full citation control** — page numbers, prefix, suffix
- ✅ **No manual editing** — dialog handles formatting
- ✅ **Live preview** — see changes before applying
- ✅ **Style-aware** — automatically formats per citation style
- ✅ **Suppress author** — useful for narrative citations
- ✅ **Easy to use** — clear labels and help text

### For Developers:
- ✅ **Reusable component** — can be used elsewhere
- ✅ **Clean separation** — dialog logic separate from page
- ✅ **Extensible** — easy to add more options
- ✅ **Type-safe** — clear prop interface

---

## Future Enhancements

Potential additions:
1. **Locator types** — chapter, section, figure, table, etc.
2. **Multiple citations** — edit several at once
3. **Citation templates** — save common configurations
4. **Keyboard shortcuts** — quick edit with Ctrl+E
5. **Batch operations** — apply page numbers to all citations from same source

---

## Session Summary

Today's improvements (Sessions 6-7):
1. ✅ Fixed citation deletion bugs
2. ✅ Redesigned citation marks (badge style)
3. ✅ Redesigned hover menu (modern + rich metadata)
4. ✅ Fixed cite-as-you-write before punctuation
5. ✅ Added auto-space after citation insertion
6. ✅ Added numbered references
7. ✅ **Added citation edit dialog with page numbers**

**Total impact**: Citations are now fully functional, beautiful, and easy to manage! 🎉
