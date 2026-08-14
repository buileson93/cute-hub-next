---
name: Cleanup redundant "Manage in System Tree" button
description: Remove the "Quản lý trong cây hệ thống" button from ThanhPhanTable to avoid UI clutter and redundancy with the top-level tab bar.
type: design
---

## Problem
In `src/routes/_app.he-thong.thanh-phan.tsx`, the page already uses a `Tabs` navigation system with "Cây" and "Sơ đồ" options. The redundant "Quản lý trong cây hệ thống" button inside `ThanhPhanTable.tsx` adds unnecessary visual clutter and duplicates existing navigation functionality.

## Proposed Changes

### UI Cleanup
- **ThanhPhanTable.tsx**: Remove the `Button` with `Link to="/he-thong/cay"` and text "Quản lý trong cây hệ thống" (lines 461-465).
- Ensure the removal doesn't break the layout of the remaining header buttons (Edit Mode toggle).

## Verification Plan
1.  Navigate to `/he-thong/thanh-phan`.
2.  Verify the "Quản lý trong cây hệ thống" button is gone.
3.  Ensure the "Chỉnh sửa" / "Xong" button and mode toggle still work correctly.
4.  Confirm the top-level "Cây" tab still functions as the primary way to access the tree view.
