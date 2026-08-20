# 00-plan.md: Migration Plan

## Cleanup Phase (PLAN-0 -> IMPLEMENT-0)
- **Remove Imports:**
  - Delete `src/components/astryx-pilot/AstryxProvider.tsx` and `AstryxCompileProbe.tsx`.
  - Remove `AstryxProvider` from `src/routes/__root.tsx`.
- **Isolate Theme:**
  - Move `df3-theme.ts` logic entirely to `src/styles.css` under `@layer astryx-brand`.
  - Remove `@astryxdesign/core` and `@stylexjs/stylex` from `package.json` (to be done in IMPLEMENT phase).
- **Fix CSS Cascade:**
  - Standardize `--primary` to MIRATS Blue (`#0074e2`) within the Astryx theme layer.
  - Ensure `astryx-core` does not override brand colors.

## Refactoring Phase
- **Layout:** Refactor `PageFrame`, `PageHeader`, and `PageBody` to use standard Astryx typography classes (`astryx-heading-1`, etc.).
- **Buttons:** Fix the primary button state by ensuring `--primary` is derived from the brand token correctly in all layers.

## Acceptance Gates
- Zero hydration warnings in console.
- Primary buttons remain blue after state changes.
- Viewport audit at 360px, 390px, 768px, 1024px, 1440px.
