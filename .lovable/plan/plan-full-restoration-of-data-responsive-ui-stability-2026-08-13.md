# Plan: Full Restoration of Data & Responsive UI Stability

The user is experiencing two main issues: a data limit (capped at 1000 records) and a layout that "breaks" when the sidebar is toggled (responsive logic not reacting to container changes, and badges wrapping poorly).

## Proposed Changes

### 1. Data Count Restoration
- **`src/components/mirats/ThanhPhanTable.tsx`**
  - Update `useThanhPhanRows` to use `fetchAllRows` with `.range()` to bypass the 1000 record limit.
  - Update `useTaiSanRows` to use `fetchAllRows` for full asset lists.
  - This will fix the "Why only 1000?" complaint and correctly show counts like "1180" or "832".

### 2. UI Stability & Responsive Fixes
- **`src/components/mirats/StandardTable.tsx`**
  - Implement a `ResizeObserver` on the table's `parentRef`.
  - Replace `vw` (window width) with `containerWidth`. This ensures that when the sidebar expands/collapses, columns hide/show correctly based on the *actual space available* to the table, not the whole window.
  - This addresses the "layout breaks when sliding sidebar" issue.
- **`src/components/mirats/ThanhPhanTable.tsx`**
  - Fix `ModeToggle`: Add `flex-nowrap`, `shrink-0` to buttons, and `whitespace-nowrap` to prevent badges (like "827 tài sản") from wrapping or breaking the layout.
  - Fix `PageHeader`: Ensure the description doesn't push the "Chỉnh sửa" buttons off-screen on narrow viewports.

### 3. Mindmap Geometry Safeguards
- **`src/components/mirats/he-thong-cay/CayMindMap.tsx`**
  - Add explicit guards in the recursive layout logic to prevent `NaN` coordinates (e.g., if a height or spacing value is missing).
  - Ensure `fitView` is only called when coordinates are finite.

## Technical Details
- **Pagination**: Using `fetchAllRows` from `@/lib/mirats/paginate` with a `supabase.rpc().range(from, to)` wrapper.
- **Container Queries**: Since we are using React, `ResizeObserver` is the standard way to implement "container queries" for individual components that need to be aware of their parent's width (like a sidebar-responsive table).

## Verification Plan
1. **Data Count**: Check the badges in the toggle; they should show >1000 if the database has them.
2. **Sidebar Toggle**: Collapse/expand the sidebar; verify that columns in `StandardTable` show/hide correctly and the table doesn't overflow horizontally.
3. **Badge Wrapping**: Shrink the viewport; verify that "Theo thành phần" and "Theo tài sản" buttons stay on one line and the badges don't "break".
4. **Mindmap**: Open the "Sơ đồ" tab and verify the layout renders cleanly.
