# Plan: MIRATS Astryx — P10: Component Completion Audit (Read-Only)

This turn focuses strictly on auditing the current state of design system migration without making any code changes, as per instructions.

## 1. Environment & Base Inspection
- Detect versions of `@astryxdesign/core`, `react`, and `@stylexjs/stylex`.
- Verify CSS layer ordering in `src/styles.css`.
- Check if `AstryxProvider` (or equivalent) is correctly wrapping the application root.

## 2. Real-time Style Audit (Computed)
- Use Playwright to inspect at least 10 runtime elements across various routes.
- Extract `font-family`, `font-size`, `border-radius`, and `background-color`.
- Compare computed values against Astryx design tokens and the `vatmTheme` definition.

## 3. Component Inventory & Classification
- Search all routes for imports from `@/components/ui` (Legacy), `@/components/mirats` (Legacy), and `@/components/astryx` (New/Aligned).
- Classify components into:
    - **A**: Native Astryx components.
    - **B**: Legacy components aligned with Astryx tokens/theme.
    - **C**: Unstandardized legacy components.
    - **D**: Duplicates or orphans.

## 4. Route Coverage Verification
- Compare the physical files in `src/routes` against the tracking in `docs/astryx-route-progress.md`.
- Identify "Ghost Coverage" (routes marked as completed but still importing legacy primitives).

## 5. Output Generation
- Create `docs/astryx-component-audit.md` summarizing the findings.
- Provide a percentage-based verdict on migration progress.
- List the "Top 20 Visual Deviations" compared to the Astryx official gallery.
- Propose a prioritized roadmap for Phase 11 focusing on high-impact visual surfaces.

## Technical Notes
- **No code changes**: This plan does not include any edits to `.tsx`, `.ts`, or `.css` files (except for the audit document).
- **Tooling**: Uses `astryx` CLI, `ts-morph` (via audit scripts), and Playwright for runtime verification.
