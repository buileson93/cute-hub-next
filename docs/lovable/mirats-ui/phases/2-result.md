# Phase 2: Button & IconButton Parity (Result)

## Implementation
- **Component Metadata:** Added `data-astryx-control`, `data-astryx-variant`, `data-astryx-size`, and `data-astryx-loading` to `Button.tsx`.
- **Static Styles:** Defined core control architecture in `src/styles/astryx-static/components.css`, including MIRATS Blue (#0074e2) mapping and 0.98 scale transition.
- **Pilot Routes:** Verified "Cá nhân hóa/Hoàn tất" (Dashboard) and "Thêm mẫu" (Model Catalog) using stable selectors.

## Status
- **SSR/Hydration:** Passed.
- **Visual Parity:** Matches Astryx 0.4.5 geometry.
- **Primary Color:** Verified fixed (no longer gray).
