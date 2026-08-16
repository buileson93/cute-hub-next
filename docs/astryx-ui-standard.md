# MIRATS Astryx UI Standards & Guidelines

This document defines the visual and interaction standards for MIRATS 2.0 following the migration to the Astryx Design System.

## 1. Core Principles
- **Semantic First**: Always use semantic tokens (`bg-surface`, `text-primary`) rather than hardcoded hex codes or functional colors.
- **Density Optimized**: UI components must support `data-density` tokens (Compact, Comfortable, Spacious) defined in `src/lib/mirats/ui/ui-density.ts`.
- **Accessibility by Design**: Every interactive element must have appropriate ARIA labels, focus states, and pass contrast audits.

## 2. Component Decision Matrix

| Component Type | Preferred Implementation | Reason |
| :--- | :--- | :--- |
| **Page Layout** | `MiratsPageHeader`, `MiratsPageBody` | Centralized breadcrumb and action management. |
| **Basic Inputs** | `MiratsInput`, `MiratsSelector` | Standardized padding, borders, and focus rings. |
| **Buttons** | `MiratsButton`, `MiratsIconButton` | Automatic loading states and tooltip integration. |
| **Cards** | `MiratsCard` | Unified border-radius and shadow tokens. |
| **Tables** | `StandardTable` (Radix based) | Retained for performance and virtualization requirements; themed via Astryx classes. |
| **Overlays** | Legacy Radix (`Dialog`, `Sheet`) | Retained to preserve complex focus and portal logic; themed via Astryx classes. |

## 3. Typography & Spacing
- Use `MiratsTypography` components (`MiratsHeading`, `MiratsText`).
- **Never** use arbitrary spacing (e.g., `mt-[13px]`). Use Tailwind spacing scale or tokens from `UI_DENSITY`.
- **Contrast**: Maintain a minimum contrast ratio of 4.5:1 for body text against backgrounds.

## 4. Motion & Transitions
- Layout transitions use `framer-motion` (or `motion/react`) via `PageTransition.tsx`.
- Sidebar and interactive elements use `astryx-transition-standard` for timing consistency.
- Respect `prefers-reduced-motion` settings in all custom animations.

## 5. Visual Guardrails (Linting)
- **Forbidden**: Hardcoded hex colors (e.g., `#FFFFFF`).
- **Forbidden**: Inline `style={{ ... }}` for layout or colors.
- **Forbidden**: Raw `<div>` for semantic sections (use `mirats-section` or `MiratsCard`).

## 6. Process for Adding New Components
1. Search Astryx Playbook via CLI: `bunx astryx search "<query>"`.
2. Check if a `Mirats*` wrapper exists in `src/components/astryx/`.
3. If not, create a thin wrapper that maps MIRATS business logic to the Astryx component.
4. Verify accessibility and density support before deployment.
