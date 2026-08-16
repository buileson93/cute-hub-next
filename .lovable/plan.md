# MIRATS ASTRYX SAFE MIGRATION — P8/9: SHELL + FULL ROUTE ROLLOUT

## Bối cảnh
Hoàn tất việc chuẩn hóa giao diện MIRATS 2.0 bằng cách chuyển đổi AppShell và toàn bộ 129 route sang hệ thống token/component của Astryx. Đảm bảo giữ nguyên 100% logic nghiệp vụ, quyền hạn (RBAC), và các tính năng tương tác đặc thù (Product Tour, Sidebar state, Realtime status).

## Mục tiêu
1. **Shell Visual-Only Refactor**: Cập nhật `AppShell`, `Sidebar`, `TopBar`, `MobileNav` để sử dụng token Astryx (Typography, Spacing, Radius, Border) mà không thay đổi logic state/handlers.
2. **Full Route Inventory**: Lập danh sách 129 route và theo dõi tiến độ chuyển đổi.
3. **Phân nhóm & Rollout**: Chuyển đổi giao diện theo từng batch (tối đa 5 route) dựa trên chức năng (Dashboard, Table, Detail, Form, v.v.).

## Các bước thực hiện

### 1. Chuẩn bị & Inventory (P8.1)
- Tạo `docs/astryx-route-progress.md` liệt kê đầy đủ 129 route từ `src/routes`.
- Phân loại trạng thái: `[ ] Chưa làm`, `[~] Đang làm`, `[x] Xanh (Astryx)`, `[L] Giữ Legacy (có lý do)`.
- Chụp baseline screenshots các trạng thái của AppShell: Desktop/Tablet/Mobile, Light/Dark, Compact/Comfortable.

### 2. Shell Retheming (P8.2)
- **AppShell (`src/components/mirats/app-shell/AppShell.tsx`)**:
  - Thay thế class Tailwind thủ công bằng token `astryx-*` (ví dụ: `bg-sidebar` -> `bg-surface-sunken`).
  - Áp dụng Typography Astryx (`astryx-text-body`, `astryx-text-label`).
- **Sidebar (`src/components/mirats/app-shell/Sidebar.tsx`)**:
  - Cập nhật active indicator và hover states theo Astryx visual language.
  - Tích hợp `astryx-nav-item` hoặc tương đương.
- **TopBar & MobileNav**:
  - Token hóa thanh tìm kiếm, NotificationBell, và các icon action.

### 3. Rollout theo Batch (P8.3 - P8.X)
Chia 129 route thành các đợt (Batches):
- **Batch 1-5**: Dashboard và các trang Tổng quan KPI.
- **Batch 6-20**: Danh mục thiết bị, Hệ thống (Table-heavy routes).
- **Batch 21-40**: Chi tiết thiết bị/hệ thống (Tab-heavy routes).
- **Batch 41-70**: Các form nghiệp vụ (Bảo trì, Sự cố, Hỏng hóc).
- **Batch 71-129**: Các trang Quản trị, Báo cáo, Tin nhắn, và Sơ đồ đặc thù.

**Nguyên tắc chuyển đổi từng route**:
1. Thay `PageHeader`, `PageBody`, `Section` bằng wrapper MiratsAstryx đã tạo ở P5.
2. Token hóa các phần tử text (`Heading`, `Text`).
3. Giữ nguyên thư viện đặc thù (React Flow, Recharts) nhưng cập nhật theme màu/tooltip để đồng bộ.

## Ràng buộc kỹ thuật
- **Không thay đổi logic**: Loader, Query, Mutation, Permission giữ nguyên.
- **Không gộp route**: Không xóa các file route hiện có dù trông có vẻ trùng lặp.
- **Side-by-side verification**: Chạy typecheck và build sau mỗi batch.

## Tiêu chí hoàn thành
- [ ] Toàn bộ 129 route được đánh dấu `[x]` hoặc `[L]` trong progress doc.
- [ ] AppShell đồng bộ visual với Astryx theme VATM.
- [ ] Sidebar collapse/expand hoạt động mượt mà với localStorage.
- [ ] Không có lỗi runtime trên mobile viewport (390px).
