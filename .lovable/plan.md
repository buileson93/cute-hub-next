# Plan - Reverting TzClock and Redesigning Software License Management UI

The user has explicitly requested to discard any changes to `TzClock.tsx` and focus on designing the Software License Management UI/UX to be intuitive, visual, and consistent with the rest of the website.

## Analysis
- I mistakenly modified `src/components/mirats/TzClock.tsx` based on a misunderstood request about a "language selector".
- The user confirmed that `TzClock.tsx` should remain unchanged.
- The main goal is to redesign the Software License Management feature (`/phan-mem-ban-quyen`) to match the site's high-standard UI/UX.

## Proposed Changes

### 1. Revert `src/components/mirats/TzClock.tsx`
- Restore `aria-label` to "Chọn múi giờ" (line 47).
- Restore `DropdownMenuLabel` text to "Múi giờ hiển thị" (line 65).

### 2. Redesign Software License Management Page (`src/routes/_app.phan-mem-ban-quyen.tsx`)
- Enhance the UI to be more "visual" and "intuitive" rather than just a flat table.
- **Top Summary Cards**: Add a grid of cards showing:
  - **Total Licenses**: Count of active license keys.
  - **Seat Utilization**: Global percentage of seats assigned vs total.
  - **Expiring Soon**: Count of licenses expiring within 30 days.
  - **Estimated Value**: Sum of license costs (formatted as VNĐ).
- **Visual Progress Indicators**: Use horizontal progress bars or donut charts within the table or summary section to show usage per license.
- **Improved Status Badges**: Use semantic colors and icons for Active, Expired, and Nearly Full states.
- **Refined Table Layout**: Ensure columns are well-spaced and follow the "Auto-fit" behavior established for other tables.

### 3. Update Supporting Components
- `BanQuyenFormDialog.tsx`: Improve the form layout with field grouping, clear labels, and better input validation.
- `BanQuyenCapPhatDialog.tsx`: Enhance the "Assign License" experience with a better asset search/selection UI.

## Verification Plan
- Verify `TzClock` labels are restored correctly.
- Navigate to `/phan-mem-ban-quyen` to review the new visual dashboard and table.
- Perform a smoke test of adding, assigning, and tracking a software license.
