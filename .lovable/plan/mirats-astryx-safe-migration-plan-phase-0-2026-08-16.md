---
name: MIRATS Astryx Safe Migration Plan (Phase 0)
description: Baseline audit and safety documentation for Astryx design system migration.
type: feature
---

# MIRATS Astryx Safe Migration Plan (Phase 0)

## 1. Audit Baseline Summary
- **Package Manager**: `npm` (v22.22.0 Node, v8.0.16 Vite).
- **Git Status**: Working tree clean.
- **Compilation**: `npm run build:dev` successful (Baseline green).
- **Runtime**: All 5 pilot routes (Home, Asset Catalog, Forms, System Detail, Diagram) hydrated and rendered correctly.

## 2. Technical Debt & UI Metrics
- **Arbitrary Typography (`text-[...]`)**: 860 instances.
- **Hex Colors in TSX**: 114 instances.
- **Interaction States (`hover:`, `group-hover:`)**: 563 instances.
- **Animations (`animate-`, `motion`)**: 288 instances.
- **Complex UI Overlay Nodes (`Dialog`, `Sheet`, `Drawer`)**: 2143 instances.
- **Standardized Data Nodes (`StandardTable`)**: 98 instances.

## 3. Component Contracts (P0)
All `src/components/ui` primitives follow the standard React + Radix pattern:
- **Ref Forwarding**: All components export `forwardRef` for focus and tooltip management.
- **Composition**: `asChild` prop enabled via Radix `Slot`.
- **Styling**: Class merging via `cn()` utility.
- **Density**: Themed via `data-density` attribute on the root element.

## 4. Route Classification
- **Dashboards**: `/`, `/tong-quan`.
- **Catalog/Tables**: `/danh-muc/thiet-bi`, `/bao-tri`, `/su-co`, `/hong-hoc`.
- **Forms**: `/forms/new/$code`, `/forms/edit/$id`.
- **Detail Views**: `/he-thong/$id`, `/thiet-bi/$maThietBi`.
- **Diagrams**: `/so-do/$id`, `/he-thong/cay`.
- **Admin**: `/admin/*`, `/phan-quyen`.

## 5. Migration Strategy & Risks
- **Density Parity**: Astryx must replicate the existing 3-level density (Compact, Comfortable, Spacious) to avoid visual regressions.
- **Motion Parity**: 569 CSS transitions and `motion/react` behaviors must be maintained.
- **Architecture**: The existing TanStack Start/Router architecture and Supabase RLS policies are immutable during this UI migration.

## 6. Pilot Route Verification
| Route | File Path | Status | Key UI Elements |
| :--- | :--- | :--- | :--- |
| Dashboard | `src/routes/_app.index.tsx` | Green | Recharts, KPI Cards, DashboardGrid |
| Asset Catalog | `src/routes/_app.danh-muc.thiet-bi.tsx` | Green | StandardTable, Virtualization, Filters |
| New Form | `src/routes/_app.forms.new.$code.tsx` | Green | FormWizard, DynamicFields, AssetPicker |
| System Detail | `src/routes/_app.he-thong.$id.tsx` | Green | TabsContent, Panels, OperationsStream |
| Diagram | `src/routes/_app.so-do.$id.tsx` | Green | React Flow, Custom Nodes, Pan/Zoom |

Report finalized in `docs/astryx-migration-baseline.md`. Ready for Phase 1.
