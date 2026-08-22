# Plan: Project Navigation Simplification & Tabs Fix (Phase 10U)

Refactor project navigation to remove experimental/incomplete tabs (Discovery, Delivery, Operations) and fix visual regressions in the `Tabs` component.

## User Review Required

> [!IMPORTANT]
> - **Discovery, Delivery, Operations** tabs will be hidden from the default view as they are currently incomplete and have 0 records in production.
> - Access via direct URL will be normalized to the **Board** view.
> - The database tables (`lean_ux_canvases`, `pitches`, etc.) will NOT be deleted at this stage.

## Proposed Changes

### 1. UI Architecture & Consistency (Phase 10U)

#### Fix Vertical Scrollbar in Tabs
- Modify `src/components/ui/tabs.tsx` to fix the geometry issue where `TabsList` displays a vertical scrollbar at certain zoom levels/breakpoints.
- Change `h-9` to `min-h-9` and ensure `overflow-y-hidden` is explicitly set when `overflow-x-auto` is active.
- Ensure focus rings are not clipped by the overflow container.

#### Project Navigation Simplification
- Modify `src/routes/_app.du-an.$id.tsx` to hide the following experimental tabs:
  - **Discovery** (Lean UX Canvas)
  - **Delivery** (Hill Charts, Pitches)
  - **Operations** (Incident monitoring)
- Update `validateSearch` to only allow supported views: `kanban`, `gantt`, `list`, `timeline`, `hoso`, `cong-van`.
- Add normalization logic to redirect legacy/invalid views to `kanban`.
- Remove unused imports related to the hidden components to reduce bundle size.

#### Tabs Label & Layout Optimization
- Maintain consistent Vietnamese labels for remaining tabs.
- Ensure the `TabsList` correctly handles horizontal scrolling on mobile without creating page-level overflow.

### 2. Technical Debt Cleanup
- Document the hidden features as `experimental/deferred` in project internal docs (not visible to end users).
- Identify and document known issues in the hidden modules (e.g., hard-coded cycles in Delivery, missing handlers in PitchEditor).

## Verification Plan

### Automated Tests
- **Geometry Test**: Verify `TabsList.scrollHeight <= TabsList.clientHeight` across viewports (390px, 768px, 1024px, 1440px) and zoom levels (100%, 125%, 200%).
- **Navigation Test**: Verify that accessing `?view=discovery` redirects to `kanban`.
- **Integrity Test**: Ensure Board, Gantt, List, Timeline, Dossier, and Documents still load correctly.

### Manual Verification
- Check for vertical scrollbar presence in dark/light mode.
- Verify horizontal scrolling on mobile (snap/padding).
- Confirm "Thêm việc" (Add task) dialog still functions correctly.
