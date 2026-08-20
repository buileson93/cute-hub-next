# Plan: Phase 3 — AppShell SSR-Safe Visual Migration

Establish a high-performance, visual-only AppShell architecture following Astryx 0.4.5 standards. This phase refactors layout regions, scroll behaviors, and responsive density without altering React logic or TanStack Router integration.

## 1. Structural Audit & Region Budgets

### Desktop (1280px+)
- **Logo/Rail (Fixed):** 56px (Compact) / 64px (Comfortable).
- **Sub-Sidebar (Transition):** 0px (Collapsed) to 208px (Compact) / 256px (Comfortable).
- **TopBar (Sticky):** 44px (Compact) / 56px (Comfortable).
- **Main Region:** 100% Flex-1, Single-scroll viewport.

### Mobile (360px - 390px)
- **TopBar:** 44px (Compact).
- **Bottom Navigation:** 56px (Safe-area aware).
- **Sidebar:** Full-width Drawer (86vw).
- **Padding:** 12px (360px) to 16px (390px+).

## 2. Technical Strategy

### CSS Regions (astryx-static/layout.css)
- Implement `@layer layout` to define `.astryx-shell`, `.astryx-rail`, `.astryx-sidebar`, and `.astryx-content`.
- Use `display: grid` for the main shell to ensure stable layout shifts during sidebar transitions.
- Eliminate nested `overflow-y-auto`. Target **one main scroll region** per archetype.

### Padding & Gap Reductions
- Standardize `PageHeader` padding to Astryx Stone spec: `12px 16px` (Compact).
- Reduce `PageBody` gap from `24px` to `16px` (standard) or `8px` (dense).
- Standardize `PageHeader` border to `var(--color-border)`.

### Selector Strategy
- Add `data-astryx-layout` to `AppShell.tsx`.
- Add `data-astryx-region` to Rail, Sidebar, and Content.
- Use `data-density` (synced to `state.json`) for CSS-based scaling.

## 3. Proposed Changes

### src/components/mirats/app-shell/AppShell.tsx
- Refactor the JSX tree to use semantic regions.
- Ensure `main` is the only scrollable element for standard pages.
- Add `data-astryx-layout` attributes.

### src/styles/astryx-static/layout.css (New)
- Define the grid/flex architecture.
- Handle Z-index stack (Rail: 30, TopBar: 20, Sidebar: 10).
- Implement hardware-accelerated transitions for the sidebar.

### src/components/mirats/PageHeader.tsx & PageBody.tsx
- Remove legacy `UI_DENSITY` utility classes in favor of `data-astryx-` attributes and static CSS.
- Implement `data-astryx-header` and `data-astryx-body`.

## 4. Verification & Testing

### Visual Parity
- **360px Mobile:** Verify no horizontal overflow; check `safe-area-inset-bottom` for `MobileNav`.
- **Desktop Sidebar:** Verify 200ms ease-in-out transition without "jumpy" content.

### SSR & Hydration
- Verify `data-density` is correctly injected in `RootShell` to prevent FOUC (Flash of Unstyled Content).
- Confirm zero hydration mismatches on `/auth` and `/dashboard`.

### Regression
- **Focus:** Tab through TopBar (Search -> Notifications -> User).
- **Navigation:** Click Rail item -> Sidebar updates -> Main content scrolls to top.

## 5. Metadata Update
- Create `docs/lovable/mirats-ui/phases/3-plan.md`.
- Update `state.json` (activePhase: 3).
