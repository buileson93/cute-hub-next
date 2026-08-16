# Widget-based Personalized Dashboard Plan

Restructuring the main dashboard and overview pages into a flexible, widget-based system that allows individual users to customize their layout (add, remove, and reorder charts/KPIs).

## User Review Required

> [!IMPORTANT]
> - Do you want the customization to be "Edit Mode" based (click 'Edit' to reorder) or always interactive?
> - Should widgets have different sizes (e.g., 1x1, 2x1, 2x2 grid units)?
> - Should we persist layouts to the database (linked to user account) or just local storage for now? (Defaulting to database via `user_layout_prefs`).

## Proposed Changes

### 1. Widget Registry
- Create `src/lib/mirats/dashboard/widget-registry.ts` to define available widgets:
  - `reliability-kpi`: Area chart for Availability.
  - `mttr-kpi`: Bar chart for MTTR.
  - `mtbf-kpi`: Line chart for MTBF.
  - `pm-kpi`: Bar chart for PM completion.
  - `su-co-trend`: Stacked bar chart for incident trends.
  - `asset-status-pie`: Pie chart for asset distribution.
  - `health-donut`: Health classification (A/B/C/D).
  - `completeness-gauge`: Data quality meter.
  - `live-timeline`: Real-time operation log.
  - `emergency-kpi`: Count of urgent incidents.

### 2. Core Components
- **DashboardGrid**: A container component that renders widgets based on a configuration array.
- **WidgetPicker**: A dialog/popover to let users select and add missing widgets to their view.
- **WidgetContainer**: A wrapper for each widget providing common controls (Remove, Drag Handle, Settings).

### 3. Personalization Logic
- Use `useUserPref("dashboard-layout", defaultLayout)` to persist the widget array.
- Implement `DnD` (Drag and Drop) using `@dnd-kit/core` or a simple array reordering mechanism.

### 4. Route Refactoring
- **src/routes/_app.index.tsx**: Replace static grid with `<DashboardGrid page="home" />`.
- **src/routes/_app.tong-quan.tsx**: Replace static grid with `<DashboardGrid page="overview" />`.

## Technical Details

- **State Management**: `useUserPref` already handles Supabase `user_layout_prefs` synchronization.
- **Responsive Layout**: Use `react-grid-layout` or a simple CSS Grid with `order` property for mobile-first responsiveness.
- **Widget Contract**:
  ```typescript
  interface DashboardWidget {
    id: string;
    type: WidgetType;
    w: number; // width in grid units
    h: number; // height
    x: number;
    y: number;
  }
  ```

## Implementation Steps
1. Define `widget-registry.ts` with component mappings.
2. Create `DashboardGrid.tsx` and `WidgetPicker.tsx`.
3. Update `_app.index.tsx` to use the new system.
4. Add "Cá nhân hoá" (Personalize) button to `PageHeader`.
