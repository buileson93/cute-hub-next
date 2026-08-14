# Plan: Remove Redundant Count Badges from View Mode Toggle

The user wants to remove the count badges (e.g., "832") from the "Theo thành phần" and "Theo tài sản" toggle buttons in the `ThanhPhanTable` component to reduce visual clutter.

## Proposed Changes

### UI Components

#### `src/components/mirats/ThanhPhanTable.tsx`
- Remove the `<Badge>` components inside the `ModeToggle` definition (lines 416 and 426).

## Verification Plan

### Automated Tests
- No new automated tests required for this purely visual removal.

### Manual Verification
1. Navigate to the "/he-thong/thanh-phan" route.
2. Observe the "Theo thành phần" and "Theo tài sản" toggle buttons.
3. Confirm that the numeric badges are no longer visible.
4. Verify that the layout of the buttons remains clean and functional.
