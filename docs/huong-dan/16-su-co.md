# 16. Báo sự cố & Biên bản ban đầu

Đường dẫn: `/su-co` (danh sách), `/su-co/moi` (tạo).

## Tạo sự cố
1. Từ Sidebar → **Sự cố** → **+ Báo sự cố**.
2. Điền form:
   - **Hệ thống / Thiết bị bị ảnh hưởng** (chọn từ dropdown, gõ mã `TB_` để tìm).
   - **Thời điểm phát hiện**.
   - **Mức độ**: Nhẹ / Trung bình / Nặng / Khẩn cấp.
   - **Mô tả hiện tượng**.
   - **Ảnh hiện trường** (paste clipboard).
3. **AI hỗ trợ (Beta)**:
   - Dán nguyên đoạn mô tả dài vào nút **AI** ở đáy form.
   - AI tự tách các trường: thiết bị, mức độ, hiện tượng.
   - Xem [28](./28-ai-parse-su-co.md).
4. Bấm **Lưu & tạo Biên bản ban đầu**.

## Xuất biên bản
- Form biên bản ban đầu (BÁO CÁO BAN ĐẦU) tự sinh.
- Bấm **Xuất Word** — file .docx theo template.

## Vòng đời sự cố
`Mới` → `Đang xử lý` → `Đã khắc phục` → `Đóng`.

Chuyển trạng thái ở drawer chi tiết. Mỗi lần đổi trạng thái, `StatusBadge` cập nhật realtime toàn app.

## Đồng bộ lý lịch
- Sự cố tự động ghi vào Sổ lý lịch thiết bị + Sổ lý lịch hệ thống chứa thiết bị.
- Xóa sự cố → chỉ soft-delete (RPC), giữ lịch sử.

## Metrics
- MTTR / MTBF tính từ dữ liệu sự cố + bảo dưỡng, xem KPI Overview.
