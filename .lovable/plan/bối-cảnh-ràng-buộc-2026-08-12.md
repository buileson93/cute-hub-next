---
name: T49 — Dashboard Living Components (Heart-beat & Timeline)
description: Add a "Heart-beat" strip for system status and a "Live Timeline" for recent audit logs to the index page.
type: feature
---

## Bối cảnh & Ràng buộc

- Realtime đã được hồi sinh (T47).
- `dm_he_thong` có 96 bản ghi -> Cần gộp theo nhóm (bước 1: NẾU TRÊN 40: dải sẽ quá chật).
- `audit_log` chỉ cho phép `admin` và `phong_kt` đọc toàn bộ, người dùng thường chỉ thấy của chính mình (bước 5).
- Không tạo bảng mới, không nới lỏng quyền, không thêm thư viện chuyển động.

## Giải pháp kỹ thuật

### 1. Dải Nhịp Tim (Heart-beat Strip)

- **Dữ liệu**: Gộp theo `nhom_he_thong` (Nhóm hệ thống) để tránh quá chật (96 hệ thống). Mỗi ô đại diện cho một nhóm.
- **Màu sắc**:
  - Đỏ (`critical`): Có ít nhất 1 hệ thống trong nhóm bị sự cố Nghiêm trọng/Cao.
  - Vàng (`warning`): Có sự cố Trung bình/Thấp hoặc bảo trì quá hạn.
  - Xanh (`normal`): Bình thường.
  - Xám (`inactive`): Ngừng khai thác.
- **Hiệu ứng**: Flash nền nhẹ khi dữ liệu đổi (dùng CSS animation `animate-in fade-in zoom-in duration-500`). Tôn trọng `prefers-reduced-motion`.
- **Component**: `HeartBeatStrip.tsx`. Dùng `EntityHoverCard` hoặc `Tooltip` để hiện chi tiết hệ thống bên trong nhóm.

### 2. Dòng thời gian sống (Live Timeline)

- **Dữ liệu**: Lấy từ `audit_log` qua RPC/serverFn. Giới hạn 20 mục.
- **Giao diện**: Cột bên phải (Desktop), ẩn trên Mobile.
- **Nội dung**: Chuyển đổi action thô thành câu tiếng Việt (dùng helper `formatAuditAction`).
- **Realtime**: Lắng nghe bảng `audit_log` qua `useGlobalRealtime`.

### 3. Tối ưu hóa

- Gộp truy vấn Nhịp Tim thành 1 truy vấn duy nhất.
- Dùng chung `useGlobalRealtime` để invalidate cache.

## Kế hoạch thực hiện

1. **Thiết kế màu & Gộp nhóm**: Trình bày đề xuất gộp 96 hệ thống thành ~10-15 nhóm hệ thống (dm_nhom_he_thong).
2. **Component HeartBeatStrip**: Xây dựng dải ngang với hiệu ứng loé nhẹ.
3. **Component LiveTimeline**: Xây dựng cột nhật ký với logic format câu tiếng Việt.
4. **Tích hợp Dashboard**: Cập nhật `src/routes/_app.index.tsx` để chèn 2 thành phần mới.
