# Plan: [U11P] Project/Work Bug Audit + Astryx Kanban/Gantt

Redesign the project and task management interface to follow the Astryx design system while fixing critical functional bugs in permissions, cache, and date handling.

## User Review Required

> [!IMPORTANT]
> The plan introduces a more strict permission model. Assignees who are not managers or project owners may lose "Delete" access to tasks if the RLS/RPC `can_edit_cong_viec` is enforced strictly.

- **Kanban Drag & Drop**: Initial rollout will focus on visual parity. Drag-and-drop persistence will be implemented in a follow-up step once the order schema is verified.
- **Unified Work View**: We are standardizing the _visual_ language for PM and Maintenance tasks, but the database tables remain separate to preserve data integrity.

## Proposed Changes

### 1. Bug Fixes & Data Integrity (C0-C3)

- **Timezone Fix**: Replace `new Date().toISOString()` with `getTodayDateString()` from `src/lib/mirats/calendar-date.ts` to fix Asia/Saigon offset errors.
- **Permission Guard**: Update `EditCongViecDialog` to fetch exact capabilities from `can_edit_cong_viec` RPC instead of local role-based guessing.
- **Cache Invalidation**: Update `toggleCollab` and task mutations to invalidate specific project and collaboration query keys.
- **Realtime Sync**: Add `du_an_cong_viec` and `du_an_moc` to `CORE_TABLES` in `useGlobalRealtime.ts`.

### 2. Astryx UI Standardization (C4-C7)

- **Page Header & Toolbar**: Implement `LayoutHeader` with breadcrumbs and a unified `Toolbar` (Search, Filter, View Selector) in `src/routes/_app.du-an.$id.tsx`.
- **Kanban Redesign**:
  - Standardized 300px columns with `StatusDot` and count badges.
  - Cards following Astryx anatomy: Ref code, priority, 2-line description, and metadata.
  - Implementation of `EmptyState` and loading skeletons.
- **Gantt Enhancement**:
  - Map Frappe-Gantt styles to Astryx semantic tokens.
  - Fix "fake dates" by showing an "Unscheduled" list for items missing start/end dates.
  - Localized Vietnamese labels.

### 3. Work Domain Mapping (C8)

- **PM Queue Fix**: Fix stat calculations in `/bao-tri/pm` to reflect the full dataset, not just the filtered tab.
- **Domain Map**: Create `docs/work-domain-map.md` to document the separate lifecycles of Project Tasks, Maintenance Orders, and PM Work.

## Technical Details

- **Worker Safety**: Frappe-Gantt and Astryx pointer-heavy components will remain dynamic imports or local islands to ensure Worker SSR stability.
- **URL State**: View mode (Kanban/Gantt/List) and search/filter parameters will be synchronized with TanStack Router search params.
- **Realtime**: `useGlobalRealtime` will be optimized to handle project-specific invalidations without flooding the connection.

## Validation Plan

- **Automated Tests**: Add integration tests for project permissions and date range validation.
- **Visual Audit**: Compare rendered Kanban/Gantt against Astryx official templates at 1280px and 390px viewports.
- **SSR Check**: Verify that `LayoutHeader` and `Toolbar` render in the initial HTML before hydration.
