# Plan: MIRATS Astryx SSR-Safe — P4: Static Brand Foundation

Apply VATM brand identity (Blue #1C51E0) by overriding Astryx Stone theme tokens with static CSS.

## Tasks

1. **Verify Stone Tokens**: Confirm exact token names from `@astryxdesign/theme-stone/dist/theme.css`.
2. **Implement Overrides**:
   - Add `@layer astryx-brand` to `src/styles.css`.
   - Override `--color-accent` and related tokens with VATM Blue `#1C51E0`.
   - Set typography to VATM standard: Inter (body), Montserrat (heading), IBM Plex Mono (numeric/code).
   - Standardize radius: 16px (container), 8px (element).
   - Fine-tune motion durations: 120ms (fast), 200ms (medium), 320ms (slow).
3. **Verify SSR Stability**:
   - Run `bun run build:dev` to ensure Nitro worker starts correctly.
   - Check preview for hydration mismatches or 500 errors.

## Technical Details

- **Method**: Option B (Static CSS Variable Overrides).
- **Scope**: Applied globally to `[data-astryx-theme="stone"]`.
- **SSR Safety**: No runtime JS injection; tokens are purely declarative in CSS.
- **Color Palettes**:
  - Primary: `#1C51E0` (Light), `#4C82FF` (Dark).
  - Warning: `#FF8F00` (Light), `#FFA726` (Dark).
