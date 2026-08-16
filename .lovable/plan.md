# Plan - Widget-based Personalized Dashboard

Implement a widget-based system for the Overview and Dashboard pages, allowing users to add, remove, and reorder charts and cards. Preferences will be persisted per-user using the existing `useUserPref` hook.

## User Review Required

> [!IMPORTANT]
> The widget system will use a flexible grid (Tailwind Grid). Should we support manual drag-and-drop resizing, or is a fixed-width grid (e.g., 1-column, 2-column, or full-width widgets) sufficient for the first version?

- **Default Layout**: We will preserve the current "Figma-style" KPI layout as the default state for all users.
- **Persistence**: Changes will be saved to the database via `user_layout_prefs` (automatically handled by `useUserPref`).

## Proposed Changes

### Dashboard Infrastructure
- Create `src/lib/mirats/dashboard/widget-registry.ts` to define available widgets (Reliability, MTTR, MTBF, PM, Health, Timeline, etc.).
- Each widget entry will include a unique ID, default size (span), and a render function or component reference.

### Components
#### `src/components/mirats/dashboard/DashboardGrid.tsx`
- A container that renders a list of active widget IDs.
- Implements "Edit Mode" where widgets show "Remove" buttons and an "Add Widget" trigger appears.
- Supports reordering (initially via simple "Move Up/Down" or basic drag-and-drop if library available).

#### `src/components/mirats/dashboard/WidgetPicker.tsx`
- A Dialog or Popover allowing users to select from the registry to add new widgets to their dashboard.

### Dashboard Routes
#### `src/routes/_app.tong-quan.tsx` & `src/routes/_app.index.tsx`
- Refactor to use `DashboardGrid` instead of hardcoded layouts.
- Use `useUserPref('dashboard:widgets', defaultWidgetList)` to manage the state.
- Add a "Personalize" (Cá nhân hóa) button to the `PageHeader` actions.

## Technical Details
- **State Schema**: `string[]` (list of widget IDs) or `Array<{ id: string, w: number }>` for varying widths.
- **Rendering**: Dynamic lookup in `widgetRegistry` by ID.
- **Consistency**: Ensure `useUnifiedDashboardStats` continues to provide data efficiently without over-fetching when widgets are hidden.

## Quality Assurance
- Verify that a user's layout is preserved after page refresh.
- Test "Reset to Default" functionality.
- Ensure "Edit Mode" is only accessible to authorized users if needed, though the request implies per-user personalization for all.
