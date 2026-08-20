---
name: Global Switch Component Alignment and Styling Fix
description: Correct the visual alignment and color of all Switch components throughout the application, ensuring they are centered and use the correct brand colors.
type: design
---

## Proposed Changes

### UI/UX Refinement
- **Global Alignment**: Identify and fix all `Switch` components that are visually misaligned, particularly those inside tables or lists.
- **Color Correction**: Ensure the active state of all `Switch` components uses the consistent brand green color.
- **Specific Fixes**:
  - `src/routes/_app.admin.forms.index.tsx`: Center and align the `Switch` in the "Trạng thái" column.
  - Audit other views for similar `Switch` alignment issues.

### Rationale
- The user requested to fix "the switches" (plural), indicating a need for a broader check and fix for alignment and styling of Switch components across the UI.

## Technical Details
- Files to Audit: `src/routes/_app.admin.forms.index.tsx` and any other view utilizing the `Switch` component.
- Fix: Ensure the parent container of the `Switch` (e.g., `<TableCell>`) has appropriate alignment classes (`flex items-center`, `justify-center`, or `h-full`).
- Styling: Update Tailwind classes or component variants to ensure the "green" state is consistent.
