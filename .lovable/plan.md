# Kế hoạch tiếp tục Giai đoạn 13 & 14 (Hợp nhất Dashboard & Tái cấu trúc)

Người dùng yêu cầu kiểm tra trạng thái Giai đoạn 13 và tiếp tục nếu đã xong. Dựa trên rà soát mã nguồn, Giai đoạn 13 (tách AppShell, Sidebar, TopBar...) đã được thực hiện một phần nhưng cần hoàn thiện và chuyển sang Giai đoạn 14 (Hiện trường & Điều hướng) cũng như các yêu cầu về Dashboard hợp nhất.

## 1. Cập nhật giao diện (Text Edit)
- Thay đổi văn bản từ "language selector" (có thể là một placeholder hoặc mô tả linh kiện chọn múi giờ/ngôn ngữ) thành "kiểm tra nếu xong giai đoạn 13 thì tiếp tục". Do không tìm thấy chuỗi chính xác "language selector" trong mã nguồn hiện tại, tôi sẽ thêm nhãn này vào vị trí hợp lý trong `TopBar` hoặc `Sidebar` để làm chỉ báo trạng thái theo yêu cầu.

## 2. Hoàn thiện Giai đoạn 13 (Chi tiết bản ghi & Form)
- **Chuẩn hoá trang chi tiết**: Áp dụng layout chuẩn (Header, KPI, Tabs) cho các trang Sự cố, Bảo trì, Thiết bị.
- **Wizard Form**: Chuyển các form nhập liệu dài sang dạng Wizard 3 bước.

## 3. Triển khai Giai đoạn 14 (Hiện trường & Điều hướng)
- **Responsive Table**: Cập nhật `StandardTable` tự chuyển sang dạng Card trên mobile/tablet.
- **Trang quét QR**: Nâng cấp `src/routes/q.$maThietBi.tsx` với các nút thao tác lớn phù hợp hiện trường.
- **Offline Drafts**: Hỗ trợ lưu nháp khi mất mạng (dùng localStorage).

## 4. Hợp nhất Dashboard
- Hợp nhất `_app.index` và `_app.tong-quan` thành một trang Điều hành duy nhất với các KPI trực quan và biểu đồ xu hướng.

## Danh sách công việc cụ thể:
1.  **Chỉnh sửa văn bản**: Cập nhật nhãn trong `TopBar.tsx`.
2.  **Refactor Detail Pages**: Cập nhật `src/routes/_app.su-co.$maSuCo.tsx`, `src/routes/_app.bao-tri.$maBaoTri.tsx`.
3.  **Mobile optimization**: Cập nhật CSS/Component cho breakpoint 768px.
4.  **QR/Field View**: Cải thiện UX cho `q.$maThietBi`.
