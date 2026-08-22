---
name: MIRATS ASTRYX P6B Plan
description: Plan for migrating Device List, New Form, System Details, and Manual Diagram to Astryx skins.
type: feature
---

# MIRATS ASTRYX — Phase 6B: Remaining Pilots Restoration Plan

## Decision Matrix (S/H/I/R/F)

| Route                    | Strategy                   | Criticality | Fallback         |
| ------------------------ | -------------------------- | ----------- | ---------------- |
| `thiet-bi.index` (List)  | **S (Static Skin)**        | High        | Browser native   |
| `forms.new.$code` (Form) | **S/B-S (Hybrid Skin)**    | High        | Tailwind default |
| `he-thong.$id` (Details) | **S (Static Skin)**        | Medium      | CSS Reset        |
| `so-do.$id` (Diagram)    | **H/I (Hydration Island)** | Medium      | Loading Skeleton |

## Checkpoint Matrix & Metrics

### C1: Device List (`src/routes/_app.thiet-bi.index.tsx`)

- **Changes**:
  1. Map `PageHeader` typography to `astryx-heading-1`.
  2. Map filter buttons to `astryx-control`.
  3. Map search input container to `astryx-surface`.
  4. Map device nodes in `TreeView` (if applicable) or main list to `astryx-card`.
  5. Apply `astryx-number` to counts.
  6. Map badges to `astryx-badge`.
- **Gate**: Dashboard regression, direct refresh `/thiet-bi`.

### C2: Form New (`src/routes/_app.forms.new.$code.tsx`)

- **Changes**:
  1. Map form container to `astryx-surface`.
  2. Map field labels to `astryx-text-label`.
  3. Map action buttons (Submit/Save) to `astryx-control` + `astryx-badge-primary`.
  4. Apply `astryx-heading-2` to section titles.
  5. Map Card wrappers to `astryx-card`.
  6. Map breadcrumb/back button to `astryx-control`.
- **Gate**: Form submission workflow, hydration console.

### C3: System Details (`src/routes/_app.he-thong.$id.tsx`)

- **Changes**:
  1. Map KPI summary to `astryx-surface`.
  2. Map Tabs trigger to `astryx-control` variant.
  3. Map chart containers to `astryx-card`.
  4. Map Life History list items to `astryx-text-body`.
  5. Map status indicators to `astryx-badge`.
  6. Map device names in list to `astryx-heading-3`.
- **Gate**: Direct refresh, tab switching stability.

### C4: Manual Diagram (`src/routes/_app.so-do.$id.tsx`)

- **Changes**:
  1. Map toolbar to `astryx-surface` (floating).
  2. Map sidebar panels to `astryx-card`.
  3. Map node editor to `astryx-surface`.
  4. Map action buttons to `astryx-control`.
  5. Map Zoom/Fit buttons to `astryx-control`.
  6. Map generic typography to `astryx-text-body`.
- **Gate**: React Flow interaction, SVG export parity.

## Full Gate Requirements

- Production build success.
- 0 SSR errors on target routes.
- Dark mode parity via semantic vars.
- Keyboard navigation (tab index) preserved.
