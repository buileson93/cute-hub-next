# 30. Quản trị người dùng & Phân quyền (RBAC)

Đường dẫn: `/quan-tri/nguoi-dung`, `/phan-quyen`, `/admin/permissions`.

## Tạo tài khoản
1. `/quan-tri/nguoi-dung` → **+ Thêm người dùng**.
2. Nhập Email + Họ tên + **Đơn vị** (bắt buộc — trigger DB đảm bảo).
3. Chọn **Vai trò** (roles).
4. Bấm **Tạo** — hệ thống gửi email mời đặt mật khẩu.

## Vai trò chuẩn
- **Admin** — toàn quyền.
- **Quản lý đơn vị** — CRUD trong scope đơn vị.
- **Kỹ thuật viên** — tạo sự cố/bảo dưỡng, không xóa.
- **Đọc (Viewer)** — chỉ xem.
- Các cấp bổ sung: **R-DV**, **C-DV** (Read/Create ở cấp Đơn vị).

## Ma trận quyền (Role Matrix)
1. `/admin/permissions` — bảng ma trận vai trò × hành động.
2. Tick ô để cấp / thu quyền.
3. Bấm **Lưu** — đồng bộ với RLS của Postgres.

## Route guard
- Route `_authenticated` chặn user chưa đăng nhập.
- Route `admin.*` chặn user không có role admin.
- Nếu vi phạm → chuyển về `/auth` (chỉ khi lỗi phiên thực sự, tránh loop 401).

## Vô hiệu hóa
- Menu `⋯ → Vô hiệu hóa` — không xóa, giữ audit trail.
