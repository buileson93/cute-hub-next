# Plan: Sửa lỗi cắt dữ liệu và khôi phục thông tin Cây hệ thống (T30)

Người dùng báo cáo dữ liệu trên trang Cây hệ thống bị thiếu. Qua khảo sát, bảng `he_thong_thanh_phan` đã vượt ngưỡng 1000 dòng (1185 dòng), trong khi `thiet_bi` đang ở mức 832 dòng (sắp chạm ngưỡng). Truy vấn hiện tại không phân trang, dẫn đến nguy cơ mất dữ liệu im lặng. Ngoài ra, một số thông tin tổng hợp và tầng phân cấp trong cây đang bị thiếu so với bản cũ.

## Phân tích thực trạng
- **Lỗi cắt dữ liệu:** Truy vấn `thiet_bi` tại `src/routes/_app.he-thong.cay.tsx` dùng `.select()` trực tiếp mà không có `.range()`, sẽ bị PostgREST giới hạn 1000 dòng.
- **Biến `groupMode`:** Đang khai báo trong `queryKey` nhưng không sử dụng trong logic fetch, gây lãng phí cache.
- **Thiếu `tpCount`:** Con số tổng số thành phần hệ thống đã bị xóa khỏi giao diện.
- **Cấu trúc cây:** Hàm `buildTree` hiện tại nhận 4 tham số chính, nghi ngờ thiếu tầng "Lĩnh vực" (`lvMind`) và "Tài sản" (`tbMind`) so với thiết kế cũ.

## Các bước thực hiện

### 1. Sửa lỗi truy vấn thiết bị (Pagination & Safety)
- Áp dụng khuôn mẫu `fetchAll` từ `he-thong-thanh-phan.ts` vào `useQuery` của thiết bị.
- Sử dụng vòng lặp `for(;;)` với `.range(from, from + pageSize - 1)` để lấy toàn bộ dữ liệu.
- **Bảo hiểm:** Thêm `console.warn` nếu số lượng dòng lấy được chia hết cho 1000 để cảnh báo nguy cơ bị cắt (dù đã có vòng lặp nhưng vẫn là một lớp kiểm tra tốt).

### 2. Xử lý biến `groupMode`
- Kiểm tra lịch sử code (nếu có dấu vết) hoặc xác nhận trạng thái hiện tại.
- Nếu không có logic phân loại theo đơn vị:
    - Loại bỏ `groupMode` khỏi `queryKey`.
    - Đổi `let q` thành `const q` trong hàm fetch.
    - Ghi nhận vào báo cáo về việc chức năng này hiện chưa hoạt động.

### 3. Khôi phục `tpCount` (Tổng thành phần)
- Thêm một `useQuery` mới để đếm tổng số dòng trong bảng `he_thong_thanh_phan`.
- Sử dụng `.select("id", { count: "exact", head: true })` để tối ưu hiệu năng.
- Hiển thị con số này trên `PageHeader` (subtitle hoặc một phần của description).

### 4. Kiểm chứng cấu trúc cây (buildTree)
- Đọc kỹ `src/components/mirats/he-thong-cay/utils.ts` để xác định các tầng hiện có.
- Trả lời câu hỏi: Cây hiện có bao nhiêu tầng? Thiếu tầng nào so với kỳ vọng?
- *Lưu ý: Không tự ý thêm tầng mới trong task này, chỉ báo cáo.*

### 5. Kiểm tra và Hoàn thiện
- Chạy `npx tsc --noEmit` để đảm bảo không có lỗi type.
- Chạy `npm run test` để kiểm tra các regression lỗi.
- Báo cáo chi tiết số dòng thực tế và các thay đổi đã thực hiện.

## Phạm vi thay đổi
- `src/routes/_app.he-thong.cay.tsx`

## Tiêu chí hoàn thành (Definition of Done)
- Truy vấn thiết bị lấy được > 1000 dòng thành công.
- Không còn lãng phí cache cho `groupMode` nếu không dùng.
- Tổng số thành phần xuất hiện lại trên tiêu đề trang.
- Có câu trả lời chính xác về các tầng của cây.
- Build và Test pass.
