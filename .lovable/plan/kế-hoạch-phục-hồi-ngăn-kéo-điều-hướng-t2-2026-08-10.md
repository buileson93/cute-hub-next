# Kế hoạch phục hồi ngăn kéo điều hướng (T2)

## 1. Mục tiêu
Phục hồi ngăn kéo (Sheet) chứa toàn bộ menu điều hướng cho giao diện di động (dưới breakpoint `md`), cho phép người dùng truy cập tất cả các trang thay vì chỉ 4-5 mục chính ở thanh đáy.

## 2. Các bước triển khai

### Bước 1: Cập nhật `Sidebar.tsx`
- Thêm prop `onNavigate?: () => void` vào component `Sidebar`.
- Gọi `onNavigate` khi người dùng click vào một `Link`.
- Điều này giúp tự động đóng ngăn kéo khi chuyển trang.

### Bước 2: Cập nhật `TopBar.tsx`
- Chấp nhận prop `renderMobileMenu?: ReactNode`.
- Hiển thị `renderMobileMenu` (nút 3 gạch mở Sheet) chỉ ở breakpoint di động (`md:hidden`).

### Bước 3: Cập nhật `AppShell.tsx`
- Quản lý trạng thái `isMobileMenuOpen`.
- Tích hợp thành phần `Sheet` từ `@/components/ui/sheet`.
- Truyền nút `SheetTrigger` vào `TopBar` thông qua prop mới.
- Nội dung `SheetContent` sẽ chứa logo và thành phần `Sidebar` với prop `onNavigate={() => setMobileMenuOpen(false)}`.

## 3. Kiểm tra (Xong khi)
- Ở kích thước màn hình **375px**:
    - Thấy nút 3 gạch ở `TopBar`.
    - Click vào nút mở được ngăn kéo rộng khoảng 86vw (hoặc theo chuẩn UI).
    - Chọn một trang trong menu thì ngăn kéo tự đóng và chuyển trang thành công.
- Ở kích thước màn hình **1280px**:
    - Không thấy nút 3 gạch.
    - Sidebar hiển thị bình thường ở cột trái.
- Chạy `npx tsc --noEmit` không có lỗi.
- Không còn file rỗng trong dự án.
