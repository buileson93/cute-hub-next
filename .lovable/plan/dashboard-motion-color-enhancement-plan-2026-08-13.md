# Dashboard Motion & Color Enhancement Plan

Add motion and colorful visual differentiators to the Dashboard (Figma-style) to improve data clarity and aesthetics.

## User Preferences

- **Motion**: Add animations to charts and data transitions (Figma-like feel).
- **Color Differentiation**: Use different colors for chart columns to distinguish data.
- **Line Charts**: Add `LineChart` variants where appropriate.
- **Data Priority**: Prioritize displaying charts with actual numerical data.

## Proposed Changes

### 1. Visual Components Enhancement

- **VisualKpiChart.tsx**:
  - Add support for `LineChart` in addition to `Area` and `Bar`.
  - Implement colorful bars (different color per column) for `type='bar'`.
  - Add entry animations for all Recharts components (`isAnimationActive`, `animationDuration`).
  - Implement a subtle "counter" animation for the main KPI number.
- **StatusDonutChart.tsx**:
  - Ensure smooth pie animations.
  - Add hover effects (scale-up) for pie segments.

### 2. Dashboard Integration

- **\_app.index.tsx** & **\_app.tong-quan.tsx**:
  - Update KPI cards to use the new `line` type where appropriate (e.g., MTBF trends).
  - Ensure trend data passing is robust (actual data prioritized).
  - Map distinct colors to bar chart columns in MTTR/PM charts.

## Technical Details

- Use `recharts` built-in animation properties.
- Use `framer-motion` for non-chart UI transitions (number counting).
- Leverage `status-tokens.ts` for semantic color mapping.

## Files to Modify

- `src/components/mirats/dashboard/VisualKpiChart.tsx`
- `src/components/mirats/dashboard/StatusDonutChart.tsx`
- `src/routes/_app.index.tsx`
- `src/routes/_app.tong-quan.tsx`
