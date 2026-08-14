# Plan: Fix Table Header Checkbox Alignment

The "Select All" checkbox in the table header is misaligned with the row checkboxes because of the "Toggle Column Reorder" icon appearing next to it. I will fix this by moving the reorder toggle button to the main toolbar, ensuring the checkbox column remains clean and perfectly aligned across all rows.

## Proposed Changes

### 1. `src/components/mirats/StandardTable.tsx`
- **Modify TableHeader**: Remove the `internalReorder` toggle button from the `TableHead` of the checkbox column (around line 1245).
- **Update Toolbar**: Add the `internalReorder` toggle button to the table's top toolbar, near the "Column Settings" and "Auto Fit" buttons (around line 985).
- **Style Cleanup**: Adjust the layout of the checkbox column header to be a simple flex container that centers the checkbox, matching the row cells.

## Technical Details
- The current implementation puts both the `<Checkbox />` and the `<Button />` (GripVertical icon) in a `flex gap-1` container inside the `TableHead`. This shifts the checkbox off-center.
- By moving the button to the `toolbarRight` area, we maintain the functionality while restoring visual alignment.
- The `internalReorder` state is already defined in the component scope, so it remains accessible to the toolbar area.

## Verification Plan
- Inspect the table header in the preview.
- Confirm the "Select All" checkbox is perfectly centered and vertically aligned with row checkboxes.
- Confirm the "Toggle Reorder" button is present in the toolbar and functions correctly (it should enable/disable the drag handles on column headers).
