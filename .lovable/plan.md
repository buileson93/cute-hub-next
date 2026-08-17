# [MIRATS ASTRYX TEMPLATES — U11: SETTINGS/ADMIN/WORKFLOW]

## Archetype Decision & Route Checkpoints

### Batch 1: Admin Management (Table Archetype)
- **Route**: `src/routes/_app.admin.nhan-vien.tsx` (Quản lý Nhân viên)
- **Archetype**: Table Archetype (`PageFrame` -> `PageHeader` -> `PageBody` -> `StandardTable`).
- **Plan**: 
  - Refactor to use `PageFrame` (comfortable).
  - Move Search/Toolbar into a compact toolbar section below `PageHeader`.
  - Maintain `SchemaDialog` and `NhanVienSoftwareSheet` as overlays.

### Batch 2: Settings & Storage (Settings Archetype)
- **Route**: `src/routes/_app.admin.luu-tru.tsx` (Quản lý Lưu trữ / Storage)
- **Archetype**: Settings Archetype (`StartPanel` for sections, `PageBody` for config forms).
- **Plan**:
  - Implement `StartPanel` for storage providers or bucket categories if the UI supports it.
  - Use `Heading` + `description` primitives for configuration sections.

### Batch 3: Workflow/Operations (Workflow Archetype)
- **Route**: `src/routes/_app.su-co.index.tsx` (Danh sách Sự cố)
- **Archetype**: Workflow/List Archetype.
- **Plan**:
  - Transition to `PageFrame` + `StandardTable`.
  - Ensure filters/tabs are preserved and integrated into the Astryx toolbar pattern.

## UX Parity Matrix
- **RBAC**: Enforce `isAdmin` checks at the component level as currently implemented.
- **Handlers**: Keep all `useMutation` and `useQuery` logic intact.
- **Safety**: Preserve all `confirm()` calls and permission guards for destructive actions (Delete).

## Metrics & Rollback
- **Gate**: All workflows must function post-refactor (Add/Edit/Delete).
- **Rollback**: Revert individual route files to their respective `origin/main` states.
