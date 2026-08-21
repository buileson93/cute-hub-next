# Kế hoạch: Đồng bộ hóa hành vi và Hành động cá nhân hóa (Phase U7.5)

Theo chỉ thị Phase U7.5, mục tiêu là đảm bảo mọi nút "Cá nhân hóa" và "Khôi phục" đều có hành vi thực tế, không gây hiểu lầm cho người dùng. Chúng ta sẽ áp dụng Test-Driven Development (TDD) để xác nhận các lỗi hiện tại và đảm bảo tính đúng đắn sau khi sửa.

## 1. Phân tích & Tái hiện (TDD)
- **Dashboard**: Kiểm tra chuỗi hành động: Click "Cá nhân hóa" -> Hiển thị mode chỉnh sửa -> Thêm/Xóa widget -> Khôi phục -> Kiểm tra persistence.
- **Trang Sự cố**: Xác nhận các nút "KHÔI PHỤC" và "CÁ NHÂN HÓA" hiện tại là "vô hồn" (không có handler).

## 2. Chi tiết kỹ thuật

### A. Dashboard (`src/routes/_app.index.tsx`)
- Sửa lỗi class mâu thuẫn: Thay thế `hidden md:flex flex` bằng `hidden md:flex`.
- Đảm bảo phản hồi UI (toast, loading state) hoạt động mượt mà với cơ chế debounce của `useUserPref`.

### B. Trang Sự cố (`src/routes/_app.su-co.index.tsx`)
- **Loại bỏ các nút decorative**: Ẩn các nút "KHÔI PHỤC" và "CÁ NHÂN HÓA" vì hiện tại trang này chưa triển khai logic layout động cho người dùng. Tránh tạo kỳ vọng giả.

### C. Widget UI (`src/components/mirats/dashboard/grid/WidgetContainer.tsx`)
- **Loại bỏ Icon "Move"**: Vì chưa triển khai logic kéo thả (Drag & Drop) thực tế, chúng ta sẽ xóa icon di chuyển và class `cursor-move` để không gây nhầm lẫn về chức năng.

### D. Kiểm tra & Hoàn tất
- Chạy script kiểm thử Playwright để xác nhận mọi nút đều "sống".
- Chạy `typecheck` và `build` để đảm bảo tính ổn định.

## 3. Các bước thực hiện
1. Viết script kiểm thử `tests/u7_5_behavior_audit.py`.
2. Thực hiện refactor code theo kế hoạch.
3. Chạy lại kiểm thử và xác nhận kết quả.
