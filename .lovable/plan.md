# Plan: Optimize Table Density and Alignment in System Components

The user pointed out that the alignment issue persists in the "Components & Assets" table (`/he-thong/thanh-phan`) and requested a more compact UI by reducing whitespace and removing redundant selection status text ("tất cả chưa gắn", etc.). I will refine the alignment in the `StandardTable` component and clean up the `ThanhPhanTable` toolbar.

## Proposed Changes

### 1. `src/components/mirats/StandardTable.tsx` (Alignment Fix)
- **Refine Checkbox Column**: Adjust the `TableHead` and `TableCell` for the checkbox column to ensure perfect centering and vertical alignment.
- **Header Padding**: Standardize the height and vertical alignment of headers to match the row density levels (`compact`, `comfortable`, `spacious`).

### 2. `src/components/mirats/ThanhPhanTable.tsx` (UI Density & Cleanup)
- **Remove Redundant Selection Text**: The user specifically requested removing the secondary selection/filter text (e.g., "tất cả chưa gắn", "đúng 1", etc.) which is currently displayed alongside the filters or in the toolbar labels.
- **Tighten Toolbar**: Reduce margins and gaps in the toolbar to maximize vertical space for data.
- **Standardize Pagination**: Ensure the pagination controls are as compact as possible.

## Technical Details
- In `StandardTable.tsx`, I'll check the `h-full` and `flex items-center` classes on the checkbox containers to ensure they respect the dynamic row height.
- In `ThanhPhanTable.tsx`, I will remove redundant labels like "Số thành phần:", "đã lắp tài sản:", and ensure the "Bucket" filter for asset attachment counts is clear but minimal.

## Verification Plan
- Navigate to `/he-thong/thanh-phan` in the preview.
- Verify the header checkbox is perfectly aligned with row checkboxes.
- Verify the toolbar is cleaner and more compact, without redundant text labels.
- Check that different density modes (via density toggle if applicable) maintain alignment.
