# 05. Danh mục Đơn vị

Đường dẫn: `Danh mục → Đơn vị` (`/danh-muc/don-vi`).

## Mục đích

Quản lý các đơn vị (phòng ban / trạm / cơ sở) sở hữu thiết bị. Dữ liệu này gắn với **phạm vi (scope)** của người dùng.

## Thêm đơn vị

1. Bấm **+ Thêm đơn vị** trên PageHeader.
2. Nhập:
   - **Mã đơn vị** (bắt buộc, duy nhất).
   - **Tên đầy đủ**.
   - **Đơn vị cha** (nếu là chi nhánh).
   - **Địa chỉ, SĐT** (tùy chọn).
3. Bấm **Lưu**.

## Sửa

1. Trên bảng, bấm menu `⋯` cuối dòng → **Sửa**.
2. Thay đổi các trường → **Lưu**.
3. Mọi thay đổi được ghi vào Audit log (xem [31](./31-audit-rollback.md)).

## Xóa

- Chỉ xóa được khi đơn vị không có thiết bị/người dùng gán vào.
- Nếu bị chặn, dùng chức năng **Ngưng hoạt động** thay thế.

## Bulk edit

1. Tick nhiều dòng.
2. Thanh BulkActionBar hiện dưới → chọn **Sửa hàng loạt**.
3. Xem tóm tắt thay đổi → **Xác nhận**.
4. Có thể **Hoàn tác** ngay sau đó.
