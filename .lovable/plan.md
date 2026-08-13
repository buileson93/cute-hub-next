# Plan: Dashboard Visual Transformation (Figma Parity)

The user wants to replace the existing "KpiCard" collection with a more visual, chart-oriented layout inspired by the provided Figma design. This involves transforming numeric-heavy cards into richer, more graphical representations.

## User Review Required
- **Chart Types**: The Figma link shows a mix of Bar, Area, and Donut charts. I will map our current KPIs (Availability, MTTR, MTBF, PM) to similar visual formats.
- **Layout Change**: The current 4-column KPI grid will be restructured to accommodate larger charts.

## Proposed Changes

### 1. New Visual Components
- Create `src/components/mirats/dashboard/VisualKpiChart.tsx`: A flexible wrapper for larger chart-based KPIs (Area for trends, Donut for distribution).
- Create `src/components/mirats/dashboard/MetricComparison.tsx`: For "Actual vs Target" visual indicators (e.g., Availability 98% vs 99% Target).

### 2. Dashboard Restructuring (`src/routes/_app.index.tsx` & `_app.tong-quan.tsx`)
- **Tier 1 (Key Metrics)**: Instead of 4 small cards, use 2 large "Graphic KPIs" (Availability Trend Area Chart and MTTR/MTBF Comparison Bar Chart).
- **Tier 2 (Health & Status)**: Convert the simple progress bars for Health (A/B/C/D) into a Donut/Pie chart similar to the Figma "Storage" or "User" distribution blocks.
- **Tier 3 (Activity)**: Keep the `LiveTimeline` but style it with a cleaner, more spaced-out vertical line as seen in modern Admin Dashboards.

### 3. Styling Updates
- Use "Glassmorphism" or subtle gradients as seen in the Figma design (translucent backgrounds, soft shadows).
- Increase spacing (gap-6) and use consistent 12px/16px border radii.
- Standardize the color palette to match our "Semantic Levels" but with the visual weight seen in the Figma (thicker lines, glowing dots).

## Technical Details
- **Libraries**: Continue using `recharts` for performance and SSR compatibility, but use more advanced properties (gradients, custom tooltips, active dots).
- **Data Flow**: Reuse `useUnifiedDashboardStats` to ensure no regression in data accuracy.
- **Responsiveness**: Charts will use `ResponsiveContainer` and adapt from single column (mobile) to multi-column (desktop).

## Estimated Space Savings
- While this adds more "air" (whitespace), it reduces cognitive load by replacing raw numbers with visual patterns, making it easier to spot anomalies at a glance.
