# Plan: Astryx Visual Foundation Clean-up (Phase 1)

Establish the core visual foundation for the Astryx design system integration, standardising typography, colors, and UI density tokens across the project.

## User Review Required

> [!IMPORTANT]
> This phase performs a large-scale codemod of arbitrary typography and colors. While automated, it may require visual verification of layout-sensitive areas.

- **Typography**: Are there any specific components where the mapped 6 levels (meta to display) might be too restrictive?
- **Color Mapping**: I will map existing raw palette classes to the 5 semantic statuses (info, progress, success, attention, neutral). If a specific color usage doesn't fit these, it will be mapped to `muted` or `primary` as appropriate.

## Proposed Changes

### 1. Typography Foundation
- **`src/styles.css`**:
  - Define `--font-display` (Space Grotesk), `--font-sans` (Inter), and `--font-mono` (IBM Plex Mono).
  - Standardise global `@theme` variables for typography.
- **`src/lib/mirats/ui/typography.ts`**:
  - Create a utility file exporting 6 standard tiers: `meta` (11px), `bodySm` (12px), `body` (14px), `title` (16px), `pageTitle` (20px), `display` (24px).
- **Global Codemod**:
  - Replace `text-[9px]` through `text-[11px]` with `meta`.
  - Replace `text-[12px]` with `bodySm`.
  - Replace `text-[13px]` and `text-[14px]` with `body`.
  - Update `Button` (size="xs") to use the `meta` tier instead of hardcoded `10px`.

### 2. Color & Status Standardisation
- **`src/styles.css`**: Add missing semantic tokens if any raw hex codes in `.tsx` don't have a variable counterpart.
- **Global Clean-up**:
  - Identify and replace all literal hex codes (`#RRGGBB`) in `.tsx` files with CSS variables (e.g., `var(--primary)`).
  - Replace raw Tailwind palette classes (e.g., `bg-blue-100`, `text-amber-700`) with semantic tokens (`bg-info/10`, `text-attention`) in core components and pilot routes.
- **Components to Update**: `StatusBadge.tsx`, `StandardTable.tsx`, `PageHeader.tsx`, `src/components/ui/*`.

### 3. UI Density Activation
- **`src/components/mirats/app-shell/AppShell.tsx`**: Ensure `data-density` is correctly applied to the root element.
- **`src/components/mirats/DensityToggle.tsx`** (or equivalent): Wire up the toggle to update the `ui-density` preference and reflect immediately in the UI.
- **`src/components/mirats/StandardTable.tsx`**: Ensure `density-compact` variant correctly reduces row heights to the standardised 28px (compact) vs 32px (comfortable).

### 4. Parity Verification
- Maintain existing motion durations (120/200/320ms) and easing functions.
- Ensure all interaction states (hover, active, disabled) remain functional and visually consistent.
- Generate a parity report documenting the reduction in technical debt (arbitrary classes vs semantic tokens).

## Technical Details
- **Tooling**: Use `ripgrep` for discovery and `sed`/`ts-morph`-like replacements for the codemod.
- **Verification**: Run `bun run build` and `tsc` to ensure no regressions.
- **Pilot Routes for Deep Review**:
  - `_app.index.tsx` (Dashboard)
  - `_app.danh-muc.thiet-bi.tsx` (Catalog)
  - `_app.forms.new.$code.tsx` (Forms)
  - `_app.he-thong.$id.tsx` (Details)
  - `_app.so-do.$id.tsx` (Diagrams)
