# Restoration Plan - Table Selection & Density Optimization

The user reported that the "Select All" feature is not working and that technical component codes take up too much space in the table view. This plan addresses the selection logic and optimizes information density using hover interactions.

## Proposed Changes

### 1. Fix Table Selection Logic
- **File:** `src/components/mirats/StandardTable.tsx`
- **Change:** Update the header checkbox to use `filteredRows` (the results after search and column filters) instead of the raw `rows` prop.
- **Why:** This ensures "Select All" respects active filters and correctly reflects the current view state.

### 2. Optimize Information Density via Hover
- **File:** `src/components/mirats/ThanhPhanTable.tsx`
- **Change (Component Column):** 
  - Remove the always-visible `CodeBadge` for the component code (`ma`).
  - Wrap the component name in a tooltip (`AppTooltip`) that displays the ID.
  - Optionally show the ID in a smaller, dimmer font only when the row is hovered.
- **Change (Asset Column):**
  - Hide the technical asset ID (`thietBiMa`) by default.
  - Show the ID only on hover or within the existing `Link` title.
- **Why:** Reduces visual clutter and column width while keeping the information accessible for power users.

### 3. Verification
- Verify that clicking "Select All" selects all filtered items across all pages (if paginated).
- Verify that the table columns shrink as the technical IDs are hidden.
- Verify that the IDs are still discoverable via hover.

## Technical Details

### Selection Logic
In `StandardTable.tsx`, replace `rows` with `filteredRows` in:
```tsx
<Checkbox 
  checked={selected?.size === filteredRows.length && filteredRows.length > 0}
  onCheckedChange={(checked) => {
    if (checked) setSelected?.(new Set(filteredRows.map(getRowIdInternal)));
    else clearSelection();
  }}
/>
```

### Hover Mapping
In `ThanhPhanTable.tsx`, update the `cell` renderers for `ten` and `thietBi` columns to use `AppTooltip` for the technical IDs.

