# Plan - Correcting Text Edits & Redesigning License Management UI

The user rejected the previous text edit and now wants to redesign the Software License Management UI to be more visual, intuitive (UX/UI), and consistent with the rest of the website's features.

## Analysis
- The user corrected my previous misunderstanding: they *don't* want to change the "language selector" to that long string. They want to *design* the License Management UI properly.
- I already implemented a basic version of Software License Management (route `/phan-mem-ban-quyen`, tables, and simple forms).
- The user wants something more "visual" and "intuitive", matching the high-quality dashboard and list views of the rest of the site (e.g., using stats cards, charts, and clear relationships).

## Proposed Changes

### 1. Revert `src/components/mirats/TzClock.tsx`
- Revert the `aria-label` and `DropdownMenuLabel` to their original meaningful values ("Chọn múi giờ" and "Múi giờ hiển thị").

### 2. Enhance Software License Management UI (`src/routes/_app.phan-mem-ban-quyen.tsx`)
- Add **Stats Cards** at the top: Total Licenses, Total Value, Seats Used vs Available, Expiring Soon (30 days).
- Add a **Pie Chart** or horizontal progress bars showing seat utilization by license.
- Improve the **StandardTable** configuration:
  - Add status badges (Active, Expired, Warning).
  - Add formatting for currency (VNĐ).
  - Add a quick action button to "Assign License" (Cap phat) directly from the row.
- Ensure the overall layout uses the same pattern as `src/routes/_app.tong-quan.tsx` or `src/routes/_app.danh-muc.model.tsx`.

### 3. Update License Management Components
- `BanQuyenFormDialog.tsx`: Improve the form layout to be multi-column if needed, with better validation.
- `BanQuyenCapPhatDialog.tsx`: Add a "Search Asset" feature that shows basic asset info (Model, SN) to make assignment intuitive.

## Verification Plan
- Manually check the `/phan-mem-ban-quyen` route for the new visual elements.
- Verify the `TzClock` labels are back to normal.
- Check responsiveness of the new dashboard elements.
