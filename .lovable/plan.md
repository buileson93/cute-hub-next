# Plan: Phase 10X — Dark Mode Correctness

Fix critical readability and contrast issues in Dark Mode across the MIRATS platform by unifying theme synchronization, correcting token syntax, and migrating hardcoded surfaces.

## User Review Required

> [!IMPORTANT]
> - Ensure you have approved the backend migration for RLS roles if you haven't yet, as some theme settings might persist in user profiles.
> - The theme toggle in AppShell will now be the single source of truth for the entire application.

## Proposed Changes

### Theme Infrastructure
- **Unified Theme Synchronization**: Implement `ThemeSync.tsx` (Done) and register it in `_app.tsx` (Done) to ensure `.dark`, `data-theme="dark"`, and `color-scheme: dark` are always in sync.
- **Hook Integration**: Connect `useUserPref` to the root `<html>` element to prevent hydration flashes and inconsistent states between tabs.

### Token & Syntax Correction
- **HSL Wrapper Removal**: Bulk replace invalid `hsl(var(--token))` syntax with `var(--token)` since project tokens use OKLCH/Raw values (Done).
- **Alpha Channel Migration**: Replace HSL-based alpha hacks with `color-mix(in srgb, var(--token), transparent X%)` for modern browser compatibility and consistent rendering (Done).

### UI Component Hardening
- **Surface Migration**: Replace hardcoded `bg-white`, `bg-[#f8fafc]`, and `text-slate-900` with semantic tokens (`bg-card`, `bg-background`, `text-foreground`).
- **Contrast Optimization**: 
  - Refine `mirats-outline` variant for buttons and badges to ensure high visibility on dark backgrounds.
  - Adjust glassmorphism opacities (`bg-background/95`) in AppShell to prevent content bleed-through.
- **Auth Page Restoration**: Fix the login/signup card contrast which previously hit viewport edges with hardcoded white backgrounds.

### Table & Visualization
- **Row States**: Standardize `--table-row-hover` and `--table-row-selected` tints to use brand-aware opacities that work on both light and dark surfaces.
- **Contrast Audit**: Verify minimum 4.5:1 contrast ratio for all secondary and muted text.

## Technical Details
- **ThemeSync**: Uses `window.matchMedia` for system theme detection and `MutationObserver` or `useEffect` for state persistence.
- **CSS Layers**: Leverages `@layer astryx-brand` to ensure theme variables take precedence over legacy component styles.
- **Build Safety**: Registered new `mirats-outline` variant in `button.tsx` and `badge.tsx` to fix TypeScript errors during migration.

## Verification Plan

### Automated Checks
- `bunx tsgo`: Verify all HSL syntax is removed and no `bg-white` regressions.
- `inventory.py`: Playwright script to scan for non-semantic color strings in the live preview.

### Manual Verification
1. **Theme Switch**: Toggle between Light/Dark/System in user settings; verify immediate sync across sidebar and content.
2. **Auth Page**: Logout and verify the auth card is readable in Dark mode (no white-on-white text).
3. **Table Interaction**: Hover and select rows in `/thiet-bi`; ensure the highlight tint is visible but not overwhelming.
4. **AppShell**: Verify the top bar and sidebar borders are subtle but present.
