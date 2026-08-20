# Plan: Phase 7 - UI/UX Refinement & Visual Polish

Audit and fix UI/UX regressions across screen resolutions (360px to 1440px), focusing on safe areas, touch targets, overflow stability, and static motion parity.

## Proposed Changes

### 1. Static Layout & Safe Areas
- **src/styles/astryx-static/layout.css**:
    - Introduce `--astryx-safe-bottom` and `--astryx-safe-top` using `env(safe-area-inset-*)`.
    - Update `.astryx-content` padding-bottom to be `calc(var(--astryx-mobile-nav-h) + var(--astryx-safe-bottom))` on mobile.
    - Add `overscroll-behavior-y: none` to the shell to prevent "rubber-banding" on mobile during modal interactions.

### 2. Form & Control Polish (Touch Targets)
- **src/styles/astryx-static/components.css**:
    - Increase minimum touch target size for `astryx-control` on mobile viewports (< 768px) to 44px where appropriate, or increase hit-area padding.
    - Specifically, update `data-astryx-size="default"` to have a minimum height of 40px on mobile while keeping 32px on desktop.
    - Ensure `checkbox` and `switch` have expanded hit-areas using pseudo-elements (`::before`) for better touch accuracy.

### 3. Overlay & Modal Refinement
- **src/components/ui/dialog.tsx** & **src/components/ui/sheet.tsx**:
    - Add `data-astryx-region="overlay"` selectors.
    - Implement safe-area padding for fixed headers and footers in `Dialog` and `Sheet`.
    - Update `SheetContent` to be full-width (`w-full`) or `w-[92vw]` on mobile viewports (< 480px).
- **src/components/ui/select.tsx** & **src/components/ui/popover.tsx**:
    - Ensure `SelectContent` and `PopoverContent` use `astryx-surface` styles and respect viewport boundaries (no clipping).

### 4. Static Motion Migration (Framer Motion Removal)
- **src/components/mirats/app-shell/MobileNav.tsx**:
    - Remove `motion.div` for the active indicator.
    - Use a static `span` with `transition: transform` and `data-active` state.
- **src/components/mirats/app-shell/AppShell.tsx**:
    - Replace `motion` usage for sidebar/rail transitions with pure CSS transitions defined in `@layer layout`.

### 5. Accessibility & Focus
- **Global**: Ensure all `data-astryx-control` elements have proper `aria-label` when they are icon-only.
- **Modals**: Verify focus-trap behavior and focus-return to the triggering element using Radix primitives.

### 6. Performance Audit
- **StandardTable.tsx**:
    - Verify that `rowVirtualizer` uses the correct `estimateSize` based on the current `data-density` token.
    - Ensure `StandardTable` uses `content-visibility: auto` for off-screen cells where possible.

## Technical Details
- **Architecture**: All visual changes must stay within `src/styles/astryx-static/` or use `data-astryx-*` attributes.
- **Mobile Safe Areas**: Use `env(safe-area-inset-bottom, 0px)` to prevent content from being hidden behind the home indicator on iOS.
- **Motion**: CSS transitions (`cubic-bezier(0.4, 0, 0.2, 1)`) for all layout shifts.
- **Breakpoints**: Standardized at 360px (XS), 768px (MD), 1024px (LG), 1440px (XL).

## User Review Required
> [!IMPORTANT]
> The migration will replace existing `motion/react` components in the Shell and Nav with CSS-based transitions to align with the "Static Astryx" strategy. This may result in slightly less "fluid" layout animations compared to Framer Motion's layout animations, but will improve SSR stability and bundle size.
