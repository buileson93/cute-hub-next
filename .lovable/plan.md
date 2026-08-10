# Plan - T19: Khôi phục lọc quyền trong menu sidebar

Khôi phục tính năng lọc menu theo vai trò người dùng (AppRole) bị mất sau khi tách file, đảm bảo tính nhất quán giữa dữ liệu cấu hình (`nav-config.ts`) và hiển thị (`Sidebar.tsx`).

## 1. Cấu trúc dữ liệu (nav-config.ts)
- Cập nhật interface `NavItem` để bao gồm trường `roles?: AppRole[]`.
- Sửa hàm `toItem` để sao chép trường `roles` từ `nav-contract.ts` sang `nav-config.ts`.
- Đảm bảo các kiểu dữ liệu được import chính xác từ `@/hooks/use-session`.

## 2. Logic hiển thị (Sidebar.tsx)
- Thay thế hàm lọc giả `return true` bằng logic lọc thực thụ: `!item.roles || item.roles.some((r) => hasRole(r))`.
- Bọc logic `visibleItems` và `groups` trong `useMemo` với dependency `hasRole` để cập nhật khi phiên đăng nhập thay đổi.
- Đảm bảo các nhóm không có mục nào sau khi lọc sẽ không được render.

## 3. Kiểm thử và Xác minh
- Thêm test case vào `src/lib/mirats/__tests__/nav-config.test.ts` để khẳng định trường `roles` được bảo toàn qua `navGroups()`.
- Chạy `npx tsc --noEmit` để kiểm tra kiểu dữ liệu.
- Chạy `npm run test` để đảm bảo không có lỗi hồi quy (đặc biệt là `nav-config.test.ts`).
- Kiểm tra thủ công trên giao diện:
    - User thường không thấy menu Quản trị.
    - Admin thấy đầy đủ menu.

## 4. Báo cáo bảo mật
- Xác nhận trạng thái chặn route ở tầng Router (kiểm tra `nav-contract.ts` và các route guards hiện có).

---
*Lưu ý: Không thay đổi vai trò, không đụng RLS, không sửa `nav-contract.ts`.*
