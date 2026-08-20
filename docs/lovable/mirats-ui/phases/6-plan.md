# Phase 6: Surfaces & Containers (Plan)

## Scope
Visual migration of high-level surface containers and navigational components to the SSR-safe static Astryx foundation.
- **Components**: `Card`, `Table` (Base), `Tabs`, `Separator` (Refinement).
- **Architecture**: Move from Tailwind utility-heavy React components to semantic `data-astryx-*` attributes and static CSS skins.
- **Archetype Focus**: `dashboard` (Cards) and `tracker/work tools` (StandardTable baseline).
- **Visual Reference**: Astryx 0.4.5 (Pinned to MIRATS Blue #0074e2).

## Implementation Details

### 1. CSS Layer Update (`src/styles/astryx-static/components.css`)
- **Card**:
    - Geometry: Standardized padding (12px/16px/24px based on density).
    - Skin: Subtle border (`var(--color-border)`), flat background (`var(--color-background-surface)`), zero shadow by default (elevation on hover only).
    - Anatomy: `astryx-card-header`, `astryx-card-body`, `astryx-card-footer` with standardized gap logic.
- **Table (Base Architecture)**:
    - Geometry: Header height (28px compact / 32px comfortable), Row height (28px compact / 32px comfortable).
    - Visuals: Sticky headers with `backdrop-filter`, hairline borders, hairline column separators (`border-r`).
    - Alignment: Numeric alignment (`tabular-nums`), vertical centering.
- **Tabs**:
    - Style: Astryx "Stone" variant (Underline/Border bottom for active state).
    - Layout: Scrollable horizontally with `no-scrollbar` behavior.
- **Status Surfaces**:
    - Standardized empty states and loading skeletons using the Astryx surface pattern.

### 2. React Refactor
- **Card**: Refactor `src/components/ui/card.tsx`. Remove CVA variant classes. Map variants to `data-astryx-variant`.
- **Table Components**: Refactor `src/components/ui/table.tsx`. Add stable `data-astryx-control` attributes.
- **Tabs**: Refactor `src/components/ui/tabs.tsx`. Mapped to Astryx tabs geometry.
- **StandardTable Adaptation**: Refine `src/components/mirats/StandardTable.tsx` to ensure it consumes the new static table architecture without regressions in its complex virtualization logic.

## Pilot Surface
- **Device Management (/thiet-bi)**:
    - Verify `StandardTable` visual parity.
    - Verify `Card` usage in mobile view and filter panels.
    - Verify `Tabs` (if applicable in related views).

## Verification
- **SSR**: Ensure identical DOM snapshots for table headers and card structures.
- **Hydration**: Confirm zero warnings.
- **Visual**: Capture before/after evidence for `catalog_table_parity.png` and `dashboard_kpi_card.png`.
- **Mobile**: Verify responsive grid behavior for Cards at 360px.
