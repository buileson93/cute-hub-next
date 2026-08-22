# 31. Nhật ký kiểm toán & Rollback

Đường dẫn: `/admin/audit`, chi tiết lấp/tháo tại `/admin/audit/lap-thao`.

## Nội dung ghi

Mỗi thay đổi CSDL (INSERT/UPDATE/DELETE) trên các bảng chính đều ghi:

- `who` (user_id, tên).
- `when` (timestamp).
- `where` (bảng, ID bản ghi).
- `what`: **từng trường** — giá trị cũ / giá trị mới (JSONB diff).
- `via` (route / RPC / tool AI).

## Xem log

1. `/admin/audit` → bảng lọc theo bảng, user, khoảng thời gian.
2. Bấm dòng → drawer hiển thị diff đẹp mắt (đỏ = cũ, xanh = mới).

## Rollback

1. Trong drawer, bấm **Rollback bản ghi này**.
2. Xác nhận lý do.
3. Hệ thống áp giá trị cũ; đồng thời tạo bản ghi audit mới với `action=rollback`.

## Rollback hàng loạt

- Chọn nhiều dòng → **Rollback theo phiên** (theo timestamp gần nhau + cùng user).

## Bảo mật

- Log không thể sửa (append-only).
- Chỉ role admin xem được.
