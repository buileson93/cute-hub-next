# 02. Tổng quan giao diện

## Cấu trúc chính
```
┌────────── Topbar (h-14) ──────────────────┐
│ Logo | Search | 🔔 Thông báo | 👤 Avatar │
├──────┬────────────────────────────────────┤
│ Side │                                    │
│ bar  │        Nội dung route              │
│      │        (PageHeader + Body)         │
└──────┴────────────────────────────────────┘
```

## Sidebar (menu chính)
- **Overview** — `/` KPI toàn hệ thống.
- **Hệ Thống** — cây thiết bị, sơ đồ, network overview.
- **Vận hành** — Sự cố, Bảo dưỡng, Hỏng hóc, Kiểm kê, Kiểm định, Bàn giao.
- **Danh mục** — Tài sản, Model, Chủng loại, Nhãn, Đơn vị, Vị trí, NSX/NCC.
- **Giấy phép** — quản lý giấy phép khai thác.
- **Forms** — biểu mẫu động.
- **Quản trị** — chỉ hiển thị với vai trò admin.

## Topbar
- **Search / Command Palette**: bấm `Ctrl+K` (Windows) hoặc `⌘K` (Mac).
- **Thông báo 🔔**: hiển thị badge số thông báo chưa đọc, realtime.
- **Avatar**: mở menu Tài khoản, Cài đặt, Đăng xuất.

## PageHeader
Mọi route đều dùng `<PageHeader>` với:
- Tiêu đề trang
- Subtitle ngắn
- Nút **Help** (mở HelpDrawer)
- Các action chính (Tạo mới, Xuất, Nhập…)

## Nút Command Palette nổi
Ở mọi khung giao diện, nút tròn góc phải dưới cho phép mở Command Palette nhanh.

## Chế độ hiển thị
- **Density**: đổi mật độ ở `Cài đặt → Giao diện` (compact / normal / comfort).
- **Light/Dark**: menu Avatar → Giao diện.

## Realtime
Toàn bộ badge, danh sách và KPI tự cập nhật khi có thay đổi CSDL (qua `useGlobalRealtime`). Không cần F5.
