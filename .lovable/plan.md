# Project Spacing & Gutter Standardization (Phase 10W)

Establish a unified content edge and spacing strategy for the Project Workspace to ensure consistency, prevent layout regressions, and optimize readability across all breakpoints.

## User Review Required

> [!IMPORTANT]
> This plan focuses on **layout geometry and spacing**. It does not change business logic, colors, or typography.

- **Unified Gutter**: All project views (Board, Gantt, List, Timeline, Dossier, Correspondence) will align to a single content edge.
- **Scroll Ownership**: Fix horizontal overflow issues by ensuring only designated data containers (like the Kanban board) can scroll horizontally, keeping the page header and navigation fixed.
- **Responsive Handling**: Search and action bars will wrap gracefully on smaller screens without overlapping or touching the viewport edges.

## Technical Details

### 1. Route Root Refactor (`src/routes/_app.du-an.$id.tsx`)
- Wrap the main content in a `div` using `UI_DENSITY.PAGE_PADDING`.
- Remove manual `p-4 md:p-6` and `gap-4` that compete with the global density tokens.
- Implement a 3-region vertical rhythm:
  1. **Page Header**: Breadcrumbs, Title, Status.
  2. **Navigation**: Standardized 6-tab list (from Prompt 10V).
  3. **Toolbar & Content**: Search, Actions, and the active View.

### 2. Spacing Owner Consolidation
- **AppShell**: Owns the root scroll container.
- **Project Route**: Owns the page gutter (left/right padding).
- **Sub-components**: Remove double-padding from `KanbanView`, `ListView`, `GanttView`, `ProjectTimeline`, `DossierRegister`, and `CongVanPanel`.

### 3. View-Specific Geometry Adjustments
- **KanbanView**: Ensure columns don't touch viewport edges; add internal `scroll-padding`.
- **GanttView**: Fix `100vw` usage; constrain timeline within the content frame.
- **StandardTable / ListView**: Ensure sticky headers and columns don't override the page gutter.
- **Toolbar**: Use `flex-wrap` and gap tokens to prevent collision between Search and "Add Task" buttons on mobile.

### 4. Component Cleanup
- **DossierRegister.tsx**: Standardize spacing to match the main project frame.
- **CongVanPanel.tsx**: Remove `LayoutPanel` internal margins if they conflict with the project's layout padding.
- **ProjectTimeline.tsx**: Fix fixed heights that cause double scrollbars.

## Verification Plan

### Automated Tests
- **Geometry Checks**: Verify `scrollHeight <= clientHeight` on the root to ensure no vertical scrollbar within the tabs.
- **Edge Checks**: Ensure leftmost/rightmost interactive elements are at least `12px` (mobile) / `24px` (desktop) from the viewport.
- **Normalization**: Verify URL parameters correctly load and align views.

### Manual Verification (Playwright Screenshots)
- Viewports: 390px, 768px, 1024px, 1440px.
- States: Light/Dark mode, Compact/Comfortable density.
- Interactions: Horizontal scroll on Tabs and Kanban board; wrapping behavior of the Toolbar.
