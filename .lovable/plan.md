# Plan: Software License & Asset Management Enhancement

The goal is to improve the software license assignment workflow, add comprehensive statistics for laptop-employee tracking, implement bulk import for assets with employee assignment, and provide reporting capabilities.

## Phase 1: UI Updates & Text Refinement
- Update the information banner in `src/routes/_app.phan-mem-ban-quyen.tsx` to reflect the new capabilities and roadmap as requested by the user.
- Search for any remaining placeholders (like "language selector") in `src/components/mirats/AppShell.tsx` or similar and replace them if found.

## Phase 2: Enhanced License Assignment Validation
- Modify `src/components/mirats/BanQuyenCapPhatDialog.tsx`:
    - Update `useThietBiOptions` to fetch more details about the asset (e.g., specific hardware info).
    - In `capPhatMut`, add a validation check: if the selected asset has no `nhan_vien_id`, show a clear warning or prevent saving (depending on user preference, but the request says "tự động kiểm tra... và có đủ thông tin cần thiết trước khi cho phép tôi lưu").
    - Add a visual "Validation Status" indicator in the dialog.

## Phase 3: Employee-Laptop Statistics Dashboard
- Create a new route `src/routes/_app.thong-ke.laptop.tsx`:
    - Display a grid or table of employees.
    - For each employee, show assigned laptops (assets).
    - For each laptop, show active software licenses.
    - Highlight laptops without licenses or licenses without seats.
    - Add filters for Unit (Đơn vị) and Status.

## Phase 4: Bulk Import for Assets & Employees
- Create `src/components/mirats/AssetImportDialog.tsx`:
    - Support Excel/CSV file upload.
    - One-step processing: create/update `thiet_bi` (assets) and link them to `nhan_vien` (employees) via `ma_nhan_vien`.
    - Auto-create models/categories if missing (optional/configurable).
- Integrate this dialog into `src/routes/_app.danh-muc.thiet-bi.tsx` (Asset Catalog).

## Phase 5: Reporting & Export
- Add "Export PDF/Excel" functionality:
    - In `src/routes/_app.admin.nhan-vien.tsx`: Export a report for a specific employee (Assets + Software + History).
    - In the new statistics page: Bulk export unit-level reports.
    - Use `xlsx` for Excel and a dedicated print-optimized view or server function for PDF.

## Phase 6: Navigation & Cleanup
- Update sidebar navigation in `src/lib/mirats/nav-contract.ts` to include the new Statistics route.
- Final verification of all RLS policies and grants.
