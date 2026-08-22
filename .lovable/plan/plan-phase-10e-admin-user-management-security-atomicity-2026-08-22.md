# Plan: Phase 10E — Admin User Management Security & Atomicity

Mục tiêu: Đảm bảo tính nguyên tử (atomicity) cho các thao tác quản trị tài khoản, thực thi chính sách bảo mật mật khẩu đồng nhất, và ngăn chặn các lỗi vận hành như xóa admin cuối cùng hoặc tự khóa tài khoản.

## 1. Thiết lập hạ tầng và Test (TDD)
- Tạo `src/lib/__tests__/admin-users-security.test.ts` để tái hiện các lỗi:
    - Partial failure: Tạo Auth User thành công nhưng Profile/Role lỗi (phải được cleanup hoặc đánh dấu lỗi).
    - Quyền Admin: Không thể tự tước quyền admin của bản thân hoặc xóa Admin cuối cùng.
    - Phân trang: Đảm bảo danh sách hiển thị đúng khi có > 200 users (listUsers hiện tại dùng perPage=200).
- Tạo test kiểm tra tính nguyên tử của RPC cập nhật profile + roles.

## 2. Bảo mật Database & RPC (Atomicity)
- Tạo migration mới:
    - Thêm hàm RPC `update_user_full` (SECURITY DEFINER) để thực hiện `UPDATE profiles` và `DELETE/INSERT user_roles` trong một transaction duy nhất.
    - Cập nhật hàm `has_role` hoặc thêm logic kiểm tra "admin cuối cùng" ở mức DB để ngăn chặn xóa nhầm.
    - RLS: Đảm bảo `api_keys` và `audit_log` chỉ admin được đọc/ghi nhạy cảm.
- Cập nhật `src/lib/admin-users.functions.ts`:
    - Thay thế logic update profile + roles tuần tự bằng gọi RPC `update_user_full`.
    - Triển khai Saga/Compensation cho `createUser`: Nếu các bước DB sau `auth.admin.createUser` lỗi, thực hiện `auth.admin.deleteUser` để tránh mồ côi (orphaned) auth users.
    - Cập nhật `listUsers` để handle phân trang hoặc loop gọi `listUsers` cho đến khi hết user từ Auth.

## 3. Đồng bộ Chính sách Bảo mật
- Thống nhất độ dài mật khẩu tối thiểu (8 ký tự) trong:
    - Zod schema tại `src/lib/admin-users.functions.ts`.
    - Validation tại `src/routes/admin.users.tsx`.
- Cập nhật `src/routes/admin.users.tsx`:
    - `UserForm`: Password input dùng `type="password"`, thêm nút "Show/Hide".
    - Thêm Accessible Label (`aria-label`) cho các icon-only buttons (Reset password, Lock/Unlock).
    - Thêm hộp thoại xác nhận (Confirmation Dialog) yêu cầu nhập email khi xóa hoặc tước quyền Admin.

## 4. Kiểm toán và Log (Audit)
- Đảm bảo `audit_log` luôn được ghi sau mỗi hành động Admin thành công.
- Log phải bao gồm `actor_id`, `action`, `target_user_id` và metadata chi tiết.

## Thông số kỹ thuật
- **Atomic Operation**: `update_user_full(target_uid, ho_ten, don_vi, new_roles[])`
- **Password Policy**: Min 8 chars, mixed case recommended.
- **Admin Guard**: Logic `SELECT count(*) FROM user_roles WHERE role = 'admin'` trước khi cho phép tước quyền.
- **Auth Sync**: Xử lý `banned_until` đồng bộ giữa Auth và Profile `active`.
