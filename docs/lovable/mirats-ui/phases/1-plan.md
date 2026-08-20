# Phase 1 Plan: SSR-Safe Static Astryx Foundation

## Context
Implementing Step A (SSR Safety), Step B (Static Assets), Step C (CSS Layers), and Step D (Theme) per the self-contained MIRATS context.

## Implementation Details

### Step A: Remove SSR Risks
- Audit all imports: No production components from `@astryxdesign/core` were found in `src/components/mirats` or `src/routes`.
- Remove `AstryxProvider` from `src/routes/__root.tsx`.
- Delete `src/components/astryx-pilot/` if it exists.
- Ensure `src/lib/astryx-theme/df3-theme.ts` is isolated (used only for CSS extraction).

### Step B: Static Visual Assets
Create `src/styles/astryx-static/` containing:
- `tokens.css`: Extracted from `df3-theme.ts`.
- `reset.css`: Static copy of Astryx core reset.
- `theme.css`: Logic for light/dark application.
- `components.css`: MIRATS-specific selector mapping (migrated from `astryx-component-skins.css`).
- `manifest.json`: Versioning and origin tracking.
- `LICENSE` / `NOTICE.md`: Pinned to Astryx MIT.

### Step C: CSS Layers
Unified layer order in `src/styles.css`:
`@layer reset, theme, base, astryx-base, components, utilities;`

### Step D: Theme
- Root-level `:root` and `.dark` variables in `theme.css`.
- Synchronized with MIRATS brand blue `#0074e2`.

## Verification Criteria
- `bun run typecheck` passes.
- `bun run build` succeeds.
- No hydration warnings.
- First-paint theme consistency.
