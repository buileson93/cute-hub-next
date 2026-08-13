# Plan: Dashboard Redesign (Minimalist & Data-Driven)

Redesign the primary dashboard in `src/routes/_app.index.tsx` to follow a minimalist "Apple-like" aesthetic with reduced card clutter and increased focus on visual charts.

## Visual Direction
- **Minimalism**: Remove heavy card borders, shadows, and high-contrast semantic headers.
- **Typography**: Space Grotesk for headings, IBM Plex Mono for numeric readouts.
- **Color Palette**: oklch-based brand blue (#1D52E0) and muted semantic indicators.
- **Visuals**: Replace dense text cards with concise data visualizations (sparklines, donuts, cleaner grids).

## Proposed Changes

### 1. Header & Quick Actions
- Streamline the `PageHeader` and `Download` button area.
- Keep `HeartBeatStrip` but ensure it fits the minimal theme (already refined in previous turns).

### 2. Operational Highlights (Top Bar)
- Replace the 4 separate KPI cards (Availability, MTTR, MTBF, PM) with a unified, slim metric bar or a very clean grid.
- Use indicator dots and `font-mono` for all numbers.

### 3. Unified Operations Hub
- Merge "Hôm nay có gì đang cháy?" (Incidents) and "Tuần này phải làm gì?" (Maintenance) into a single "Operations Status" section.
- Use a split-view or a cleaner layout that highlights critical numbers without heavy card structures.

### 4. Visual Analytics Section
- Promote charts to the center.
- Convert "Phân bố sức khoẻ" (Health A/B/C/D) from progress bars to a Pie/Donut chart.
- Place it next to the "Xu hướng sự cố" (Incident Trend) bar chart in a unified "Fleet Analytics" area.
- Use the refined `MUC_DO_COLORS` and `STATUS_COLORS` (oklch palette).

### 5. Fleet Monitoring (Table)
- Clean up the "Thiết bị cần chú ý" table: remove heavy headers, use subtle row separators, and highlight the health score (A/B/C/D) with minimal circular indicators.

### 6. Personal Space
- Simplify "Khu vực của tôi" into a small footer-like section or a very compact card to reduce visual noise.

## Technical Details

### Files to Modify
- `src/routes/_app.index.tsx`: Rewrite the layout and component structure.

### Component Styling
- Use `oklch(0.55 0.20 264)` for the primary blue accent.
- Apply `font-mono` and `tabular-nums` consistently.
- Use `border-l-2` or indicator dots for status instead of full-card colored tops.
