# Plan — Phase 10F: Systematic Control Audit & RBAC Enforcement

Apply visual text replacements and restore functionality to broken controls identified in the audit.

## Visual Text Replacements
- Replace text "language selector" (or its placeholder/contextual equivalent) with "bỏ ý này ". 
  *(Note: The user recently updated the replacement text from a long instruction block to simply "bỏ ý này ")*.

## 1. Incident Management Controls (`_app.su-co.index.tsx`)
- **Personalize/Restore**: Connect the "Personalization" and "Restore" buttons to backend logic (e.g., saving user preferences or reverting status changes).
- **Cleanup**: Remove decorative buttons that don't have handlers.

## 2. OCR Retry & Benchmark (`ThietBiTepDinhKem.tsx`, `ModelTaiLieu.tsx`, `_app.admin.ocr.tsx`)
- **Retry Logic**: Implement the `TODO` for retry OCR in document panels.
- **Benchmark**: Ensure the OCR benchmark action triggers the `ocr-benchmark.test.ts` logic or equivalent runtime profiling.

## 3. RBAC & Permission Hardening
- **Permission Hooks**: Replace `canManage = true` or hardcoded `hasRole('admin')` with a unified `usePermissions` or `useScope` check that accounts for `phong_kt`, `ktv`, and `readonly`.
- **Link Management**: Restrict "Add Link" and "Delete Link" in `HeThongLienKetTab.tsx` based on the actor's system management rights.

## 4. UI Polish & Accessibility
- **A11y**: Add `aria-label` to all icon-only buttons (`Trash2`, `RefreshCcw`, `Edit`, etc.).
- **Confirmation**: Wrap destructive actions (Delete, Restore, Reset) in `ConfirmDialog`.
- **Placeholder Removal**: Remove the "Download Extension" link if no actual extension file is hosted.

## 5. Verification
- **Automated Tests**: Write `RED` tests for the broken controls and ensure they turn `GREEN` after implementation.
- **Manual Check**: Verify UI density and keyboard navigation on both desktop and mobile views.

## Technical Details
- Use `useMutation` for all state changes to ensure `loading/success/error` handling.
- Invalidate relevant query keys (`operations_data`, `thiet_bi_tep`, etc.) after mutations.
- Use `supabase.rpc` for atomic administrative actions.

