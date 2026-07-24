# 29. Forms động (biểu mẫu tùy biến)

Đường dẫn quản trị: `/admin/forms`. Người dùng chọn form tại `/forms`.

## Vì sao có Forms động
Mỗi loại hệ thống có phiếu bảo dưỡng / phiếu sự cố khác nhau (AWOS PL01–PL04, DVOR, HF, VHF…). Forms động cho phép Admin cấu hình mẫu mà không cần lập trình.

## Admin — tạo form
1. `/admin/forms` → **+ Form mới**.
2. Đặt **Mã form** (ví dụ `AWOS_PL01`) + **Tên**.
3. Kéo thả các field:
   - Text, Textarea, Number, Date, Select, Multi-select, Checkbox, Table, Image, Signature.
4. Cấu hình:
   - Bắt buộc / tùy chọn.
   - Validation regex.
   - Điều kiện hiển thị (`showIf`).
5. Đính kèm **Template Word** để xuất biên bản.
6. **Publish**.

## Người dùng — điền form
1. `/forms/new/{code}` hoặc từ mục Bảo dưỡng chọn hệ thống có form gắn sẵn.
2. Điền các trường → **Lưu nháp** hoặc **Nộp**.
3. Bấm **Xuất Word** để tải biên bản.

## Xem lại
- `/forms/submissions/{id}` — lịch sử bản nộp.
