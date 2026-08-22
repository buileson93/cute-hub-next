# Chart Design System Implementation (Phase 10Y)

This plan standardizes the chart visualization layer to an ERP-modern design, replacing fragmented Recharts implementations with a unified, theme-aware, and accessible `ERPChart` primitive.

## Current State Audit
- **Fragmentation**: ~10 business files import `recharts` directly with inconsistent styling, hardcoded HEX colors, and varying tooltip/legend logic.
- **Theme Issues**: Dark mode contrast is inconsistent; axis/grid colors don't always respect OKLCH tokens.
- **Contract Gaps**: Missing standardized states for "No Data", "Loading", and "Error".
- **Formatting**: Number and date formatting varies between routes; locale `vi-VN` is not globally enforced in charts.

## Proposed Design System

### 1. ERP Chart Primitives (`src/components/ui/chart.tsx`)
Expand the existing primitive to provide a high-level API for ERP charts:
- `ERPChartFrame`: Card-based wrapper with standard padding and header.
- `ERPChartHeader`: Standardized title (13-15px semibold), subtitle, and unit display.
- `ERPChartTooltip`: Semantic popover surface with tabular numerals and unit support.
- `ERPChartLegend`: Accessible series toggling and standardized markers.
- `ERPChartState`: Integrated Skeleton loading and "No Data" states.

### 2. Visual & Interaction Language
- **Plot Style**: Hairline borders, minimalist axis lines, and subtle horizontal grids. Bolder tabular numbers for axis ticks.
- **Series Palette**: Semantic tokens `var(--chart-1)` through `var(--chart-8)` using OKLCH. No hardcoded HEX.
- **Animation**: Reduced motion support (150-250ms max).
- **Responsive**: Algorithmically reduced tick count for mobile (390px) without font scaling.

### 3. Data & Formatting Contract
- **Numbers**: Unified `Intl.NumberFormat('vi-VN')` for currency, percentages, and decimals.
- **Dates**: Timezone-aware formatting; compact axis labels with full-date tooltips.
- **Null Handling**: Clear distinction between zero and missing data (no false line interpolation).

## Technical Details
- **Infrastructure**: Extend `ChartConfig` to include unit, threshold, and target line metadata.
- **Theme Sync**: Use `color-mix(in srgb, var(--token), transparent ...)` for area fills to ensure dark mode fidelity.
- **Accessiblity**: Auto-generate `aria-label` summaries and provide optional data table fallback.
- **Type Safety**: Strict props for series to prevent arbitrary style bypasses.

## Implementation Steps

### Phase 0: Foundation
- Create `src/lib/mirats/chart-formatters.ts` for unified number/date logic.
- Update `src/styles.css` with a 8-color ERP chart palette for both light and dark modes.

### Phase 1: Primitives
- Refactor `src/components/ui/chart.tsx` to include `ERPChartFrame` and formatted tooltip components.
- Implement `ERPChartEmpty` and `ERPChartLoading` with consistent geometry.

### Phase 2: Pilot Migration
- **Pilot 1**: Bar Chart in `/giay-phep` (Category comparison).
- **Pilot 2**: Time-series in `/tuoi-tho` (Trends).
- **Pilot 3**: KPI Sparklines in `DashboardGrid.tsx`.

### Phase 3: Rollout & Cleanup
- Migrate complex charts in `do-tin-cay.tsx` (Pareto, Composed).
- Remove direct `recharts` imports from business routes.
- Add ESLint rule to enforce `ERPChart` usage.

## Verification Checklist
- [ ] Visual regression tests for 390px vs 1440px.
- [ ] Contrast check (WCAG AA) for all 8 chart colors in Dark Mode.
- [ ] Verify `Intl` formatting for large currency values (Tỷ/Triệu).
- [ ] Keyboard navigation test for tooltip data points.
- [ ] Performance benchmark for 500+ data points.
