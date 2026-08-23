# Plan - StandardTable Advanced Features & Roadmap Update

The goal is to enhance `StandardTable` with bulk actions (delete, CSV export), keyboard-based selection, and update the roadmap status text.

## User Review Required

> [!IMPORTANT]
> - New standard props for `StandardTable`: `onBulkDelete` and `exportable`.
> - Keyboard selection will use standard patterns (Shift-click for range, Ctrl-click for toggle).

## Proposed Changes

### 1. Visual Text Roadmap Update
- Update `src/components/mirats/app-shell/TopBar.tsx` (tooltip content) and `src/components/mirats/TzClock.tsx` (`aria-label`) with the verbatim Vietnamese text provided:
    > "Add chức năng xóa hàng loạt cho các dòng đã chọn trong StandardTable, kèm xác nhận và thông báo kết quả.\n\nImplement xuất dữ liệu CSV cho các dòng đang được chọn hoặc toàn bộ kết quả bảng trong StandardTable.\n\nAdd điều khiển chọn nhiều dòng bằng bàn phím (Shift/Ctrl, Space) để người dùng chọn nhanh mà không cần chuột.\n\nKiểm tra responsive để đảm bảo bố cục cuộn độc lập vẫn hoạt động đúng khi thay đổi chiều rộng màn hình và khi zoom trình duyệt.\nlên kế hoạch chi tiết để làm"

### 2. StandardTable Enhancements
- **Keyboard Selection**:
    - Track `lastSelectedIndex` using `useRef`.
    - Update `toggleRow` to handle range selection when `Shift` is held.
    - Add `onKeyDown` to `TableRow` to handle `Space` for toggling the current row.
- **Bulk Delete**:
    - Add `onBulkDelete?: (ids: Set<string>) => Promise<void>` and `allowBulkDelete?: boolean` props.
    - If enabled and rows are selected, show a standard "Xóa" button in the bulk actions area using `BulkActionButton`.
- **CSV Export**:
    - Add `exportable?: boolean` prop.
    - If `true`, automatically include `TableExportDialog` in the bulk actions area.
- **Responsive Improvements**:
    - Ensure `mirats-table-scroll-container` maintains independent scroll behavior during window resizing.

### 3. Inventory Panels Refactoring
- Update `AssetTablePanel.tsx` and `ComponentTablePanel.tsx` to use the new built-in bulk actions where applicable, simplifying their `bulkActions` prop usage.

### 4. E2E Validation (Playwright)
- Create `tests/table-keyboard-selection.test.py` to:
    - Log in and navigate to an inventory page.
    - Test Shift-click range selection.
    - Verify bulk actions (delete confirmation, export trigger).

## Technical Details
- **Selection Logic**: Range selection will compute the set of IDs between `lastSelectedIndex` and `currentIndex`.
- **Export Integration**: `StandardTable` will pass its internal `fullDisplay`, `shownCols`, and `selected` state to `TableExportDialog`.
