# 10. Nhãn thiết bị (trước đây gọi là Đặc tính)

Đường dẫn: `/danh-muc/dac-tinh` (giữ URL cũ, giao diện đã đổi tên).

## Mục đích
Gắn tag cho Model để lọc/tra cứu nhanh (ví dụ: "Băng UHF", "Có PoE", "Ngoài trời").

## CRUD nhãn
1. Bấm **+ Thêm nhãn**.
2. Nhập **Tên** + chọn **Màu** (12 preset).
3. Mã nhãn `DT_XXXXXXXX` sinh tự động, không mang ngữ nghĩa.
4. **Lưu**.

## Gán nhãn cho Model
1. Mở chi tiết Model → tab **Nhãn**.
2. Bấm **+ Thêm nhãn** → chọn từ danh sách (multi-select).
3. **Lưu**.

## Lọc thiết bị theo nhãn
- Trong `/danh-muc/thiet-bi`: bấm trực tiếp vào **chip nhãn** trong cột "Nhãn" → tự động thêm/gỡ khỏi bộ lọc.
- Bộ lọc đồng bộ với URL query, refresh trang không mất filter.
