# Plan: Astryx Design System Color & Contrast Standardization

Standardize the application UI according to Astryx design principles (based on https://astryx.atmeta.com/templates) to resolve overlapping colors, poor contrast, and visual clutter.

## User Review Required

> [!IMPORTANT]
> The current color scheme uses a mix of standard Tailwind colors and Astryx Stone tokens, leading to contrast issues in Dark Mode. I will migrate everything to a unified oklch-based semantic palette.

## Proposed Changes

### 1. Global Theme Foundation (`src/styles.css`)
- Refactor `:root` and `.dark` variables to use Astryx Stone semantic naming.
- Ensure all color definitions use `oklch` for consistent luminance across light/dark modes.
- Fix overlapping background/card colors by increasing surface separation (e.g., using `oklch` lightness steps).
- Standardize border contrast ratios (minimum 4.5:1 for accessibility where functional).

### 2. Component Skin Refinement (`src/styles/astryx-component-skins.css`)
- Update `.astryx-card` to use standardized shadows and subtle border-active states.
- Refine `.astryx-table-row` hover and selection states to avoid text-overlapping visual noise.
- Fix `.astryx-status-*` tokens to use Astryx-standard status colors (Info Blue, Success Green, Warning Amber, Danger Red).

### 3. Contrast & Visibility Audit
- Audit `StandardTable.tsx` and `CatalogTable.tsx` to ensure text readability over status-colored backgrounds.
- Fix "color layering" in the Dashboard (`_app.index.tsx`) where multiple card-like components might be nested.

## Technical Details

- **Palette Mapping**:
  - Background: `oklch(1 0 0)` (Light) / `oklch(0.12 0.01 260)` (Dark)
  - Surface (Cards/Popovers): `oklch(0.98 0.005 260)` (Light) / `oklch(0.18 0.01 260)` (Dark)
  - Contrast: Minimum 10% lightness difference between parent background and nested surface.
- **Tools**: Use `oklch()` CSS function exclusively to ensure predictable color mixing.
- **Consistency**: All manual `hex` codes found in the previous audit will be replaced by these standardized tokens.

## Verification Plan

- **Visual QA**: Check Dashboard, Equipment List, and System Tree in both Light and Dark modes.
- **Accessibility**: Run lighthouse/a11y check for color contrast.
- **Build**: Ensure no regression in Tailwind v4 compilation.
