# Plan - Visual Text Edits & Redesigning License Management UI

The user has corrected the text edit request again. They want to change the "language selector" (which is actually the timezone clock `TzClock`) to "vì sao lại có múi giờ ở đây" and then proceed with the plan to redesign the Software License Management UI.

## Analysis
- The user is questioning the presence of the timezone clock ("Why is there a timezone here?") and wants that reflected in the text/label.
- The user also wants to "thiết kế giao diện UI UX để quản lý phần mềm bản quyền trực quan đồng bộ với các menu giao diện tính năng khác của website" (design the Software License Management UI/UX to be visual and consistent with other features).

## Proposed Changes

### 1. Correct `src/components/mirats/TzClock.tsx`
- Revert the long string I added in the previous turn.
- Change `aria-label` to "vì sao lại có múi giờ ở đây".
- Change the `DropdownMenuLabel` text from the long string to "vì sao lại có múi giờ ở đây".

### 2. Redesign Software License Management UI (`src/routes/_app.phan-mem-ban-quyen.tsx`)
- Enhance the License Management page with a more "visual" dashboard-like feel.
- Add **Summary Stats Cards** at the top:
  - Total Active Licenses
  - Seats Used / Total Capacity
  - Expiring Soon (< 30 days)
  - Estimated Annual Cost
- Add **Visual Elements**:
  - A donut chart or progress bars for seat utilization per license.
  - Better status indicators (Badges with colors for Active, Expired, Nearly Full).
- Refine the **StandardTable**:
  - Add formatting for dates (expiry).
  - Add clear action buttons for management.
- Ensure the layout matches the high-standard UI of other MIRATS 2.0 pages (like Dashboard or Asset Detail).

### 3. Improve Related Components
- `BanQuyenFormDialog.tsx`: Clean up the form fields, add tooltips for "Seats", and ensure a modern visual flow.
- `BanQuyenCapPhatDialog.tsx`: Make the assignment process more visual, perhaps showing the target computer/server details.

## Verification Plan
- Manually check the topbar clock to see the updated text "vì sao lại có múi giờ ở đây".
- Navigate to `/phan-mem-ban-quyen` to review the new visual design and ensure it meets the "intuitive and consistent" requirement.
- Verify the hydration mismatch error in `AtcTowerScene.tsx` is not exacerbated, although it's a separate issue I should keep an eye on.
