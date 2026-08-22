# Plan: UI/UX 2.0 Expansion (Phases 8-14)

Verify and implement the expansion of the MIRATS 2.0 UI/UX plan, focusing on system-wide consistency, refactoring large components, and improving operational efficiency.

## 1. Status of Phase 8 (Visual Foundation)

- **Implemented**: `src/lib/mirats/ui/status-tokens.ts` exists and covers `TRANG_THAI`, `MUC_DO_SU_CO`, `LOAI_BAO_TRI`, and `PHUONG_AN_HONG_HOC`.
- **Remaining**:
  - Batch update ~108 files using hardcoded colors to use `StatusBadge` or `status-tokens`.
  - Enforce Dark Mode compatibility across all business domains.
  - Ensure all routes (currently ~69 missing) have `PageHeader`.

## 2. Phase 9 & 10 (System & Component Management)

- **Phase 9**: Refactor `ThanhPhanTable.tsx` (56 columns).
  - Implement `ViewPresets` to reduce default view to 8 essential columns.
  - Move technical specs to a row-expand panel.
- **Phase 10**: Refactor `src/routes/_app.he-thong.cay.tsx` (6,165 lines).
  - Split into sub-components under `src/components/mirats/he-thong-cay/`.
  - Consolidate 12 tabs into 4 focused tabs: `Hierarchical Tree`, `Flat List`, `Compatibility`, `Advanced`.
  - Implement virtualization for large trees.

## 3. Phase 11-14 (Workflow & Mobile)

- **Phase 11**: Standardize Lifecycle pages (Inspection, Life, Licenses, Handover, Supplies) using a shared `<VongDoiListPage>` template.
- **Phase 12**: Merge `_app.index` and `_app.tong-quan`.
  - `index` becomes "Today's Actions" (task-oriented).
  - `tong-quan` becomes "Long-term Trends" (analytics-oriented).
- **Phase 13**: Standardize Detail pages and implement Wizards for long forms.
- **Phase 14**: Mobile optimization for field workers (QR scanning, offline drafts, card-view for tables).

## 4. Verification & Safety Guards

- **N10 (Batch Commits)**: Split color updates into small, reviewable commits (max 15 files each).
- **N11 (Test Guard)**: Expand `ui-consistency-guard.test.ts` to cover new component paths before splitting.
- **N13 (URL Mapping)**: Implement legacy tab redirects to prevent broken bookmarks after consolidation.

## 5. Next Immediate Actions

- Start batch updating hardcoded colors in `src/routes/` using the registry.
- Begin splitting `src/routes/_app.he-thong.cay.tsx` into logical sub-components.
