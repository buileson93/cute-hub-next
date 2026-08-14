# Dashboard Chart UI/UX Enhancement Plan

The user reported that chart hover points on the overview dashboard are inconsistent and hard to see. This plan aims to standardize the interactive elements across all dashboard charts (Area, Bar, Line, Pie) for a more professional and readable experience.

## Proposed Changes

### 1. Standardize `VisualKpiChart.tsx`
- **Area & Line Charts**: Add visible `dot` elements on hover and active states.
- **Bar Charts**: Improve hover state visibility with better active bar highlights.
- **Tooltip Consistency**: Ensure all tooltips across different chart types use the same styling (padding, border-radius, font size, and shadow).
- **Interactive Points**: Use `activeDot={{ r: 4, strokeWidth: 0 }}` to make hover points clearly visible.

### 2. Standardize `StatusDonutChart.tsx` & `KpiCard.tsx`
- **Donut/Pie Charts**: Add a subtle "active" segment expand effect on hover.
- **Sparklines**: Add minimal hover feedback if missing.

### 3. Improve `_app.tong-quan.tsx` Charts
- Standardize the `Tooltip` component usage in the "Trend Analysis" and "Asset Status" cards to match the visual language of `VisualKpiChart`.

## Technical Details

- **Component**: `VisualKpiChart.tsx`
  - Update `Area` and `Line` components from `recharts` to use consistent `dot={false}` (idle) and `activeDot={{ r: 4, fill: 'currentColor', stroke: 'white', strokeWidth: 2 }}`.
  - Standardize `Tooltip` `cursor` styles.
- **Component**: `StatusDonutChart.tsx`
  - Ensure `Pie` has `isAnimationActive={true}` and appropriate `Tooltip`.
- **Global**: Ensure all charts use CSS variables (`hsl(var(--primary))`) rather than hardcoded hex values where possible, or ensure hex values match the semantic palette.

## User Review Required

> [!IMPORTANT]
> Do you prefer a "ghost" cursor line on hover (vertical dashed line) or just the highlighted point? Currently, some charts use a dashed cursor line. I recommend keeping it for time-series data as it helps track the X-axis.
