# Kế hoạch Task T10: Chốt số phận @tanstack/react-virtual

Dựa trên khảo sát thực tế codebase và dữ liệu:
1. **Số lượng dữ liệu:** `ThanhPhanTable` (bảng lớn nhất) hiện đang xử lý khoảng ~828 tài sản (theo tài liệu) và ~1.234 dòng mã với 56 cột.
2. **Cơ chế hiện tại:** `StandardTable` đã có sẵn phân trang phía client (`pageSize` mặc định 50, tối đa 200 hoặc "Tất cả").
3. **Sử dụng thực tế:** Gói `@tanstack/react-virtual` đang có trong `package.json` nhưng **không được sử dụng** ở bất kỳ đâu trong `src/` (0 kết quả tìm kiếm).
4. **Hiệu năng:** Ngưỡng 1.000 dòng dữ liệu là điểm gãy để cân nhắc ảo hóa. Với ~828 dòng và cơ chế phân trang hiện tại, việc ảo hóa thêm vào một bảng có 56 cột và nhiều logic chỉnh sửa dòng (Inline Edit) sẽ làm tăng độ phức tạp không đáng có và rủi ro gây lỗi cho 33 màn hình dùng chung.

**Kết luận:** Khuyến nghị **GỠ BỎ** gói `@tanstack/react-virtual` để giảm nợ kỹ thuật và làm sạch `package.json`.

## Các bước thực hiện
1. **Đo đạc trước khi gỡ:** Chạy build và ghi lại kích thước gói (đã thực hiện: max chunk 256.5 KB gzip).
2. **Gỡ bỏ gói:** Xóa `@tanstack/react-virtual` khỏi `package.json`.
3. **Đo đạc sau khi gỡ:** Chạy build lại và so sánh số liệu với `perf-budget.mjs`.
4. **Kiểm tra kiểu dữ liệu:** Đảm bảo `npx tsc --noEmit` vẫn sạch.

## Dự kiến kết quả
- `package.json`: Loại bỏ 1 dependency dư thừa.
- Kích thước bundle: Giảm nhẹ hoặc không đổi đáng kể (do Vite treeshaking tốt), nhưng sạch mã nguồn.
- Độ ổn định: Không ảnh hưởng vì gói chưa từng được dùng.
