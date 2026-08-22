# MIRATS 2.0 — Astryx UI Standard

## Architecture

- **Framework**: React 19.2 + TanStack Start v1 (Full-stack).
- **Styling**: Tailwind CSS v4 (Lightning CSS) + shadcn/ui.
- **Design System**: Astryx DF3 (Stone skin).
- **Density**: Scalable density using `data-density` attribute (compact, comfortable, spacious).

## Design Tokens

- **Typography**:
  - Headings/Body: **Figtree**.
  - Numerics: **IBM Plex Mono** (Tabular).
  - Minimum size: **11px** (Standard labels).
  - Body: **13px** (Compact).
- **Radii**:
  - Containers: `rounded-2xl` (12px) to `rounded-4xl` (20px+).
  - Elements: `rounded-xl` (10px).
- **Colors**:
  - Primary: `#0074e2` (MIRATS Blue).
  - Background: OKLCH-based semantic tokens.

## Archetypes

1. **Page Archetype**: `PageFrame` -> `PageHeader` -> `PageBody`.
2. **Table Archetype**: `StandardTable` with compact density.
3. **Detail Archetype**: `InfoGrid`, `EdgeTabs`, `astryx-card`.
4. **Specialized Archetype**: Island-based architecture for React Flow, Maps, and 3D.

## Guardrails

- **No Inline Theme**: Use `df3-theme.ts` exclusively.
- **No Hardcoded Colors**: Use CSS variables or Tailwind semantic classes.
- **Accessibility**: Use `AppTooltip` for icon-only actions. All interactive elements must have `aria-label`.
- **SSR Safety**: Use hydration guards for browser-only APIs.
