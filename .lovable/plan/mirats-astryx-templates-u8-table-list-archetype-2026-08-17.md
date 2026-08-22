# [MIRATS ASTRYX TEMPLATES — U8: TABLE/LIST ARCHETYPE]

Restoration and standardization of the MIRATS data grid ecosystem using Astryx DF3 design language.

## Objectives

1.  **Page Anatomy Migration**: Align table-heavy routes with `PageFrame` -> `PageHeader` -> `PageBody` structure.
2.  **StandardTable Refactor**: Update the core `StandardTable.tsx` to use Astryx DF3 skins while preserving all functional UX behaviors (virtualization, sticky headers, bulk actions).
3.  **Pilot Rollout**: Migrate the Device Catalog (`/thiet-bi`) as the baseline, followed by `ThanhPhanTable` and `CatalogTable`.

## Proposed Changes

### 1. Primitive Table (`src/components/ui/table.tsx`)

- Standardize `TableHead` and `TableCell` with Astryx DF3 tokens.
- Ensure `TableHeader` uses `z-10` and solid background for stable sticky behavior.

### 2. StandardTable Core (`src/components/mirats/StandardTable.tsx`)

- **Typography**: Apply `font-mono tabular-nums` to columns of type `number`, `currency`, and `percent`.
- **Density**: Align row heights and cell padding with `UI_DENSITY` tokens.
- **States**: Refine `EmptyState` and `TableSkeleton` integration.
- **Toolbar**: Consolidate filter chips and count labels into a compact Astryx-styled row.

### 3. Device Catalog Pilot (`src/routes/_app.thiet-bi.index.tsx`)

- Refactor top-level structure to use `PageHeader`.
- Standardize the search suggestions dropdown with Astryx `popover` styles.
- Migrate the tree/table toggle and filters to a clean toolbar archetype.

### 4. Downstream Components

- **ThanhPhanTable**: Port changes from `StandardTable`.
- **CatalogTable**: Ensure dynamic rename actions and status badges follow the new design contract.

## Technical Details

- **Parity**: Columns, query logic, and mutation handlers remain untouched.
- **SSR**: Ensure no hydration mismatches in table headers or pagination.
- **Responsive**: Verify "Priority-based" column hiding works correctly on mobile/tablet widths.

## Success Criteria

- [ ] Table headers remain sticky and opaque during scroll.
- [ ] Numeric data is right-aligned and monospaced.
- [ ] Filter/Search state is preserved in URL.
- [ ] Light/Dark mode transitions are seamless.
