# Plan: MIRATS UI/UX Migration (PLAN-0 Audit)

Audit the rolled-back MIRATS source for an SSR-safe Astryx visual migration using the existing React component library.

## Audit Findings

### SSR & Hydration
- **Root Cause:** The `AstryxProvider` uses a hydration guard that renders a plain fragment on the server and a `div.astryx-client-mode` on the client. This causes a mandatory hydration mismatch warning on every page load.
- **Dependencies:** React 19 is correctly deduped across the tree. `tanstack_start_ts` is the base framework.
- **Node-Incompatibility:** `@astryxdesign/core` is imported at module level in several files, which can lead to runtime crashes in Cloudflare Workers if the library uses browser-only APIs like `requestAnimationFrame` outside of effect hooks.

### Visual Architecture
- **CSS Layers:** The project uses Tailwind v4 with `@layer` for Astryx core, theme, and skins.
- **Primary Button Bug:** Primary buttons turn gray after state changes because `--color-accent` (mapped to gray `#262626` in `df3-theme.ts`) overrides the brand primary color in the CSS cascade for certain components.
- **Density:** Current layout has excessive nested padding and inconsistent spacing tokens.

## Proposed Strategy (IMPLEMENT-0)

### 1. Decouple from Runtime Astryx
- Remove `AstryxProvider.tsx` and all React component imports from `@astryxdesign/core`.
- Shift theme application from a React Provider to static CSS layers in `src/styles.css`.
- Ensure brand colors (`--primary`) take precedence over generic theme accents.

### 2. Standardize Anatomy
- Refactor `PageFrame`, `PageHeader`, and `PageBody` to follow the archetypes identified in the audit (Tracker, Dashboard, Form).
- Implement responsive contracts for 360px, 390px, 768px, 1024px, and 1440px.

### 3. Structural Integrity
- Eliminate hydration warnings by ensuring server and client render the exact same DOM tree.
- Remove all "Manifesto" and "Manifest" text from the user-facing UI.

## Artifacts Generated
- `00-audit.md`: Evidence of root causes (hydration, gray buttons).
- `00-plan.md`: Step-by-step refactoring plan.
- `00-inventory.json`: Metadata about routes and packages.
- `00-ssr-baseline.json`: Current state of hydration warnings.
- `00-css-cascade.md`: Analysis of style priority.
- `00-route-matrix.md`: Prioritized list of routes for migration.
- `docs/lovable/mirats-ui/state.json`: Migration state tracker.

## Technical Details
- **Environment:** Bun, React 19, TanStack Start, Tailwind v4.
- **CSS Strategy:** Native CSS `@layer` and semantic tokens.
- **Target:** 100% parity with MIRATS logic, 100% fidelity to Astryx visuals.
