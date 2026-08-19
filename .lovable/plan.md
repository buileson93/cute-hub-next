---
name: Standardize TreeView Node Heights and Alignment
description: Standardize the height and horizontal alignment of tree nodes in the Life History TreeView to ensure visual consistency across different levels and node types.
type: design
---

## Goals
- Ensure all tree nodes have consistent vertical alignment regardless of their content or depth.
- Fix the issue where tree item "boxes" (hoverable areas) have inconsistent widths or alignments.
- Align icons and labels across different nesting levels.

## Implementation Details
- **Consistent Height**: Set a fixed height or min-height for node rows (e.g., `h-8` or `h-9`) to prevent layout shifts.
- **Icon Alignment**: Use a standardized container width for tree expansion arrows and node icons (e.g., `w-6`) to keep text labels aligned vertically.
- **Nesting Logic**: Adjust the left margin/padding strategy to use a consistent indentation per level (e.g., `20px` per level) instead of varying `ml-*` classes.
- **Badge Standardization**: Fix the width of count badges to prevent them from pushing other elements or causing alignment issues.
- **Action Buttons**: Ensure "ghost" buttons on the right do not affect the row height and remain vertically centered.

## Technical Tasks
- Refactor `renderNode` in `src/components/mirats/so-ly-lich/TreeView.tsx`.
- Replace conditional `ml-4` with a dynamic `style={{ paddingLeft: level * 20 }}` or consistent Tailwind padding.
- Standardize icon wrappers to `w-5` or `w-6` with flex-center.
- Ensure the row container `astryx-control` has a fixed height and `items-center`.
