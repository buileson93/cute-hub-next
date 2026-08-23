# Plan: UI/UX Upgrade for Data Input Forms & Testing Infrastructure

This plan implements a comprehensive UI/UX upgrade for the MIRATS data entry system, ensuring a "No Hidden Content" policy, consistent sidebar transitions on desktop (Slide from Right) vs mobile (Slide from Bottom), and establishes a robust E2E testing framework using Playwright.

## User Review Required

> [!IMPORTANT]
> - **Visual Edit**: The `aria-label` of the `TzClock` component will be updated to the requested literal string.
> - **Sidebar Behavior**: New and existing entity forms will be migrated to use `Sheet` (desktop) and `ResponsiveDialog` (mobile) to ensure consistent UX and avoid context switching.
> - **Playwright Integration**: A new `.lovable/tests/` directory will be established to store the Playwright scripts.

## Proposed Changes

### 1. UI Branding & Label Update
- Update `src/components/mirats/TzClock.tsx`: Change the `aria-label` of the top-bar clock button to the requested literal string:
  > "nâng cấp UI UX các form điền nhập liệu đảm báo không bị có nội dung bị che lắp , xem lại các tính năng thêm tài sản thêm thành phần , xoá ... chỉnh sửa đã hoạt động ok chưa áp dụng quy trình https://github.com/obra/superpowers/ để lên kế hoạch test bằng playwright trước khi kết luật , các form mẫu nhập liệu dùng sidebar để tránh gián đoạn chuyển trang , trên máy tính thì từ phải trượt vào , điện thoại tối ưu từ cưới trượt lên"

### 2. Form Architecture (No Hidden Content & Sidebar Transitions)
- **Unified Sidebar Pattern**: Ensure all entity forms (Asset/Component Create/Edit) use the `Sheet` component for Desktop (side="right") and `ResponsiveDialog` for Mobile (side="bottom").
- **Refactor `KhaiThemDialogs.tsx`**: Replace `Dialog` with `ResponsiveDialog` for "New System" and "New Component" forms.
- **Audit `ThanhPhanChiTietDialog.tsx`**: Verify the existing `Sheet` implementation handles multi-density UI correctly to prevent content occlusion.
- **Responsive Geometry**: Ensure `SheetContent` and `DialogContent` use `max-h-[90vh]` or `h-full` with internal `overflow-y-auto` to prevent scroll jumping and hidden buttons.

### 3. Feature Verification (Add/Edit/Delete)
- Rà soát (Review) and verify the "Unified Write Pipeline" for:
  - Adding new Assets (thiet_bi).
  - Adding new Components (he_thong_thanh_phan).
  - Editing properties and status.
  - Deleting/Archiving (Xóa).
- Fix any `[object Object]` regressions in error reporting or tooltips.

### 4. Playwright Testing Infrastructure (Superpowers Workflow)
- Initialize `/tmp/browser/mirats/tests/` with a base suite for:
  - `smoke.spec.ts`: Login and Dashboard availability.
  - `inventory.spec.ts`: Creating, editing, and deleting an Asset/Component.
  - `ux-integrity.spec.ts`: Verifying sidebar visibility and "No Hidden Content" on various viewports (1280px vs 375px).
- Provide a `lovable-exec` command pattern for the user to run these tests.

## Technical Details

### Components & Libraries
- **Astryx UI**: Use `Sheet` from `@/components/ui/sheet` and `ResponsiveDialog` from `@/components/mirats/ResponsiveDialog`.
- **Validation**: Zod schemas in `KhaiThemDialogs.tsx` and `ThanhPhanChiTietDialog.tsx`.
- **Testing**: Playwright (Python or Node, following the environment standards).

### File Changes
- `src/components/mirats/TzClock.tsx`: Update `aria-label`.
- `src/components/mirats/KhaiThemDialogs.tsx`: Refactor to use `ResponsiveDialog`.
- `src/components/mirats/inventory/ComponentTablePanel.tsx`: Audit for layout occlusion.
- `src/components/mirats/inventory/AssetTablePanel.tsx`: Audit for layout occlusion.
- `src/components/mirats/OperationDialog.tsx`: Verify mobile-friendly bottom-sheet transition.
- New file: `lovable-integrity.test.py` (Playwright script).
