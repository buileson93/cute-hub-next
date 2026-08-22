# Plan - Kiểm tra hồi quy hệ thống AppShell và Bản quyền

Sau đợt refactor cấu trúc thư mục AppShell và thư viện Bản quyền, kế hoạch này tập trung vào việc đối chiếu tính năng, sửa các import bị hỏng và đảm bảo hệ thống vận hành ổn định.

## 1. Đối chiếu và khôi phục AppShell (T17-T22)

Kiểm tra sự đầy đủ của các module mới tách từ `AppShell.tsx` (bản 952 dòng):

- **Trạng thái thu gọn (isCollapsed):** Đã port vào `AppShell.tsx` mới, sử dụng `localStorage` "mirats-sidebar-collapsed". Hiện tại mặc định là `true` (thu gọn).
- **Điều hướng Workspace (Sidebar Rail):** Đã tách thành logic trong `AppShell.tsx` sử dụng `workspaces` từ `nav-contract.ts`.
- **TopBar & Tìm kiếm:** `TopBar.tsx` đã xử lý `mirats:open-command-palette` và phím tắt ⌘K/Ctrl+K.
- **Menu người dùng & Avatar:** Đã port vào `src/components/mirats/app-shell/index.tsx`.
- **Thông báo Realtime:** `RealtimeStatusIndicator` đã có trong `TopBar.tsx`.
- **Chuyển đổi Workspace di động:** `MobileNav.tsx` đã kế thừa logic từ bản cũ.

## 2. Đồng bộ thư viện Bản quyền phần mềm

Đổi từ `ban-quyen-thiet-bi.ts` sang bộ API mới:

- `ban-quyen.ts`: Chứa logic tính toán (hạn dùng, trạng thái), hook danh sách và chi tiết.
- `ban-quyen-detail.ts`: Quản lý tệp đính kèm (`useBanQuyenTep`) và Audit log.
- `ban-quyen-alerts.ts`: Hook quét cảnh báo hết hạn (`useBanQuyenAlertScanner`).
- Cập nhật `ThietBiBanQuyen.tsx` để sử dụng đúng các hook từ các file mới này.

## 3. Sửa lỗi Import và Verify

- Rà soát toàn bộ dự án để thay thế các import cũ:
  - `@/components/mirats/AppShell` -> `@/components/mirats/app-shell/AppShell`
  - `@/lib/mirats/ban-quyen-thiet-bi` -> `@/lib/mirats/ban-quyen` hoặc các file detail/alerts tương ứng.
- Kiểm tra tính tương thích của kiểu dữ liệu (Typescript).

## Chi tiết kỹ thuật

- **AppShell:** Giữ nguyên logic `isHovered` để mở rộng sidebar khi rê chuột.
- **Bản quyền:** Đảm bảo `trangThaiBanQuyen` và `STATUS_CLASS` đồng nhất giữa các view.
- **Build & Test:** Chạy `npx tsc --noEmit` để xác nhận không còn lỗi import ẩn.

## Báo cáo đối chiếu dự kiến

| Thành phần             | Trạng thái | Vị trí hiện tại                  |
| :--------------------- | :--------- | :------------------------------- |
| Sidebar Collapse State | Còn        | `app-shell/AppShell.tsx`         |
| Sidebar Logo/Rail      | Còn        | `app-shell/index.tsx`            |
| TopBar Search          | Còn        | `app-shell/TopBar.tsx`           |
| Mobile Navigation      | Còn        | `app-shell/MobileNav.tsx`        |
| License Expiry Logic   | Còn        | `lib/mirats/ban-quyen.ts`        |
| License File Upload    | Còn        | `lib/mirats/ban-quyen-detail.ts` |
| License Alerts         | Còn        | `lib/mirats/ban-quyen-alerts.ts` |
