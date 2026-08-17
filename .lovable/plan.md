# Plan: [MIRATS ASTRYX — P9: STONE TABLE B-S, DATA CONTRACT LOCKED]

Apply Astryx visual skins (Stone) to the table architecture while maintaining technical parity and SSR stability.

## Tasks

### 1. Table Visual Skins (CSS)
- Define `.astryx-table` container skins in `src/styles/astryx-component-skins.css`.
- Standardize `.astryx-table-header` with 11-12px bold, uppercase, tracking-wider typography.
- Implement `.astryx-table-row` with 120ms hover transitions and density-aware heights.
- Add hairline border styles and sticky header shadow tokens.

### 2. Checkpoint 1: StandardTable (B-S)
- Update `src/components/mirats/StandardTable.tsx`:
    - Apply `.astryx-table` to the main container.
    - Standardize the toolbar/search area with `astryx-surface`.
    - Update `TableHead` and `TableCell` rendering to use Astryx typography and numeric mono tokens for `type="number"`.
    - Preserve all virtualizer, selection, and filter logic.

### 3. Checkpoint 2: ThanhPhanTable (Pilot)
- Update `src/components/mirats/ThanhPhanTable.tsx`:
    - Apply pilot skins to the table wrapper.
    - Standardize status badges using Astryx semantic colors.
    - Ensure row actions use `astryx-control` skins.

### 4. Checkpoint 3: CatalogTable & Raw Tables (B-S)
- Update `src/components/mirats/CatalogTable.tsx`:
    - Refactor list and tree views to use consistent Stone table skins.
- Update `src/components/ui/table.tsx`:
    - Inject baseline static skins into the low-level Radix-based table primitives.

## Technical Details
- **Skin Mapping (B-S)**: Behavior + Skin mode. No changes to data fetching, RLS, or mutations.
- **SSR Parity**: Maintain `use client` where interaction exists, but ensure CSS-only skins render correctly on the server.
- **Density**: Integrated with `UI_DENSITY` tokens. "Compact" uses 11px text, "Comfortable" uses 12px.

## Verification
- **Build**: `bun run build` (Worker environment).
- **Interactions**: Sort, filter, pagination, row selection, and sticky header behavior.
- **Performance**: Monitor CLS (Cumulative Layout Shift) during hydration and INP (Interaction to Next Paint) on large datasets.
