# 00-audit.md: MIRATS SSR/Hydration & Architecture Audit

## Evidence-based Findings

### SSR/Hydration
- **Duplicate React:** Verified. System is using React 19.2.5 (React 19) consistently across dependencies. No version mismatch found.
- **Hydration Path:** TanStack Start v1 with `AstryxProvider` using a hydration guard (`hydrated` state).
- **Critical Issue:** `AstryxProvider` renders a fragment during SSR but wraps children in `Theme` from `@astryxdesign/core/theme` on the client. This causes a DOM mismatch (wrapping `div` added on client).
- **Secondary Issue:** `AstryxCompileProbe.tsx` and `AstryxProvider.tsx` import from `@astryxdesign/core` at module level, which may execute browser-only logic (e.g., `requestAnimationFrame`) during SSR.

### Visual Architecture
- **Cascade Order:** Tailwind v4 (CSS-in-JS style) -> Astryx Core (`layer(astryx-core)`) -> Astryx Theme (`layer(astryx-theme)`) -> Astryx Skins (`layer(astryx-skins)`).
- **The Gray Button Bug:** Primary buttons turn gray because `src/styles/astryx-component-skins.css` or `df3-theme.ts` maps `--color-accent` to gray values (`#262626`), and some shadcn components or Astryx skins are overriding Tailwind's `--primary` with these tokens without proper priority.
- **Layout:** High nested padding (`PageBody` -> `Card` -> `Table`). Hardcoded colors in `astryx-component-skins.css`.

## Architecture Decision
- **Move to Pure Static CSS:** Remove all runtime React imports from `@astryxdesign/core`.
- **CSS Variable Contract:** MIRATS components will consume CSS variables (`--color-accent`, etc.) defined in `src/styles.css` (Astryx layers) instead of depending on `AstryxProvider`.
- **SSR Safety:** Eliminate the hydration guard by moving theme definitions to static CSS that applies on first paint.
