# MIRATS ASTRYX — P6A: CSS-FIRST FOUNDATION + DASHBOARD PILOT

## Goal
Establish a high-density, static CSS foundation using Astryx design tokens and redesign the primary dashboard (`/`) to follow the MIRATS 2.0 visual language (Stone-based, neutral canvas, hairline surfaces, numeric mono).

## Decision Matrix
| Component | Tier | Strategy | Status |
|-----------|------|----------|--------|
| Heading | A-S | Native Astryx CSS | Ready |
| Text | A-S | Native Astryx CSS | Ready |
| Card | B-S | Logic: Mirats / Visual: Astryx CSS | Implementation |
| Button | B-S | Logic: shadcn / Visual: Astryx Skin | Implementation |
| Badge | A-S | Native Astryx CSS | Ready |
| StatusDot | A-S | Native Astryx CSS | Ready |
| Dashboard | F | Full Redesign (Pilot) | Pending |

## Checkpoints
- [x] **Baseline Check**: Build successful, environment stable.
- [x] **C1: CSS Foundation**: Create `astryx-component-skins.css` and import in `styles.css`.
- [ ] **C2: Page Layout**: Apply Astryx page hierarchy to `_app.index.tsx`.
- [ ] **C3: Dashboard Redesign**: Implement Stone-themed cards and grid for KPI widgets.
- [ ] **C4: Component Skins**: Apply skins to existing dashboard controls (Buttons, Icons).
- [ ] **C5: Full Gate**: Verify SSR safety, hydration, and visual parity across resolutions.

## Technical Details
- **Token Map**: 
  - MIRATS Primary: `--primary` (OKLCH) -> `--color-accent`
  - MIRATS Borders: `var(--border)` -> Hairline 1px
  - Typography: `Montserrat` (Headings) / `Inter` (Body) / `IBM Plex Mono` (Numbers)
- **SSR Safety**: Use static CSS classes (`astryx-*`) to avoid DOM API failures during pre-rendering.
- **Density**: Enforce 4/8/12/16/24/32 spacing scale via `ui-density.ts`.
