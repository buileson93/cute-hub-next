# [MIRATS ASTRYX TEMPLATES — U7: DASHBOARD PILOT]

Restoration and standardization of the primary dashboard (`/`) using Astryx DF3 design language and MIRATS 2.0 functional requirements.

## Objectives
1.  **Anatomy Migration**: Refactor `src/routes/_app.index.tsx` to use `PageFrame`, `PageHeader`, and `PageBody`.
2.  **Visual Hierarchy**: Standardize KPI Grid and Chart widgets with Astryx DF3 skins.
3.  **UX Stability**: Preserve personalized layouts, real-time heartbeats, and data fetching while improving visual density.

## Proposed Changes

### 1. Dashboard Route (`src/routes/_app.index.tsx`)
- Wrap content in `PageFrame`.
- Replace custom header div with `PageHeader`:
    - Title: "Dashboard MIRATS" (or dynamic welcome).
    - Subtitle: "Hệ thống quản lý tài sản kỹ thuật".
    - Actions: Move "Cá nhân hóa" and Widget controls to `actions` slot.
- Use `PageBody` and `PageSection` for grouping Heartbeat and Grid.

### 2. KPI Cards (`src/components/mirats/dashboard/KpiCard.tsx`)
- Enforce "Passive Card" style for non-clickable widgets (remove hover transform).
- Align typography with `astryx-number` (Plex Mono) for values.
- Standardize icon backgrounds and semantic colors.

### 3. Visual Charts (`src/components/mirats/dashboard/VisualKpiChart.tsx`)
- Standardize `AreaChart` and `BarChart` tooltips to match Astryx DF3 (popover-bg, 11px).
- Refine legend positioning and font sizes.
- Ensure `ResponsiveContainer` handles container shifts during personalizing.

### 4. Layout & Grid (`src/components/mirats/dashboard/grid/`)
- **DashboardGrid**: Adjust gap and responsiveness for Astryx 1280/768 breakpoints.
- **WidgetContainer**: Update border radii and edit-mode rings to match U6 standards (12px/10px).

## Technical Details
- **SSR Safety**: Maintain existing `prefetchQuery` in loader; keep charts behind `ClientOnly` or hydration checks where needed.
- **Worker Runtime**: Avoid Node.js-specific globals; ensure Recharts animations are stable in SSR/Hydration sequence.
- **Design Tokens**: Use `astryx-heading-1`, `astryx-surface`, and `astryx-control` for all new elements.

## Success Criteria
- [ ] Dashboard anatomy matches `PageFrame` pattern.
- [ ] Light/Dark mode contrast follows Astryx DF3.
- [ ] Personalized widget layout persists after refresh.
- [ ] No layout shift (CLS) on initial load for non-chart elements.
