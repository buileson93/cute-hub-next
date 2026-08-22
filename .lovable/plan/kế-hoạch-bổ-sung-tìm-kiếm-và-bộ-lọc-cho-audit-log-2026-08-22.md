# Kế hoạch Bổ sung Tìm kiếm và Bộ lọc cho Audit Log

Bổ sung ô tìm kiếm và các bộ lọc theo hành động (trạng thái) và người thực hiện vào component `AuditLog` để cải thiện khả năng truy vết thay đổi.

## Giai đoạn 1: Cập nhật UI `AuditLog.tsx`
- **Thanh công cụ lọc**: Thêm một hàng phía trên danh sách log bao gồm:
    - Ô nhập văn bản (Input) để tìm kiếm trong phần chi tiết (detail) và tên hành động.
    - Dropdown (Select) để lọc theo loại hành động (Tạo mới, Cập nhật, Ký số, v.v.).
    - Dropdown (Select) để lọc theo danh sách người thực hiện có trong dữ liệu log hiện tại.
- **State Management**: Sử dụng `useState` để quản lý `searchTerm`, `actionFilter`, và `userFilter`.

## Giai đoạn 2: Logic lọc dữ liệu
- **Client-side Filtering**: Áp dụng logic lọc trên mảng `logs` trả về từ Supabase để đảm bảo phản hồi tức thì khi người dùng thay đổi bộ lọc.
- **Hiển thị Empty State**: Cập nhật thông báo khi không có kết quả phù hợp với bộ lọc.

## Chi tiết kỹ thuật
- File chỉnh sửa: `src/components/mirats/projects/AuditLog.tsx`.
- Components sử dụng: `Input` từ `@/components/ui/input`, `Select` từ `@/components/ui/select`.
- Logic lọc sẽ tìm kiếm không phân biệt hoa thường trong `detail` và `action`.
