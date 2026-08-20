# Kế hoạch: Hợp nhất Bộ lọc & Điều khiển danh sách trên Mobile

Hệ thống hiện tại có các bộ lọc rời rạc trên thanh công cụ, gây chiếm diện tích lớn trên màn hình điện thoại (G1). Kế hoạch này sẽ gom tất cả (Tìm kiếm, Bộ lọc, Sắp xếp, Chọn cột) vào một Sheet duy nhất trên Mobile, sử dụng chung trạng thái với Desktop.

## 1. Thành phần mới: `MobileListControlsSheet`
Tạo `src/components/mirats/ui/MobileListControlsSheet.tsx` sử dụng `ResponsiveDialog` (đã có cơ chế Sheet trên mobile).
- **Input**:
  - `state`: `ListControlsState` từ `list-controls.ts`.
  - `actions`: Các hàm `setQ`, `setFilter`, `setSort`, `reset` từ `use-list-controls.ts`.
  - `columns`: Danh sách `ColumnDef<T>[]` để chọn cột (giống logic trong `StandardTable`).
  - `availableFilters`: Định nghĩa các bộ lọc (category/text) có sẵn.
- **Giao diện (Mobile only)**:
  - Header: Tiêu đề "Bộ lọc & Tùy chỉnh".
  - Body (ScrollArea): 
    - Ô tìm kiếm (Search Input).
    - Các nhóm Select/Checkbox cho Filter.
    - Lựa chọn Sắp xếp (Sort).
    - Lựa chọn Hiển thị cột (Column Visibility).
  - Footer (Sticky):
    - Nút "Xóa tất cả" (reset).
    - Nút "Áp dụng" (đóng sheet).

## 2. Nút kích hoạt trên PageHeader/Toolbar
Dưới ngưỡng 768px:
- Ẩn các ô tìm kiếm/lọc riêng lẻ.
- Hiển thị một nút duy nhất: `Bộ lọc {count > 0 && (count)}`.
- `count` tính bằng số lượng filter đang active trong `state.filters` + (state.q ? 1 : 0).

## 3. Phạm vi áp dụng (Trang G1 đầu tiên)
Chọn **`src/routes/_app.su-co.index.tsx`** (Sự cố kỹ thuật) làm nơi triển khai đầu tiên vì:
- Đã thuộc hạng G1 (ưu tiên mobile).
- Đang dùng các state rời rạc (`query`, `tt`, `period`) thay vì `useListControls`. Đây là cơ hội để chuẩn hóa sang `useListControls`.

## 4. Các bước thực hiện
1. **Thiết kế Component**: Viết `MobileListControlsSheet`.
2. **Refactor Route**: Chuyển `src/routes/_app.su-co.index.tsx` sang dùng `useListControls` để quản lý state tập trung.
3. **Tích hợp UI**: 
   - Sửa `StandardTable` hoặc Toolbar của trang để hiển thị nút gom trên Mobile.
   - Đảm bảo Desktop vẫn giữ nguyên giao diện cũ (không thay đổi hành vi nhìn thấy).
4. **Kiểm chứng**:
   - Kiểm tra chiều cao Toolbar ở 390px (kỳ vọng giảm đáng kể).
   - Kiểm tra tính đồng nhất của state khi chuyển đổi giữa Desktop/Mobile.

## Chi tiết kỹ thuật
- Sử dụng `ResponsiveDialog` để tận dụng tính năng trượt từ dưới lên (Sheet) và tránh bị bàn phím che khuất nút xác nhận.
- Đảm bảo `aria-label` cho nút "Bộ lọc" để hỗ trợ truy cập.
