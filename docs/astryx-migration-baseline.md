---
name: MIRATS Astryx Safe Migration Plan (Phase 0)
description: Baseline audit and safety documentation for Astryx design system migration.
type: feature
---

# MIRATS Astryx Safe Migration Plan (Phase 0)

## Audit Baseline (P0)

### Technical Stats
- **Arbitrary Typography (`text-[...]`)**: 860 instances.
- **Hex Colors in TSX**: 114 instances.
- **Interaction States (`hover:`, `group-hover:`)**: 563 instances.
- **Animations (`animate-`, `motion`)**: 288 instances.
- **Complex UI Overlay Nodes (`Dialog`, `Sheet`, `Drawer`)**: 2143 instances.
- **Standardized Data Nodes (`StandardTable`)**: 98 instances.

### Pilot Routes Status
1. `/` (Dashboard): Verified (Hydrated).
2. `/danh-muc/thiet-bi` (Asset Catalog): Verified (Hydrated).
3. `/forms/new/SUCO` (Incident Form): Verified (Dynamic Wizard).
4. `/he-thong/$id` (System Detail): Verified (Tabs/Panels).
5. `/so-do/$id` (Diagram Editor): Verified (React Flow).

### Component Contracts
All `src/components/ui` primitives follow Radix + shadcn pattern:
- `forwardRef` support for focus management.
- `asChild` prop for slot composition.
- Tailwind class merging via `cn()`.
- Density support via `data-density` attribute on `html` / `body`.

### Risks
- **Density Regression**: Astryx must support the "Compact" (28px row) and "Spacious" (36px row) requirements.
- **Compound Components**: Dialog/Select portals must not break context when moved to Astryx primitives.
- **Motion Parity**: Existing `motion/react` transitions must be replicated or improved, not removed.
