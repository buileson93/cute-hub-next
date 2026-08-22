# Dashboard Data & Tooltip Enhancement Plan

Improve chart interaction aesthetics (tooltips) and add system-heavy data visualizations to the Dashboard.

## Proposed Changes

### 1. Tooltip & Interaction Enhancement

- **VisualKpiChart.tsx**:
  - Customize Recharts `<Tooltip />` with a cleaner, high-contrast design.
  - Add `cursor={{ stroke: 'hsl(var(--primary))', strokeWidth: 1 }}` to charts.
  - Format tooltip values (e.g., adding units like "%", "giờ").
- **StatusDonutChart.tsx**:
  - Improve pie chart tooltip clarity.

### 2. New Asset & System Data Charts

- **Dashboard (\_app.index.tsx)**:
  - Add a new "Asset Type Distribution" (Phân bộ loại tài sản) horizontal Bar chart.
  - Add a "System Status Heatmap" or "System Load" chart if data permits (using `scope.heThong`).
  - Increase information density for system-related metrics.
- **use-dashboard-unified.ts**:
  - Extract additional metrics for "Asset by Type" and "System Health" to support new charts.

### 3. Visual Refinement

- Ensure tooltip backgrounds use `hsl(var(--popover))` or `hsl(var(--card))` for better dark/light mode consistency.
- Add subtle shadow and border-radius to tooltip containers.

## Technical Details

- Use `recharts` custom `content` prop for Tooltips if standard styling isn't enough.
- Leverage `lucide-react` icons for chart legends.
- Maintain existing `status-tokens.ts` color usage.

## Files to Modify

- `src/components/mirats/dashboard/VisualKpiChart.tsx`
- `src/components/mirats/dashboard/StatusDonutChart.tsx`
- `src/routes/_app.index.tsx`
- `src/lib/mirats/use-dashboard-unified.ts`
