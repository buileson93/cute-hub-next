# Kế hoạch sửa lỗi Checkbox Select All trong StandardTable

Checkbox "Select All" trong `StandardTable` đang không hoạt động do logic so sánh `selected?.size === filtered.length` không tính đến trường hợp tập dữ liệu lớn (> 1000 dòng) và cách quản lý state `selected` từ các component cha (như `ThanhPhanTable`).

## Phân tích nguyên nhân
1. **Dữ liệu lớn**: `filtered` chứa toàn bộ dòng đã lọc (có thể > 1000), trong khi `selected` có thể chỉ chứa một tập hợp con.
2. **State Sync**: `StandardTable` nhận `selected` (Set) và `setSelected` từ props. Nếu component cha không khởi tạo `selected` đúng cách (ví dụ: `undefined`), logic `selected?.size` sẽ trả về `undefined` hoặc lỗi.
3. **Indeterminate State**: Hiện tại chưa có trạng thái "chọn một phần" (indeterminate), gây nhầm lẫn về trải nghiệm người dùng.

## Các bước thực hiện

### 1. Cập nhật `StandardTable.tsx`
- Sửa logic `checked` của checkbox Select All:
  ```typescript
  const isAllSelected = filtered.length > 0 && selected?.size === filtered.length;
  const isSomeSelected = (selected?.size ?? 0) > 0 && !isAllSelected;
  ```
- Sử dụng prop `checked="indeterminate"` của Radix UI (nếu `Checkbox` hỗ trợ) hoặc visual hint.
- Đảm bảo `setSelected` được gọi với một `Set` mới chứa toàn bộ `getRowIdInternal(r)` của mảng `filtered`.

### 2. Kiểm tra `ThanhPhanTable.tsx`
- Rà soát việc khởi tạo state `selected`.
- Đảm bảo khi chuyển đổi giữa "Theo thành phần" và "Theo tài sản", state `selected` được xóa sạch (clear) để tránh xung đột ID giữa các loại thực thể khác nhau.

### 3. Kiểm tra các component khác dùng `StandardTable`
- `CatalogTable.tsx`, `SparePartsTable.tsx`, v.v. để đảm bảo tính đồng bộ.

## Kiểm tra (Verification)
- Mở trang `/he-thong/thanh-phan`.
- Bấm checkbox "Select All" ở header.
- Kiểm tra xem tất cả các checkbox ở từng dòng có được tích chọn không.
- Kiểm tra số lượng item được chọn hiển thị trên `BulkActionBar`.
- Thử lọc dữ liệu và bấm "Select All" để xem nó có chỉ chọn các dòng đang hiển thị (filtered) hay không.
