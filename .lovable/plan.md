# Plan: Fix Table Selection Logic and Update Roadmap Text

## User Review Required

> [!IMPORTANT]
> The table selection logic was failing because `StandardTable` strictly required the `onSelect` prop to be present, but several key panels (Asset and Component panels) were only passing `setSelected`. I will unify this logic so either prop works.

## Proposed Changes

### Roadmap Update
- Update Vietnamese roadmap text in `src/components/mirats/app-shell/TopBar.tsx` (tooltip) and `src/components/mirats/TzClock.tsx` (aria-label) verbatim as requested.

### Table Selection Fix
- Modify `src/components/mirats/StandardTable.tsx`:
    - Update `toggleRow` and `toggleAll` to work when either `onSelect` or `setSelected` is provided.
    - Ensure `selected` set is handled correctly even if not initialized by the caller.
    - Fix potential event propagation issues in the selection column.

## Technical Details

### 1. Roadmap Synchronization
- Update `TopBar.tsx` (line 90) and `TzClock.tsx` (line 47).
- Verbatim text: `các checkbox select all và select từng dòng ở bảng chưa hoạt động được tìm nguyên nhân và đưa ra kế hoạch chi tiết để khắc phục`

### 2. StandardTable logic refactor
- `toggleRow`:
  ```typescript
  const toggleRow = useCallback(
    (id: string) => {
      const current = selected || new Set<string>();
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      onSelect?.(next);
      setSelected?.(next);
    },
    [onSelect, selected, setSelected]
  );
  ```
- `toggleAll`:
  ```typescript
  const toggleAll = useCallback(() => {
    const current = selected || new Set<string>();
    if (current.size === rows.length && rows.length > 0) {
      onSelect?.(new Set());
      setSelected?.(new Set());
    } else {
      const next = new Set(rows.map(getRowIdInternal));
      onSelect?.(next);
      setSelected?.(next);
    }
  }, [onSelect, selected, rows, getRowIdInternal, setSelected]);
  ```
- Header Checkbox `checked` state:
  ```typescript
  checked={rows.length > 0 && (selected?.size ?? 0) === rows.length}
  ```

## Verification Plan

### Automated Tests
- Run `tests/table-integrity.test.py` to verify that infinite scroll still works and check if selection logic can be verified via Playwright.

### Manual Verification
1. Open the preview at `/he-thong/thanh-phan`.
2. Click the "Select All" checkbox in the table header.
3. Verify all visible rows are selected and the bulk action bar appears.
4. Click an individual row checkbox.
5. Verify selection state updates correctly.
6. Check the TopBar clock tooltip to ensure the Vietnamese text is updated.
