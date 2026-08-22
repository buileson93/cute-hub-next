# Phase 10F: Systematic Control Audit & RBAC Enforcement

## Audit Control Inventory

- [x] fix(incident): Wire personalization/restore controls on Dashboard (Incident Log).
- [x] fix(ocr): Implement retry action for failed OCR tasks in `ModelTaiLieu` and `ThietBiTepDinhKem`.
- [x] fix(ocr): Implement system benchmark action in OCR Admin page.
- [x] fix(graph): Enforce permission-based controls in System Tree (MindMap/TreeView/Impact Analysis) using `useCan` instead of hardcoded `canManage`.
- [x] fix(a11y): Ensure all icon-only buttons have `aria-label`.
- [ ] fix(integration): Remove decorative/placeholder "Download Extension" links if not functional.

## Implementation Details

### Incident Controls (Dashboard)
- Connected "Cá nhân hóa" and "Khôi phục" buttons to UI status tokens.
- Added `RotateCcw` button to incident table rows (visible only to managers when status is not "Mới") to restore status.

### OCR Retry & Benchmark
- Added `RefreshCcw` button for failed OCR rows in `ModelTaiLieu.tsx` and `ThietBiTepDinhKem.tsx`.
- Integrated `handleRetry` logic calling `startOcr` from `useOcrTask`.
- Implemented `Chạy Benchmark Toàn bộ` in `_app.admin.ocr.tsx` using `deviceProfiler`.

### RBAC Hardening (System Tree)
- Replaced hardcoded `isAdmin` checks with `useCan("he-thong-cay", "manage")`.
- Added `canManageNodes` prop to `TreeView` and `CayMindMap` to toggle edit controls.
- Restricted "Phân tích tác động" button in `HeThongLienKetTab.tsx` to users with management permissions.
- Added permission-gated "Chia sẻ sơ đồ" button in tree view header.

### UI Standardization
- Updated `ui-density.ts` to enforce mobile touch targets (min-h-[44px]).
- Standardized `TzClock` accessibility labels.
- Added `PERSONALIZATION` and `RESTORE` status tokens for consistent UI across dashboards.
