# 27. MIRATS AI

## Mở AI
- `⌘K` → gõ câu hỏi → chọn **Ask MIRATS AI**.
- Hoặc bấm chip **AI** trên nút Command Palette nổi.

## Ví dụ câu hỏi
- "Liệt kê thiết bị UHF có bảo hành sắp hết trong 60 ngày tại Đơn vị A."
- "Hệ thống X hiện đang có bao nhiêu sự cố mở?"
- "MTBF trung bình của Switch Cisco trong 6 tháng qua."
- "Tạo phiếu bảo dưỡng cho hệ thống Y ngày mai."

## 16 tool AI có sẵn
Truy vấn / thao tác trực tiếp: thiết bị, model, chủng loại, sự cố, bảo dưỡng, hỏng hóc, giấy phép, kiểm định, kiểm kê, bàn giao, người dùng, cấu hình, ghi chú, sơ đồ, network, form.

## Data Dictionary
AI được "grounding" bằng `docs/data-dictionary.md` và `TERMINOLOGY_MAP` — nó hiểu:
- "Tài sản" ↔ bảng `thiet_bi`.
- "Chủng loại" ↔ `loai_thiet_bi`.
- "Nhãn" ↔ `dac_tinh` (giữ tên bảng cũ, UI đã đổi).

## An toàn
- Mọi thao tác **ghi** (create/update/delete) đều yêu cầu xác nhận trong hộp thoại.
- AI không có quyền vượt RLS — chỉ thấy dữ liệu bạn được thấy.
