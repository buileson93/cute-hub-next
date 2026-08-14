# Kế hoạch tối ưu hiển thị Bảng và Dropdown (MIRATS 2.0)

Người dùng phản hồi rằng giao diện bảng bị chồng lấn (overlap) và có quá nhiều khoảng trắng dư thừa, đặc biệt là ở các dropdown. Kế hoạch này tập trung vào việc nén mật độ hiển thị (data density) và đảm bảo tính thẩm mỹ của các thành phần dữ liệu chính.

## Phân tích hiện trạng
- `src/styles.css`: Đã có các CSS rule nén `table th`, `table td` xuống `padding: 0.375rem 0.75rem` (6px 12px) và `font-size: 13px`.
- `UI_DENSITY`: Các giá trị `TABLE_CELL_PX` (px-2) và `TABLE_CELL_PY` (py-1) đang được sử dụng nhưng có thể chưa áp dụng triệt để ở mọi nơi.
- `SelectTrigger`: Đang dùng `h-9`, có thể thu hẹp thêm.
- `StandardTable`: Đang xử lý responsive chuyển sang Card trên mobile, nhưng trên tablet/desktop vẫn có thể gặp vấn đề về overlap nếu cột quá dày.

## Các bước thực hiện

### 1. Tối ưu hóa Table (Toàn cục)
- Cập nhật `src/components/ui/table.tsx` để sử dụng các token từ `UI_DENSITY` một cách nhất quán.
- Giảm padding mặc định của `TableCell` và `TableHead` để tránh chồng lấn khi bảng có nhiều cột.
- Đảm bảo `overflow-x-auto` luôn hoạt động tốt với `mirats-scroll`.

### 2. Tối ưu hóa Dropdown & Select
- Cập nhật `src/components/ui/select.tsx` và `src/components/ui/popover.tsx`.
- Giảm chiều cao của `SelectTrigger` xuống `h-8` trong chế độ mặc định hoặc compact.
- Giảm padding dọc của `SelectItem` để hiển thị được nhiều item hơn trong danh sách dài.

### 3. Tinh chỉnh Whitespace trong Card & PageBody
- Giảm `SECTION_GAP` trong `UI_DENSITY` nếu cần thiết (hiện tại `gap-3` cho compact).
- Kiểm tra các Card Header để đảm bảo không có khoảng trắng thừa (`pb-1.5`).

### 4. Sửa lỗi Chồng lấn (Overlap)
- Áp dụng `truncate` hoặc `line-clamp` chặt chẽ hơn cho các ô dữ liệu văn bản dài (`longtext`).
- Đảm bảo các cột `sticky` không đè lên nội dung khác một cách thiếu tự nhiên.

## Chi tiết kỹ thuật

### Thay đổi CSS/Token
- **styles.css**: Cập nhật padding table mặc định từ `0.75rem` (12px) xuống `0.5rem` (8px) cho padding ngang.
- **ui-density.ts**: Rà soát lại `TABLE_ROW_H` (h-8) và `TABLE_CELL_PY` (py-1).

### Thay đổi Component
- **ui/table.tsx**: Đồng bộ padding với `UI_DENSITY`.
- **ui/select.tsx**: Chỉnh `h-9` thành `h-8` (hoặc linh hoạt theo prop).
- **ui/input.tsx**: Đồng bộ chiều cao với Select để hàng filter không bị lệch.

## Kiểm tra (Verification)
- Kiểm tra trang Sổ lý lịch (`/thiet-bi`) — nơi có cây phân cấp và danh sách tài sản.
- Kiểm tra các trang danh mục (`/danh-muc/*`) sử dụng `StandardTable`.
- Kiểm tra các dropdown lọc trong `StandardTable` toolbar.
