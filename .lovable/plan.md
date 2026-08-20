---
name: Fix Switch Component Styling and Alignment
description: Correct the visual alignment and color of the Switch component in the Admin Forms table to match the MIRATS green brand standard and fix layout shifts.
type: design
---

## Proposed Changes

### UI/UX Refinement
- Fix the **Switch** component in `src/routes/_app.admin.forms.index.tsx` within the table cells.
- **Color**: Ensure the active state uses the project's standard green color (typically `#22c55e` or equivalent semantic token) instead of the current grey/primary.
- **Alignment**: Fix the vertical/horizontal alignment issue where the switch looks "off-center" or "shifted" (lệch) within the table row.
- **Standardization**: Apply consistent padding and centering to the status column to prevent visual drift.

### Rationale
- The user pointed out that the Switch component in the "Trạng thái" column is visually misaligned and lacks the proper green color when active.

## Technical Details
- File: `src/routes/_app.admin.forms.index.tsx`
- Targeted element: `<Switch>` inside the table body (line 202).
- Styling: Add centering classes (`flex justify-center` or `text-center`) to the `<TableCell>` containing the switch.
- Theme: Verify `index.css` or component props for green active state.
