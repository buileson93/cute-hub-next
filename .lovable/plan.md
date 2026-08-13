# Plan: Restore Full KPI Dashboard (tong-quan.tsx)

Restore the `/_app/tong-quan` route to its original high-density visual structure while connecting it to the new `useUnifiedDashboardStats` hook for data consistency with the home page.

## User Review Required

> [!IMPORTANT]
> The current "Full Overview" page was found to be a 30-line stub. I will restore it to the ~900 line high-density report found in the original system.

- **Data Sync**: Both the Home page and the Overview page will now show identical numbers for MTTR, MTBF, and Availability, calculated using the shared logic in `use-dashboard-unified.ts`.
- **Visuals**: I will bring back the detailed health breakdown, incident trends by month, and the operational live timeline.

## Technical Details

- **File**: `src/routes/_app.tong-quan.tsx`
- **Logic**: 
  - Switch from local stubs to `useUnifiedDashboardStats()`.
  - Re-implement the 4 main Reliability Cards (Availability, MTTR, MTBF, PM On-time).
  - Re-implement the 3 main Chart Sections (Health Distribution, Incident Trend, Asset Status).
  - Add the `HeartBeatStrip` and `LiveTimeline` components for real-time monitoring.
- **Data Dependencies**:
  - `dashboard_su_co_by_month` (RPC) for the trend chart.
  - `dashboard_asset_status` (RPC) for the status pie chart.
  - `getCompletenessStats` (Server Function) for data quality.
