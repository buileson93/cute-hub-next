# Plan - Stage 11: Permission Management Refactoring (Phân quyền)

Refactor `src/routes/_app.phan-quyen.tsx` to improve readability, maintainability, and user experience of the permission matrix, following the MIRATS 2.0 visual guidelines.

## 1. Verification of Previous Stages
- [x] Stage 10 (System Tree) refactoring confirmed: Monolith split into `src/components/mirats/he-thong-cay/` and logic modularized in `utils.ts`.

## 2. Stage 11: Permissions (Phân quyền) - Implementation Details

### A. Modularize the Monolith
Split `src/routes/_app.phan-quyen.tsx` into specialized components:
- `src/components/mirats/phan-quyen/RoleOverview.tsx`: Role statistics and summary cards.
- `src/components/mirats/phan-quyen/PermissionMatrix.tsx`: The core permission grid with sticky behavior.
- `src/components/mirats/phan-quyen/DistributionStats.tsx`: Account distribution by unit and data volume.
- `src/components/mirats/phan-quyen/AuditLogViewer.tsx`: Enhanced audit log table.
- `src/components/mirats/phan-quyen/SecurityPolicies.tsx`: Policy description and standards cards.

### B. Enhance Permission Matrix UX
- **Sticky Headers/Columns**: Implement sticky headers for roles and a sticky first column for collection names to maintain context when scrolling.
- **Cross-Highlighting**: Add hover effects that highlight both the current row and current column (crosshair) to improve readability of the dense grid.
- **Semantic Coloring**: Standardize "Tier" colors (Full, Edit, View, None) using theme-appropriate semantic tokens, moving away from hardcoded Tailwind classes.
- **Interactive Legend**: Allow clicking legend items to highlight corresponding cells in the matrix.

### C. Improve Audit Log & Distribution
- **Audit Detail View**: Add a sheet or dialog to view full details of an audit record, including potential "before/after" diffs.
- **Visual Distribution**: Use better progress bars or charts for unit distribution.

### D. Code Quality & Consistency
- Use `StandardTable` for the audit log consistent with other modules.
- Ensure `PageHeader` usage is consistent.
- Standardize data fetching using `useQuery` and appropriate caching.

## 3. Implementation Steps

1. **Create Directory Structure**: `src/components/mirats/phan-quyen/`.
2. **Move Types & Metadata**: Create `src/components/mirats/phan-quyen/types.ts` for shared roles/permissions metadata.
3. **Build Sub-components**: Implement extracted components one by one.
4. **Refactor Route**: Update `src/routes/_app.phan-quyen.tsx` to use the new components.
5. **Add Interactive Features**: Implement the sticky/hover logic in `PermissionMatrix`.
6. **Final Polish**: Verify dark mode and responsive behavior.
