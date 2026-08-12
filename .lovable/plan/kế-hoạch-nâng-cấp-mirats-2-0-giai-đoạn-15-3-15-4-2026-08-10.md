# Kế hoạch Nâng cấp MIRATS 2.0 - Giai đoạn 15.3 & 15.4

Tiếp nối việc hoàn thành Giai đoạn 15.1 (Nền tảng thị giác) và 15.2 (Cây hệ thống & Thành phần), kế hoạch này tập trung vào việc tối ưu hóa luồng tác nghiệp và khả năng vận hành tại hiện trường.

## Giai đoạn 15.3: Hợp nhất Dashboard & Chuẩn hóa Form (Wizard)

Mục tiêu: Loại bỏ sự chồng chéo thông tin giữa hai trang tổng quan và giảm bớt sự phức tạp của các biểu mẫu nhập liệu dài.

### 15.3.1: Phân định vai trò Dashboard
- **Trang chủ (`/_app/index`) - Action Center:**
  - Tập trung vào: "Hôm nay tôi phải làm gì?".
  - Hiển thị: Danh sách việc cần làm (Overdue PM, Open Incidents), các cảnh báo sắp hết hạn (Giấy phép, Kiểm định).
  - Dạng danh sách rút gọn có link drill-down thay vì biểu đồ lớn.
- **Trang Tổng quan (`/_app/tong-quan`) - Analytics:**
  - Tập trung vào: "Xu hướng dài hạn".
  - Hiển thị: Heatmap sự cố, biểu đồ xu hướng 12 tháng, phân bổ trạng thái tài sản.
  - Xóa bỏ các widget trùng lặp từ trang chủ.

### 15.3.2: Biểu mẫu Wizard (3 bước)
- Áp dụng cho: `SuCoMoiForm` và `BaoTriMoiForm`.
- Cấu trúc 3 bước:
  1. **Thông tin cơ bản (Bắt buộc):** Các trường tối thiểu để khởi tạo.
  2. **Chi tiết kỹ thuật:** Các thông số đo đạc, mô tả chi tiết.
  3. **Xác nhận & Tệp đính kèm:** Xem lại và tải lên ảnh/hồ sơ.
- Tính năng bổ sung: Inline validation (kiểm tra ngay tại trường) và lưu nháp tự động.

### 15.3.3: Chuẩn hóa trang chi tiết bản ghi
- Áp dụng bố cục nhất quán cho chi tiết Sự cố, Bảo trì, Hỏng hóc:
  - Header: Trạng thái & Action buttons.
  - Body: Tổng quan -> Diễn tiến (Timeline) -> Tệp tin -> Thông tin kỹ thuật.

## Giai đoạn 15.4: Tối ưu Hiện trường & Điều hướng (Mobile First)

Mục tiêu: Đảm bảo hệ thống hoạt động tốt trên máy tính bảng/điện thoại và cải thiện tốc độ truy cập tính năng.

### 15.4.1: StandardTable Responsive
- Tự động chuyển sang **Card mode** trên màn hình nhỏ (< 768px).
- Áp dụng `hideBelow` cho các cột phụ dựa trên View Preset.

### 15.4.2: Trang Hiện trường (QR Code)
- Nâng cấp `/_app/q/$maThietBi` thành trung tâm điều hành tại chỗ.
- Nút bấm lớn (Touch-friendly), hiển thị thông tin sức khỏe tức thời và 3 tác vụ nhanh: Báo sự cố, Ghi bảo trì, Xem sổ lý lịch.

### 15.4.3: Tái cấu trúc AppShell & Command Palette
- Tách `AppShell.tsx` thành các component nhỏ: `Sidebar`, `TopBar`, `NavGroups`.
- Cấu hình điều hướng tập trung tại `nav-config.ts`.
- `CommandPalette` (Cmd+K): Nhóm kết quả theo loại (Thiết bị, Hệ thống, Hành động) và hiển thị lịch sử truy cập gần đây.

## Tiêu chí hoàn thành (DoD)
- [ ] Không còn widget trùng lặp giữa Dashboard và Tổng quan.
- [ ] Các form chính (Sự cố, Bảo trì) sử dụng giao diện Wizard.
- [ ] Toàn bộ 105 route hiển thị tốt (không tràn) trên màn hình 768px.
- [ ] Trang QR hiện trường thao tác được bằng một tay.
