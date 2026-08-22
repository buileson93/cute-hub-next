# Plan: Dark Mode Correctness (Phase 10X)

Fix visual regressions and accessibility issues in Dark Mode by unifying theme controllers, correcting semantic token syntax, and migrating hardcoded light surfaces to theme-aware semantic tokens.

## User Review Required

> [!IMPORTANT]
> This plan focuses on theme foundation and correctness. professional chart styling is deferred to Phase 10Y.

- **Theme Persistence**: I will ensure theme preferences are correctly persisted in `localStorage` and synchronized across `.dark`, `data-theme="dark"`, and `color-scheme: dark`.
- **Token Syntax**: 64 instances of `hsl(var(--token))` will be corrected to `var(--token)` as the tokens contain full color values (OKLCH).
- **Hardcoded Colors**: Over 100 instances of `bg-white` and `text-slate-900` will be migrated to semantic tokens like `bg-card` and `text-foreground`.

## Proposed Changes

### Phase 0: Contrast Inventory & Reproduction
- Create a systematic inventory of all surface-text-border color pairs in both light and dark modes.
- Identify all 64 instances of invalid `hsl(var(--token))` usage.
- Capture baseline screenshots of critical routes (`/du-an`, `/tong-quan`, `/bao-cao`) in both modes.
- Write "RED" tests in `src/lib/mirats/ui/theme-integrity.test.ts` to catch:
    - Hardcoded `bg-white` on components that should be theme-aware.
    - Invalid `hsl()` wrappers on OKLCH tokens.
    - Contrast ratios below 4.5:1 for primary text in dark mode.

### Phase 1: Unified Theme Controller
- Standardize theme application in `src/routes/__root.tsx` or a new `ThemeProvider`.
- Ensure `document.documentElement` receives:
    - `.dark` class.
    - `data-theme="dark"` attribute (for compatibility with Astryx/vendor styles).
    - `style="color-scheme: dark"` CSS property.
- Implement/Fix theme switching logic to support `light | dark | system` modes with zero-flash (FOUC) prevention.

### Phase 2: Fix Token Color Syntax
- Perform a safe migration of all `hsl(var(--token))` to `var(--token)`.
- Correct alpha-channel usage by switching from HSL syntax to `color-mix(in srgb, var(--token), transparent X%)` where needed.
- Update `src/routes/_app.bao-cao.do-tin-cay.tsx` and `src/routes/_app.ban-giao.tsx` (Recharts components).

### Phase 3: Complete Dark Token Audit
- Review and refine dark mode values for all semantic tokens in `src/styles.css`.
- Ensure `card`, `popover`, `muted`, `accent`, and `border` tokens have sufficient contrast and visual hierarchy in dark mode.
- Synchronize Astryx `light-dark()` definitions in `df3-theme.ts` with shadcn-style semantic tokens.

### Phase 4: Migrate Hardcoded Light Surfaces
- Replace `bg-white` with `bg-card` or `bg-background` across the codebase.
- Replace `text-slate-900` with `text-foreground`.
- Replace `border-slate-200` with `border-border`.
- Fix specific components: `DossierRegister`, `CongVanPanel`, `LeanUXCanvas`, `HillChart`, and the `auth` page.
- Add `data-theme-fixed="light"` to areas that MUST remain light (e.g., PDF previews, signature pads).

### Phase 5: State & Accessibility
- Verify all interactive states (hover, active, focus, disabled) in dark mode.
- Ensure focus rings are visible on all background variants.
- Validate that badges and status indicators maintain their semantic meaning in dark mode without relying solely on color.

### Phase 6: Visual & Contrast Regression
- Run automated contrast checks on the migrated routes.
- Verify that theme switching does not cause layout shifts (geometry equality).
- Final UI audit to ensure 100% compliance with the "Dark Mode Correctness" contract.

## Technical Details

- **Token Syntax Correction**: OKLCH values like `oklch(0.58 0.18 250)` cannot be wrapped in `hsl()`. The fix is a direct variable reference: `fill="var(--primary)"`.
- **Theme Synchronization**:
  ```css
  :root { color-scheme: light; }
  .dark { color-scheme: dark; }
  ```
- **Canvas/SVG Color Resolution**: Use `getComputedStyle` in components that render to Canvas to resolve CSS variables at runtime when the theme changes.
- **Linting/Guards**: Add a rule to prevent future usage of `hsl(var(--...))` for semantic tokens.

## Verification Plan

### Automated Tests
- `npm run test:theme`: Custom test suite verifying token syntax and presence of theme classes.
- `npm run ui:audit`: Scan for hardcoded `bg-white` and `text-slate-900`.
- Contrast checking via Playwright/Axe.

### Manual Verification
- Switch theme and verify:
    - No white flashes on page load.
    - Dashboard charts are readable.
    - Tooltips and Popovers have correct contrast.
    - Sidebar and Header borders are visible but not harsh.
- Verify at 390px, 768px, and 1440px viewports.
