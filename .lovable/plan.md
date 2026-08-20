---
name: CSS Foundation Audit & Fix (U4)
description: Fix redundant layer declarations, primary color conflicts, and accent token contradictions in CSS foundation.
type: feature
---

## Goals
1. Remove duplicate `@layer astryx-brand, astryx-skins;` declarations to ensure clean specificity.
2. Normalize `--primary` color to OKLCH for both light and dark modes (targeting #0074e2 equivalent).
3. Deduplicate `--primary-opacity-*` variables by removing redundant definitions in the global selector.
4. Resolve contradiction between neutral `--color-accent` in DF3 theme and blue-based `--accent` in brand foundation.

## Technical Tasks
- **Deduplication**: Remove the second `@layer astryx-brand, astryx-skins;` on line 113 of `src/styles.css`.
- **Primary Color Normalization**:
  - Calculate OKLCH for `#0074e2`: `oklch(0.58 0.18 250)` (approximate).
  - Update `src/styles.css` `:root` to use `oklch(0.58 0.18 250)` for `--primary`.
  - Update `src/styles.css` `.dark` to use the same hue for `--primary` (likely `oklch(0.65 0.18 250)` for better dark mode luminance).
- **Opacity Variable Cleanup**: Remove lines 219-222 in `src/styles.css` (selector `*` inside `@layer base`).
- **Accent Conflict Resolution**:
  - Choice A: Brand Blue accent (Primary Blue at 10% opacity).
  - Choice B: Neutral accent (Slate/Gray).
  - *Current Status*: Brand BLUE is preferred for MIRATS identity. Neutral accent in `[data-astryx-theme="df3"]` (lines 19-21) should be reviewed.

## Verification Steps
- `npm run ui:audit`: Ensure no new violations are introduced.
- Visual comparison of Dashboard, Asset Registry, and System Tree in Light/Dark modes.
- Screenshots after each point fix.
