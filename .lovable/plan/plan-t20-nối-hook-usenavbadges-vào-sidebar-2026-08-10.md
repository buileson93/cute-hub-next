# Plan - T20: Nối hook useNavBadges vào Sidebar

Khôi phục hiển thị số lượng công việc cần xử lý (huy hiệu/badge) trên menu sidebar bằng cách kết nối hook `useNavBadges` có sẵn.

## 1. Logic dữ liệu (Sidebar.tsx)

- Import `useNavBadges` từ `@/hooks/use-nav-badges`.
- Gọi `const badges = useNavBadges()` ở đầu component `Sidebar`.
- Chuẩn bị hàm helper `formatBadgeCount(count: number): string` để chuyển đổi số lượng thành "99+" nếu > 99.

## 2. Hiển thị Huy hiệu (Badge UI)

- Thay thế khối `div` chấm tròn hiện tại bằng logic hiển thị mới:
  - **Điều kiện hiển thị:** `item.badgeKey` tồn tại VÀ `badges[item.badgeKey] > 0`.
  - **Trạng thái mở rộng (`!collapsed`):**
    - Hiển thị con số (hoặc "99+").
    - Style: `ml-auto flex h-5 min-w-5 items-center justify-center rounded-full bg-primary/10 px-1 text-[10px] font-bold text-primary`.
    - Trợ năng: `aria-label={`${badges[item.badgeKey]} việc cần xử lý`}`.
  - **Trạng thái thu gọn (`collapsed`):**
    - Hiển thị một chấm tròn nhỏ ở góc trên bên phải biểu tượng (icon).
    - Style: `absolute -right-0.5 -top-0.5 h-2 w-2 rounded-full border-2 border-sidebar bg-primary`.
    - Cần bọc Icon trong một `div` có `relative` để đặt chấm tròn.

## 3. Kiểm thử và Xác minh

- Chạy `npx tsc --noEmit` để kiểm tra kiểu dữ liệu.
- Chạy `npm run test` để đảm bảo không có lỗi hồi quy.
- Kiểm tra thủ công:
  - Khi có sự cố mới, mục "Sự cố kỹ thuật" hiện số tương ứng.
  - Khi số lượng về 0, huy hiệu biến mất.
  - Chuyển đổi trạng thái thu gọn sidebar để xem chấm tròn thông báo.

---

_Lưu ý: Không sửa hook, không sửa cấu hình menu, không dùng màu cứng #xxxxxx._
