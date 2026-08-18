# Plan: StandardTable Compatibility-First Audit & Restoration

Perform a structural audit and restoration of `StandardTable` to ensure API compatibility, logic integrity, and UI consistency using the Astryx design system tokens.

## 1. Audit & API Parity
- Create a mapping of legacy vs. modern props to ensure zero-breakage for callers.
- **Columns:** `label` → `header`, `cell` → `render`, `minW` → `minWidth`.
- **Presets:** Support `cot` and `visibleKeys` mappings.
- **Contexts:** Ensure `toolbar` and `bulkActions` receive `{ filteredRows, visibleColumns, allColumns, pageRows, selectedRows, clear }`.

## 2. Structural Logic Restoration
- **Row Identity:** Harden `getRowIdInternal` to warn in development if no unique ID is found, ensuring stable React keys.
- **Engine/UI Separation:** Decouple data operations (filter, sort, select, pagination, export) from the rendering layer.
- **Controlled Selection:** Verify both `selected`/`setSelected` (controlled) and internal state work seamlessly.
- **Export Safety:** Ensure export functionality respects user visibility but ignores responsive `hideBelow` rules.

## 3. Technical Implementation (Adapter Layer)
- Implement internal `normalizedColumns` helper to handle deprecated props silently.
- Update `calculateOptimalWidths` to prioritize modern width props.
- Standardize `StandardTableProps` and `ColumnDef` types without using `any`.

## 4. Visual Refinement (Astryx Tokens)
- Apply Astryx typography (`Geist Sans`, `tabular-nums`).
- Standardize spacing using `UI_DENSITY` tokens.
- Apply semantic colors and radii defined in the project theme.

## 5. Verification & Testing
- Run existing `StandardTable.test.tsx` to ensure no regressions.
- Add contract tests for combined filter/sort/pagination/selection/bulk/export scenarios.
- Verify responsive `hideBelow` behavior (never hide sticky/action columns).

## Technical Details
- **File:** `src/components/mirats/StandardTable.tsx`
- **Dependencies:** `src/lib/mirats/ui/ui-density.ts`, `src/lib/mirats/use-column-prefs.ts`, `src/lib/mirats/ui/table-geometry.ts`.
- **Constraint:** Do not force all callers to update simultaneously; use adapters for backward compatibility.
