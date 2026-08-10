# Plan - Restore "Column Display" Button (T17 - Restoration)

Restore the "Cột hiển thị" (Column Display) button in the `StandardTable` toolbar to allow users to toggle column visibility.

## User Review Required

> [!IMPORTANT]
> - **Mobile Behavior**: The column selector will be **hidden on mobile** (`isMobile`) because the card layout only displays the first 5 visible columns, making precise column management less impactful and potentially cluttered on small screens.
> - **Wait for Ready**: The button will remain disabled until `prefs.ready` is true to prevent visual flickering of checkbox states.

## Proposed Changes

### 1. `src/components/mirats/StandardTable.tsx`

#### Add Imports
- Import `SlidersHorizontal` from `lucide-react`.
- Import `DropdownMenu` and its sub-components from `@/components/ui/dropdown-menu`.

#### Implement UI
- Locate the toolbar right section (near `toolbarRight`).
- Add a `DropdownMenu` triggered by a button with `SlidersHorizontal` icon and "Cột hiển thị" text.
- The button should only render if `tableKey` is provided and `!isMobile`.
- Implement `DropdownMenuContent`:
    - Iterate through `sortedColumns` (grouped by `group` property if available).
    - Use `DropdownMenuCheckboxItem` for each column.
    - Logic: `checked={!prefs.isHidden(col.key)}`, `onCheckedChange={() => prefs.toggle(col.key)}`.
    - Prevent closing on select: `onSelect={(e) => e.preventDefault()}`.
    - Disable checkbox if it's the last visible column: `disabled={!prefs.isHidden(col.key) && shownCols.length === 1}`.
    - Add a "Đặt lại mặc định" (Reset to default) item at the bottom calling `prefs.reset()`.

## Verification Plan

### Automated Tests
- Run `npx tsc --noEmit` to check types.
- Run `npm run test -- src/__tests__/standard-table-columns.test.ts` to ensure no regressions in filtering logic.

### Manual Verification
1. Open a page with a `StandardTable` (e.g., "Sự cố kỹ thuật").
2. Verify the "Cột hiển thị" button appears.
3. Toggle columns and verify the table updates immediately.
4. Refresh the page and verify visibility states are persisted.
5. Click "Đặt lại mặc định" and verify columns return to their initial state.
6. Attempt to hide all columns and verify the last one cannot be unchecked.
7. Switch to mobile view and verify the button is hidden.
