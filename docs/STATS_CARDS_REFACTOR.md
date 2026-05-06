# Statistics Cards Refactoring

## Summary

Refactored the statistics cards on two pages to match the purple background theme used in the proposals review page.

---

## Pages Updated

### 1. **Manuscripts Page**
- **URL:** `http://localhost:3000/institution/publications/manuscripts`
- **File:** `src/app/institution/publications/manuscripts/page.js`

### 2. **Proposals Page**
- **URL:** `http://localhost:3000/institution/publications/proposals`
- **File:** `src/app/institution/publications/proposals/page.js`

---

## Changes Made

### **Before (Old Style):**

```javascript
function StatCard({ label, value, sub, color }) {
  return (
    <Paper sx={{ 
      p: 2.5, 
      borderRadius: 2.5, 
      boxShadow: '0 1px 4px rgba(0,0,0,0.07)', 
      borderTop: `3px solid ${color}`, 
      flex: '1 1 0' 
    }}>
      <Typography variant="caption" sx={{ 
        fontWeight: 600, 
        color: '#6b7280', 
        textTransform: 'uppercase', 
        letterSpacing: 0.5 
      }}>
        {label}
      </Typography>
      <Typography variant="h4" sx={{ fontWeight: 800, color, mt: 0.5 }}>
        {value}
      </Typography>
      {sub && <Typography variant="caption" sx={{ color: '#9ca3af' }}>
        {sub}
      </Typography>}
    </Paper>
  );
}
```

**Characteristics:**
- White background
- Colored top border
- Gray text labels
- Colored value numbers
- Minimal styling

---

### **After (New Style):**

```javascript
function StatCard({ label, value, sub, icon }) {
  return (
    <Paper sx={{ 
      p: 2, 
      borderRadius: 2,
      bgcolor: '#8b6cbc',
      boxShadow: '0 2px 8px rgba(139, 108, 188, 0.2)',
      border: 'none',
      position: 'relative',
      overflow: 'hidden',
      height: '100px',
      flex: 1,
      minWidth: '200px',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'space-between'
    }}>
      <Box sx={{ 
        position: 'absolute', 
        top: -10, 
        right: -10, 
        width: 40, 
        height: 40, 
        bgcolor: 'rgba(255,255,255,0.1)', 
        borderRadius: '50%' 
      }} />
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Typography variant="body2" sx={{ 
          fontWeight: 500, 
          fontSize: '0.75rem', 
          color: 'rgba(255,255,255,0.8)' 
        }}>
          {label}
        </Typography>
        {icon}
      </Box>
      <Typography variant="h4" sx={{ 
        fontWeight: 700, 
        color: 'white', 
        fontSize: '1.75rem' 
      }}>
        {value}
      </Typography>
      {sub && (
        <Typography variant="caption" sx={{ 
          color: 'rgba(255,255,255,0.7)', 
          fontSize: '0.7rem' 
        }}>
          {sub}
        </Typography>
      )}
    </Paper>
  );
}
```

**Characteristics:**
- Purple background (`#8b6cbc`)
- White text throughout
- Icon in top-right corner
- Decorative circle element
- Fixed height (100px)
- Enhanced shadow
- More modern, cohesive look

---

## Visual Comparison

### **Old Style:**
```
┌─────────────────────────┐
│ TOTAL MANUSCRIPTS       │ ← Gray text
│                         │
│ 42                      │ ← Colored number
│ All submissions         │ ← Gray subtext
└─────────────────────────┘
  ↑ Colored top border
```

### **New Style:**
```
┌─────────────────────────┐
│ Total Manuscripts    📄 │ ← White text + icon
│                      ○  │ ← Decorative circle
│ 42                      │ ← Large white number
│ All submissions         │ ← Light white subtext
└─────────────────────────┘
  Purple background (#8b6cbc)
```

---

## Icons Added

### **Manuscripts Page:**
1. **Total Manuscripts** - `ArticleIcon`
2. **Draft / Ongoing** - `EditIcon`
3. **In Review / Revision** - `RateReviewIcon`
4. **Published** - `PublishedWithChangesIcon`

### **Proposals Page:**
1. **Total Proposals** - `DescriptionIcon`
2. **Drafting** - `EditNoteIcon`
3. **In Progress** - `FindInPageIcon`
4. **Approved** - `CheckCircleIcon`
5. **Rejected** - `CancelIcon`

---

## Reference Page

The styling was matched to:
- **Page:** Proposal Review
- **URL:** `http://localhost:3000/institution/proposals/review`
- **File:** `src/app/institution/proposals/review/page.js`

This page uses the same purple background cards with white text and icons.

---

## Benefits

### **Visual Consistency:**
- All institution pages now use the same card style
- Unified purple theme across the application
- Professional, modern appearance

### **Improved Readability:**
- High contrast (white on purple)
- Larger, bolder numbers
- Clear visual hierarchy

### **Better UX:**
- Icons provide quick visual recognition
- Consistent spacing and sizing
- Responsive flex layout

### **Accessibility:**
- Better color contrast ratios
- Consistent font sizing
- Clear visual indicators

---

## Testing

To verify the changes:

1. **Navigate to Manuscripts Page:**
   ```
   http://localhost:3000/institution/publications/manuscripts
   ```
   - Check that all 4 stat cards have purple backgrounds
   - Verify white text is readable
   - Confirm icons are displayed

2. **Navigate to Proposals Page:**
   ```
   http://localhost:3000/institution/publications/proposals
   ```
   - Check that all 5 stat cards have purple backgrounds
   - Verify white text is readable
   - Confirm icons are displayed

3. **Compare with Reference:**
   ```
   http://localhost:3000/institution/proposals/review
   ```
   - Verify the styling matches exactly
   - Check consistency across all three pages

---

## Technical Details

### **Color Palette:**
- **Primary Purple:** `#8b6cbc`
- **Shadow:** `rgba(139, 108, 188, 0.2)`
- **White Text:** `rgba(255,255,255,0.8)` (labels)
- **White Value:** `white` (numbers)
- **White Subtext:** `rgba(255,255,255,0.7)` (descriptions)
- **Decorative Circle:** `rgba(255,255,255,0.1)`

### **Dimensions:**
- **Height:** `100px` (fixed)
- **Min Width:** `200px`
- **Padding:** `16px` (2 * 8px)
- **Border Radius:** `8px` (2 * 4px)
- **Gap:** `20px` (2.5 * 8px)

### **Typography:**
- **Label:** `0.75rem`, weight 500
- **Value:** `1.75rem`, weight 700
- **Subtext:** `0.7rem`, default weight

---

## Files Modified

1. `src/app/institution/publications/manuscripts/page.js`
   - Updated `StatCard` component (lines 98-132)
   - Updated stat card usage (lines 210-241)

2. `src/app/institution/publications/proposals/page.js`
   - Updated `StatCard` component (lines 122-156)
   - Updated stat card usage (lines 229-266)

---

## Future Enhancements

Consider these improvements for future iterations:

1. **Gradient Backgrounds:**
   - Add subtle gradients to cards
   - Different colors per card type

2. **Animations:**
   - Hover effects
   - Number count-up animations
   - Icon animations

3. **Interactive Features:**
   - Click to filter by that stat
   - Tooltips with more details
   - Trend indicators (↑↓)

4. **Responsive Design:**
   - Adjust card size on mobile
   - Stack vertically on small screens
   - Optimize icon sizes

5. **Reusable Component:**
   - Extract to shared component
   - Add to component library
   - Document in Storybook

---

## Conclusion

The statistics cards have been successfully refactored to match the institution-wide purple theme. The new design provides better visual consistency, improved readability, and a more modern appearance across all institution pages.
