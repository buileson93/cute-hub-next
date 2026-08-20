---
name: Phase 3 - AppShell SSR-Safe Visual Migration
description: Implementation of the region-based shell architecture and unified anatomy.
type: feature
phase: 3
status: implemented
---

# Phase 3 Result: AppShell SSR-Safe Visual Migration

Implemented a static CSS-driven AppShell architecture that replaces legacy `UI_DENSITY` padding with a unified regional grid.

## Key Changes

### 1. Static Layout Architecture (`src/styles/astryx-static/layout.css`)
- Defined `@layer layout` to isolate structural styles.
- Established region budgets: Rail (56-72px), Sidebar (208-288px), TopBar (44-64px).
- Centralized scroll control to `.astryx-content`.
- Implemented `data-density` scaling for all shell dimensions.

### 2. AppShell Refactor (`src/components/mirats/app-shell/AppShell.tsx`)
- Integrated `data-astryx-*` semantic attributes for CSS targeting.
- Standardized the desktop navigation container (Rail + Sub-sidebar).
- Unified the TopBar and Main content area relationship.
- Removed hardcoded Tailwind padding and height classes in favor of layout tokens.

### 3. Page Anatomy Standard (`PageHeader.tsx`, `PageBody.tsx`)
- `PageHeader`: Now uses `position: sticky` and standardized padding via `data-astryx-header`.
- `PageBody`: Removed nested padding in favor of `data-astryx-body` container logic.
- Implemented `data-no-padding` support for full-width views (Dashboards, Map views).

### 4. Responsive & Density
- Mobile: Fixed bottom navigation (56px) and safe-area adjustments.
- Density: Atomic scaling between `compact`, `comfortable`, and `spacious` via `state.json` sync.

## Verification
- **SSR/Hydration**: Verified identical server/client trees.
- **Visuals**: Confirmed MIRATS Blue (#0074e2) consistency.
- **Layout**: Verified sidebar collapse logic and main scroll region.
