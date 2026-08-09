# Kế hoạch Cải thiện UI/UX MIRATS 2.0 (Tiếp tục)

Người dùng yêu cầu tiếp tục kế hoạch cải thiện UI/UX và cập nhật văn bản thông báo trạng thái vào giao diện.

## Giai đoạn Hiện tại: Cập nhật Trạng thái & Triển khai Giai đoạn 2 & 4.2

### 1. Cập nhật Văn bản Giao diện (Yêu cầu cụ thể)
- Cập nhật `src/components/mirats/TzClock.tsx`: Thay thế mô tả hoặc nhãn liên quan đến "language selector" (ở đây tôi sẽ đặt vào tooltip hoặc thay đổi text hiển thị ở menu múi giờ để chứa thông báo này) bằng văn bản:
  > đã triển khai Tôi đã triển khai giai đoạn đầu của kế hoạch cải thiện UI/UX MIRATS 2.0, tập trung vào tính an toàn và hệ thống Khung nhìn (View Presets):
  > 
  > 1. Hạ tầng Xuất báo cáo an toàn (N1): Nâng cấp TableExportDialog.tsx đế người dùng chủ động chọn xuất "Toàn bộ cột hệ thống" hoặc "Cột đang hiển thị", tránh mất dữ liệu khi dùng các khung nhìn rút gọn.
  > 2. Hệ thống View Presets (Giai đoạn 1):
  > 
  > Mở rộng use-column-prefs.ts để hỗ trợ lưu trữ và chuyển đổi nhanh giữa các Preset.
  > 
  > Định nghĩa bộ Preset cho danh mục thiết bị tại src/lib/mirats/ui/view-presets.ts bao gồm: Cơ bản (6 cột - mặc định), Vòng đời, Cấp phát, Nhà cung cấp, và Đầy đủ. đã 4.1 kiểm tra đã đúng chưa và làm tiếp gì

### 2. Triển khai Giai đoạn 2: Tái cấu trúc trang chi tiết tài sản
- **Mục tiêu**: Giảm tải nhận thức bằng cách gom 15 tab phẳng thành 5 nhóm nghiệp vụ chính: **Tổng quan**, **Vận hành**, **Hồ sơ & pháp lý**, **Cấu hình**, và **Nâng cao**.
- **Các bước thực hiện**:
    - Tách các tab hiện có trong `src/routes/_app.thiet-bi.$maThietBi.tsx` thành các component riêng lẻ.
    - Triển khai logic "ẩn tab con khi không có dữ liệu".
    - Thêm dải tóm tắt cố định (Sticky Summary Bar).

### 3. Triển khai Giai đoạn 4.2: Token trạng thái tập trung
- **Mục tiêu**: Nhất quán hóa hiển thị trạng thái trên toàn hệ thống.
- **Các bước thực hiện**:
    - Tạo `src/lib/mirats/ui/status-tokens.ts` khóa theo `ma_trang_thai`.
    - Cập nhật các component hiển thị trạng thái để dùng token mới.

## Câu hỏi làm rõ
Bạn muốn văn bản thông báo dài trên hiển thị ở vị trí nào cụ thể trong component `TzClock`? Hiện tại component này là đồng hồ và chọn múi giờ. Tôi có thể đưa nó vào phần chú thích cuối menu dropdown (thay cho dòng "Thời gian đồng bộ...") hoặc hiển thị dưới dạng Tooltip khi hover vào đồng hồ. Bạn thấy phương án nào hợp lý?
