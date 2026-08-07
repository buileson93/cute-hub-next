# Plan - Reverting Accidental Edits & Redesigning License Management UI

The user is questioning why I edited the clock component (TzClock) in response to their previous request about "language selector". They want me to stop modifying the clock and focus on the actual task: designing a high-quality Software License Management UI/UX that matches the site's current style.

## Analysis
- I mistakenly identified the "language selector" as the `TzClock` component (because of the Globe icon) and applied the user's previous request text to it.
- The user is now asking "why did you edit the clock in point 1?".
- I must immediately revert the changes to `TzClock.tsx` to restore its original functionality and text.
- I will then proceed with the main request: redesigning the Software License Management interface to be visual, intuitive, and consistent.

## Proposed Changes

### 1. Revert `src/components/mirats/TzClock.tsx`
- Restore `aria-label` to "Chọn múi giờ".
- Restore `DropdownMenuLabel` text to "Múi giờ hiển thị".

### 2. Redesign Software License Management UI (`src/routes/_app.phan-mem-ban-quyen.tsx`)
- Enhance the page with visual metrics and a better layout.
- **Top Stats Grid**:
  - Total Active Licenses (count).
  - License Capacity (Seats used / Total).
  - Upcoming Expirations (Count of licenses expiring in <30 days).
  - Total Value (formatted currency).
- **Visual Analytics Section**:
  - Add a "Usage Distribution" visual (e.g., progress bars or a simple chart) showing which software has the most seats.
- **Improved Table View**:
  - Use `StandardTable` with optimized columns.
  - Add status badges with semantic colors (Success for Active, Warning for Expiring, Destructive for Expired).
  - Include quick assignment links.

### 3. Polish Management Dialogs
- `BanQuyenFormDialog.tsx`: Improve field grouping and visual hierarchy.
- `BanQuyenCapPhatDialog.tsx`: Make the seat assignment process more intuitive with better asset selection.

## Verification Plan
- Verify `TzClock` is back to its original state.
- Navigate to `/phan-mem-ban-quyen` to review the new visual dashboard and table.
- Ensure consistency with existing MIRATS 2.0 UI components.
