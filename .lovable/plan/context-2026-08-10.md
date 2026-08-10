---
name: Sidebar Layout and Icon Fix
description: Address icon overlapping in sidebar and restore the original sidebar layout logic.
type: feature
---

## Context
The user reports that sidebar icons are overlapping ("chồng lấn") and requests to restore the "old sidebar layout" because the current one is not reasonable.
The current `AppShell` has two asides:
1.  **Primary Rail (left)**: `w-16` (64px), contains workspace icons.
2.  **Sub-sidebar (right)**: `w-64` (256px) or `w-[3.25rem]` (52px), contains menu links, expands on hover.

The overlap issue likely occurs in the **Primary Rail** because `w-16` (64px) might be too tight for `w-[54px]` buttons if padding or margins are slightly off, or in the **Sub-sidebar** when collapsed to 52px.
Specifically, `Sidebar.tsx` uses `gap-3` and `px-3` normally, but `justify-center px-0` when collapsed. If icons are 20px (`h-5 w-5`) or 16px (`h-4 w-4`), they should fit, but the "overlap" might refer to vertical spacing or the transition between the two sidebars.

The user mentions "sidebar cũ là hợp lý" (old sidebar was reasonable). In MIRATS 2.0, the "old" way was usually a single sidebar or a more integrated rail-sidebar combo.

## Proposed Changes

### 1. AppShell Layout Refinement
- Adjust the **Primary Rail** to ensure icons don't overlap and have clear boundaries.
- Refine the **Sub-sidebar** transition and width.
- The user feels the "hover-to-expand" might be contributing to the "messy" feel or "overlapping" if not handled correctly with the primary rail.

### 2. Sidebar Component (Sidebar.tsx)
- Improve the `collapsed` state rendering.
- Ensure tooltips don't conflict.
- Check if vertical spacing `gap-1.5` (rail) or `space-y-1` (sidebar) is too tight.

### 3. Investigation & Fix
- Check the "old layout" references in memory or codebase if any.
- The `itemPositions` from the previous JS execution showed:
    - Rail icons are at `left: 21.5`. Width is 64px. Icon width is 20px. Center is 32. `21.5 + 10 = 31.5`. They are centered.
    - Vertical positions: 90, 143, 197, 251, 305. Gap is ~53.8px. `54px` buttons are touching or overlapping if there's any overflow.
    - The rail uses `gap-1.5` (6px) but the buttons are `w-[54px]`.

## Plan
1.  **Visual Fix**: Increase vertical spacing in the Rail and Sidebar to prevent "overlapping" feel.
2.  **Layout Restoration**: The user might be referring to the single-sidebar approach or the specific way the rail and sub-sidebar interact. I will adjust the sub-sidebar to be more "attached" to the rail and improve the transition.
3.  **Refine Hover Logic**: Ensure the hover state doesn't cause layout shifts that look like "overlapping".

I will start by adjusting the spacing and checking for overflow.
