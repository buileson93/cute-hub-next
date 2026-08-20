# Plan: Phase 1 — SSR-Safe Static Astryx Foundation

Implementing the SSR-safe visual foundation for MIRATS, establishing static CSS layers, and removing runtime dependencies on external component libraries to ensure stability and performance.

## Step A: Remove SSR Risks
- Remove `AstryxProvider` from `src/routes/__root.tsx` to eliminate hydration tree mismatches.
- Audit and ensure no runtime imports of `@astryxdesign/core` or `@stylexjs/stylex` exist in production components.
- Delete `src/components/astryx-pilot/` (internal probes) to keep the production bundle lean.

## Step B: Static Visual Assets
Create `src/styles/astryx-static/` containing:
- `tokens.css`: Static semantic tokens and brand overrides (Blue #0074e2).
- `reset.css`: Core Astryx CSS reset.
- `theme.css`: Root-level light/dark logic.
- `components.css`: MIRATS selector mapping (`astryx-card`, `astryx-heading`, etc.).
- `manifest.json`: Metadata for the pinned reference (Astryx 0.4.5).
- `LICENSE` & `NOTICE.md`: Preserving original attribution.

## Step C: CSS Layers & Order
Establish a unified root cascade in `src/styles.css`:
`@layer reset, theme, base, astryx-base, components, utilities;`
- This ensures brand overrides (`astryx-base`) win over vendor defaults without `!important`.

## Step D: Unified Theme Mechanism
- Map all Astryx semantic tokens to MIRATS variables.
- Ensure first-paint theme consistency via SSR-safe CSS variables on the root element.

## Acceptance Criteria
- Production build and typecheck pass.
- Zero hydration warnings in the browser console.
- MIRATS blue is correctly applied to primary controls.
- Light/Dark mode transitions are smooth without flickering.
