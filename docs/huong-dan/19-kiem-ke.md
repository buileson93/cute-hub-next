# 19. Kiểm kê định kỳ (QR)

Đường dẫn: `/kiem-ke`.

## Chuẩn bị

- Mỗi thiết bị có QR gắn nhãn dạng `/q/{ma_thiet_bi}`.
- Chu kỳ kiểm kê cấu hình theo chủng loại (mặc định 6 tháng).

## Kiểm kê thiết bị đơn lẻ

1. Mở camera điện thoại → quét QR trên thiết bị.
2. Route `/q/{TB_XXXXXXXX}` mở form kiểm kê nhanh.
3. Bấm **Xác nhận có mặt** — RPC `ghi_kiem_ke(ma_thiet_bi, tinh_trang, ghi_chu)` được gọi.
4. Hệ thống tự cập nhật:
   - `thiet_bi.ngay_kiem_ke_ke_tiep = today + chu_ky_kiem_ke`.
   - Thêm bản ghi vào bảng `kiem_ke`.

## Chiến dịch kiểm kê hàng loạt

1. Vào `/kiem-ke` → **+ Tạo chiến dịch**.
2. Chọn phạm vi (Đơn vị / Hệ thống).
3. Hệ thống liệt kê danh sách thiết bị.
4. Cán bộ quét từng thiết bị — tiến độ hiển thị realtime.
5. Bấm **Kết thúc chiến dịch** → xuất báo cáo tồn/mất/hỏng.

## Cảnh báo

- Thiết bị có `ngay_kiem_ke_ke_tiep` < today → hiện trong `/sap-het-han` tab **Kiểm kê**.
