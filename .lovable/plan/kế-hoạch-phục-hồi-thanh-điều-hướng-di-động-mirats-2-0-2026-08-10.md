# Kế hoạch Phục hồi Thanh điều hướng Di động (MIRATS 2.0)

## 1. Vấn đề hiện tại
Sau khi tách file `AppShell.tsx`, thanh điều hướng đáy (Bottom Navigation) dành cho điện thoại đã bị mất. 
- `MobileNav.tsx` hiện đang rỗng.
- Khung nội dung chính thiếu padding bottom (`pb-16`) dẫn đến việc nếu có thanh điều hướng thì nội dung sẽ bị che.
- `UserMenu.tsx` rỗng đang tồn tại song song với `UserMenu` thật trong `index.tsx`.

## 2. Các bước triển khai

### Bước 1: Hoàn thiện `src/components/mirats/app-shell/MobileNav.tsx`
- Xây dựng component `MobileNav` sử dụng `workspaces` từ `nav-contract.ts`.
- Chỉ hiển thị dưới breakpoint `md` (`md:hidden`).
- Sử dụng `safe-area-inset-bottom` để tương thích tốt với các thiết bị di động có tai thỏ/nút home ảo.
- Logic chuyển đổi workspace tương tự như Sidebar rail trên Desktop: dùng `gotoWorkspace` helper.

### Bước 2: Cập nhật `src/components/mirats/app-shell/AppShell.tsx`
- Import `MobileNav` từ `./MobileNav`.
- Bao bọc `children` trong `<main className="flex-1 min-w-0 pb-16 md:pb-0">`.
- Đặt `<MobileNav />` vào cuối cấu trúc `div` chính (trước `AiChatButton`).

### Bước 3: Dọn dẹp
- Xoá file rỗng `src/components/mirats/app-shell/UserMenu.tsx`.

## 3. Kiểm tra (Definition of Done)
- Chạy `npx tsc --noEmit` không lỗi.
- `grep` kiểm tra các class bắt buộc: `pb-16`, `safe-area-inset-bottom`.
- Kiểm tra trực quan trên trình duyệt (375px):
    - Thanh điều hướng xuất hiện ở đáy.
    - Có thể bấm chuyển Workspace.
    - Nội dung không bị che khuất.
    - Không còn file rỗng trong `app-shell/`.
