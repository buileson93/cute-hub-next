# Kế hoạch khắc phục lỗi tạo tài khoản Admin và thêm người dùng mới

Người dùng báo lỗi không thể tạo tài khoản qua giao diện Admin và yêu cầu thêm 5 tài khoản mới cho cán bộ VATM.

## Phân tích nguyên nhân gốc rễ
Sau khi kiểm tra trigger `public.handle_new_user` trong cơ sở dữ liệu, phát hiện ra sự không khớp giữa mã nguồn ứng dụng và logic trigger:
- **Ứng dụng (`src/lib/admin-users.functions.ts`):** Gửi `ho_ten` trong trường `user_metadata`.
- **Database Trigger:** Mong đợi trường `full_name` từ `raw_user_meta_data`.
- **Hậu quả:** Tên người dùng không được lưu đúng cách hoặc quá trình tạo tài khoản bị gián đoạn nếu các bước update tiếp theo gặp lỗi.

## Các bước thực hiện

### 1. Sửa lỗi logic Backend
- Cập nhật hàm `createUser` trong `src/lib/admin-users.functions.ts` để sử dụng `full_name` thay vì `ho_ten` khi gọi `supabaseAdmin.auth.admin.createUser`.
- Đồng bộ danh sách `ROLES` và `DON_VI` giữa frontend và backend để tránh lỗi validate Zod.

### 2. Cập nhật dữ liệu yêu cầu
Thêm 5 tài khoản mới theo yêu cầu của người dùng:
1. `vuhongson@vatm.vn` (Vũ Hồng Sơn) - Vai trò: Phòng kỹ thuật
2. `trannguyenbaoanh@vatm.vn` (Trần Nguyễn Bảo Anh) - Vai trò: Phòng kỹ thuật
3. `tranquangvinh@vatm.vn` (Trần Quang Vinh) - Vai trò: Phòng kỹ thuật
4. `nguyenluonggiam@vatm.vn` (Nguyễn Lương Giám) - Vai trò: Phòng kỹ thuật
5. `doanhuutuan@vatm.vn` (Đoàn Hữu Tuấn) - Vai trò: Đảm bảo hoạt động

### 3. Kiểm tra và xác nhận
- Chạy typecheck và build để đảm bảo không có lỗi cú pháp.
- Sử dụng Playwright để kiểm tra giao diện quản lý tài khoản, đảm bảo hiển thị đúng và có thể tạo mới.

## Chi tiết kỹ thuật

### Sửa đổi file `src/lib/admin-users.functions.ts`
```typescript
// Trước
const { data: created, error: authErr } = await supabaseAdmin.auth.admin.createUser({
  email: data.email,
  password: data.password,
  email_confirm: true,
  user_metadata: { ho_ten: data.ho_ten },
});

// Sau
const { data: created, error: authErr } = await supabaseAdmin.auth.admin.createUser({
  email: data.email,
  password: data.password,
  email_confirm: true,
  user_metadata: { full_name: data.ho_ten },
});
```

### Thêm tài khoản mới (sử dụng migration hoặc script)
Tôi sẽ tạo một bản ghi audit log và thực hiện thêm các tài khoản này thông qua giao diện hoặc script an toàn.
