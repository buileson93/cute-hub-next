# 06. Danh mục Vị trí

Đường dẫn: `Danh mục → Vị trí` (`/danh-muc/vi-tri`).

## Khái niệm

Vị trí (Position) là **chỗ lắp cố định** trong sơ đồ hệ thống (ví dụ: "Rack A1 - Slot 3"). Thiết bị vật lý được **gán** vào vị trí, không phải ngược lại (mô hình 3 lớp: Hệ thống ↔ Vị trí ↔ Thiết bị vật lý).

## Tạo vị trí

1. Vào `/danh-muc/vi-tri` → **+ Thêm vị trí**.
2. Điền:
   - **Mã vị trí** `TPHT_XXXXXXXX` (auto-generate nếu để trống).
   - **Tên vị trí**.
   - **Thuộc hệ thống**.
   - **Chức năng chuẩn** (loại chủng loại được phép lắp tại đây).
3. **Lưu**.

## Gán thiết bị vào vị trí

1. Mở chi tiết vị trí.
2. Bấm **Gán thiết bị** → chọn thiết bị vật lý (`TB_XXXXXXXX`).
3. Bấm **Xác nhận** — hệ thống tạo bản ghi `gan_chuc_nang` với `active=true`.
4. Muốn tháo: bấm **Tháo khỏi vị trí** → bản ghi được set `active=false` (giữ lịch sử).

## Lịch sử lắp/tháo

- Tab **Lịch sử** hiển thị timeline mọi lần thiết bị vào/ra vị trí này.
