---
name: T17 — Khôi phục nút thu gọn sidebar desktop
description: Phục hồi tính năng thu gọn sidebar với Hướng A (State nội tại) để giảm thiểu rủi ro lan rộng và giữ nguyên hành vi cũ.
type: feature
---

# Kế hoạch T17: Khôi phục nút thu gọn sidebar desktop

Dựa trên yêu cầu và mã nguồn thực tế, tôi chọn **Hướng A**: Tự thêm state `collapsed` vào `AppShell.tsx` và truyền xuống `Sidebar.tsx`. Hướng này ít rủi ro hơn việc thay đổi toàn bộ cấu trúc sang `ui/sidebar.tsx` của shadcn và đảm bảo tính tương thích ngược với dữ liệu `localStorage` cũ.

## Các bước thực hiện:

### 1. Cập nhật `src/components/mirats/app-shell/AppShell.tsx`
- Thêm state `isCollapsed` (khởi tạo `false`).
- Thêm `useEffect` để đọc từ `localStorage.getItem("mirats-sidebar-collapsed")`.
- Cập nhật class cho thẻ `<aside>` (Sub-sidebar) tại dòng 177:
    - Thay `w-64` thành `cn("w-64 transition-[width] duration-200", isCollapsed && "w-[3.25rem]")`.
- Ẩn tiêu đề `{activeWs.label}` khi `isCollapsed === true`.
- Truyền `isCollapsed` xuống component `<Sidebar />`.
- Thêm nút toggle ở đáy sidebar dùng `PanelLeftClose` / `PanelLeftOpen` kèm `aria-label` tương ứng.
- Cập nhật `localStorage` mỗi khi state thay đổi.

### 2. Cập nhật `src/components/mirats/app-shell/Sidebar.tsx`
- Cập nhật interface props để nhận `collapsed?: boolean`.
- Dựa trên prop `collapsed`:
    - Ẩn thẻ `h3` (tiêu đề nhóm).
    - Thay đổi class của mục menu: `cn("flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors", collapsed && "justify-center px-0 py-2")`.
    - Ẩn thẻ `<span>` chứa nhãn chữ (`item.nhan`).

## Kiểm tra:
- Chạy `npx tsc --noEmit` để đảm bảo typecheck pass.
- Chạy `npm run test` để đảm bảo không có regression.
- Kiểm tra trực quan trên trình duyệt (Desktop vs Mobile).
- Kiểm tra tính bền vững của state sau khi refresh trang.

## Báo cáo cuối cùng:
- `src/components/mirats/app-shell/AppShell.tsx`: Thêm state collapsed, logic localStorage và nút toggle.
- `src/components/mirats/app-shell/Sidebar.tsx`: Cập nhật giao diện thu gọn cho menu items.
