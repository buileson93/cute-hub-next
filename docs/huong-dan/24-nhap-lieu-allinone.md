# 24. Nhập liệu Excel All-in-one

Đường dẫn: `/nhap-lieu`.

## Tải mẫu
1. Bấm **Tải mẫu All-in-one**.
2. File `.xlsx` gồm 11 sheet layer:
   - Phân loại, Ngành, Nhóm, Hệ thống, Vị trí, Thành phần HT, Thiết bị, Model, Chủng loại, Nhãn, Đơn vị.
3. Mỗi cột có **dropdown validation** để chọn giá trị hợp lệ, tránh nhập sai.

## Điền dữ liệu
1. Bắt đầu từ layer cao (Đơn vị → Chủng loại → Model) rồi mới xuống Thiết bị.
2. Cột bắt buộc bôi màu vàng.
3. Cột `id` để trống → hệ thống tự sinh mã `TB_`, `TPHT_`, `DT_`…
4. Ngày định dạng `YYYY-MM-DD`.

## Nhập vào hệ thống
1. Vào `/nhap-lieu` → **Chọn file**.
2. Hệ thống hiển thị **Preview dialog** với từng sheet:
   - Số dòng hợp lệ.
   - Số dòng lỗi (kèm lý do).
   - Model tự tạo mới (đánh dấu vàng — bổ sung sau).
3. Bấm **Xác nhận nhập** — chạy bulk import trong transaction.
4. Xem toast tóm tắt (thành công / lỗi / tự tạo).

## Roundtrip test
- File xuất và file nhập là **cùng schema** — bạn có thể xuất → sửa → nhập lại an toàn.
- Cột `dac_tinh` (cũ) tự map sang `nhan_thiet_bi`.
