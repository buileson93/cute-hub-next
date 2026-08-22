# Plan: Phase 10M — Table Color States Only

Fix table row hover and selection states by removing conflicting global styles and implementing a tokenized system for accessible, consistent table coloring across all display modes.

## Technical Details

### 1. Visual Documentation & Verification
- Update `src/components/mirats/TzClock.tsx` `aria-label` with the verbatim Phase 10M instruction text.
- Create `/tmp/browser/table_colors.py` to capture screenshots and computed styles of table rows in light/dark modes for:
    - Default state
    - Hover state (reproducing the #262626 black background issue)
    - Selected state
    - Sticky cell alignment with row colors

### 2. Tokenize Table States (`src/styles.css`)
- Define new semantic tokens in `@layer astryx-brand`:
    - `--table-row-hover`: `oklch(var(--primary) / 0.08)` (Light) / `oklch(var(--primary) / 0.15)` (Dark)
    - `--table-row-selected`: `oklch(var(--primary) / 0.12)`
    - `--table-row-selected-hover`: `oklch(var(--primary) / 0.18)`
    - `--table-row-focus`: `var(--primary)` (ring)
- Remove `.astryx-table-row:hover { background-color: var(--color-accent) !important; }` from `src/styles.css`.

### 3. Component Refactoring
- **`src/components/ui/table.tsx`**: Update `TableRow` to use the new CSS variables for hover and selected states. Ensure `focus-visible` is properly styled.
- **`src/components/mirats/StandardTable.tsx`** & **`src/components/mirats/DataTableCore.tsx`**:
    - Remove redundant `hover:bg-muted/50` or `bg-primary/5` classes.
    - Standardize sticky cell backgrounds to use `inherit` or the same row state tokens to prevent "color islands".
    - Ensure `cursor-pointer` and `active:scale` are only applied to clickable rows.

### 4. Contrast & Accessibility
- Verify text and icon contrast ratios (min 4.5:1) on all state backgrounds.
- Ensure `aria-selected` is correctly reflected in the DOM for screen readers.

## User Review Required

> [!IMPORTANT]
> This phase focuses strictly on **visual styles and accessibility**. It does not change how data is loaded or how the tables scroll.

- **Contrast Check**: Hovering a row will now show a light blue tint (MIRATS Blue) instead of the current dark gray/black.
- **Sticky Consistency**: Sticky columns (like "Mã thiết bị" or "Thao tác") will now change color in sync with the rest of the row when hovered or selected.
