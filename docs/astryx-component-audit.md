# MIRATS Astryx — P10: Component Completion Audit

This audit evaluates the current state of Astryx design system adoption in MIRATS 2.0.

## Executive Verdict: MỘT PHẦN (PARTIAL) Standardized

- **Astryx Native Coverage (A)**: ~5% (Mostly in pilot routes and experimental UI Kit)
- **Aligned Coverage (A+B)**: ~25% (Wrappers exist for buttons/inputs, but adoption is low)
- **Unstandardized (C)**: ~70% (Significant legacy imports in production routes)
- **Dead/Duplicate (D)**: ~5% (Some orphaned MIRATS components detected in P9)

**Summary**: The foundation (Theme, CSS Layers, Wrappers) is solid and high quality. However, the "last mile" of rollout to the 109 routes is just beginning. Most routes still import directly from `@/components/ui/*` (shadcn) or legacy `@/components/mirats/*`.

---

## A. Design System Foundation

| Layer | Status | Evidence |
| :--- | :--- | :--- |
| **CSS Layers** | **VERIFIED** | `src/styles.css` uses `@layer reset, theme, base, astryx-base, astryx-theme...` |
| **Theme Provider** | **MOUNTED** | `astryx_mounted: true` detected at runtime. |
| **Theme Object** | **CUSTOM (VATM)** | `vatmTheme` defined in `theme-vatm.ts` with #1C51E0 accent. |
| **StyleX** | **READY** | `@stylexjs/stylex: 0.19.0` installed. |

---

## B. Actual Font Audit (Computed at Runtime)

| Element | Computed Font Family | Astryx Target | Match |
| :--- | :--- | :--- | :--- |
| **Body** | `Inter, "Inter var", ...` | `--font-family-body` | ✅ |
| **Heading** | `Inter...` (System Default) | `Space Grotesk` | ❌ (1) |
| **Numbers** | `Inter...` | `IBM Plex Mono` | ❌ (2) |
| **Button** | `Inter, ...` | `Inter` | ✅ |
| **Sidebar Item** | `Inter, ...` | `Inter` | ✅ |

*(1) Headings in most routes are currently `h1`, `h2` or `div` with Tailwind classes, bypassing `MiratsTypography` which uses Space Grotesk.*
*(2) `tabular-nums` class is applied in CSS but computed style shows Inter inherited from body in sampled elements.*

---

## C. Component Matrix (Sampling)

| Category | Component | Call-site Count | A/B/C/D | Findings / Actions Needed |
| :--- | :--- | :--- | :--- | :--- |
| **Navigation** | `AppShell` | 1 | **B** | Legacy MIRATS logic, themed with Astryx tokens. |
| **Navigation** | `Sidebar` | 1 | **B** | Aligned colors, but still uses legacy shadcn components inside. |
| **Actions** | `Button` | 81 | **C** | Still importing `@/components/ui/button` directly in many routes. |
| **Actions** | `MiratsButton` | ~15 | **B** | Proper Astryx wrapper, needs full rollout. |
| **Layout** | `Card` | 65 | **C** | High usage of legacy `Card`. `MiratsCard` usage is low. |
| **Inputs** | `Input` | 53 | **C** | Legacy `Input` still dominant. |
| **Overlays** | `Dialog` | 25 | **B** | Rethemed via CSS layers (Astryx-consistent), but legacy implementation. |
| **Tables** | `StandardTable` | High | **B** | Virtualization requirement met; themed with Astryx tokens. |
| **Typography** | `Heading` | - | **C** | Missing semantic `MiratsHeading` usage in 90% of routes. |

---

## D. Visual Mismatches vs. Astryx Gallery

1. **Border Radii**: Computed button radius is `16px` (shadcn-like) vs Astryx's typically smaller, more precise radii in some contexts.
2. **Surface Density**: Tables are extremely compact (12px font) which is a MIRATS requirement, but differs from standard Astryx comfortable density.
3. **Empty States**: Most routes still use `div` placeholders instead of `MiratsEmptyState`.
4. **Command Palette**: `TopBar.tsx` still lazy-loads legacy `CommandPalette` instead of native Astryx component.
5. **Loading States**: Many pages use `Loader2` (Lucide) directly instead of `MiratsSkeleton` or `Spinner`.

---

## E. Proposed Priority for Phase 11 (High Impact)

1. **Rollout Action Primitives**: Replace all `@/components/ui/button` imports with `MiratsButton` in top 20 business routes.
2. **Rollout Data Containers**: Migrate dashboard and list pages from legacy `Card` to `MiratsCard`.
3. **Typography Standard**: Replace `h1`/`h2` with `MiratsHeading` to force `Space Grotesk` rendering.
4. **Form Controls**: Bulk update top routes to use `MiratsFormControls` (Input, Selector).
5. **Global Search**: Finalize migration of `TopBar` search trigger to fully adopt the already-integrated Astryx Command Palette logic.

---

*Audit performed on 2026-08-16. No code changes made during this turn.*
