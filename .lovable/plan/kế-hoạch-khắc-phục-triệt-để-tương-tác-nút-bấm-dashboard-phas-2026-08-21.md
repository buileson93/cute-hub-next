# Kế hoạch: Khắc phục triệt để tương tác nút bấm Dashboard (Phase U7.4)

Dựa trên báo cáo "Systematic Debugging", kế hoạch này tập trung vào việc mở rộng vùng bấm, loại bỏ lỗi overlap CSS và tối ưu hóa phản hồi người dùng cho các nút có label.

## Phân tích nguyên nhân Confirmed
1. **Hitbox nhỏ:** Kích thước đo được 34x16px là quá nhỏ cho một nút chức năng chính trên Desktop.
2. **Overlap Span:** Logic `renderContent` trong `Button.tsx` đang lồng quá nhiều `span` khiến `pointer-events` bị phân tán.
3. **Debounce Lag:** `useUserPref` gây độ trễ 500ms làm người dùng cảm thấy nút "không hoạt động" khi dữ liệu chưa kịp đồng bộ.

## Các bước thực hiện

### 1. Cải thiện Button Hitbox & Content (Logic Presentation)
- **File:** `src/components/ui/button.tsx`
- **Thay đổi:** 
    - Đơn giản hóa `renderContent` để text nằm trực tiếp hơn trong DOM.
    - Ép `min-height` cho các size `default/sm` trên Desktop để đảm bảo vùng bấm ít nhất 32px thực tế (không chỉ là line-height).
    - Thêm `pointer-events-none` cho tất cả icon/text bên trong để event nổi lên (bubble) thẳng tới thẻ `button`.

### 2. Tái cấu trúc PageHeader Action Container
- **File:** `src/components/mirats/PageHeader.tsx`
- **Thay đổi:** Loại bỏ `self-center` và thay bằng `items-stretch` hoặc `items-center` với `min-h` cố định để các nút không bị co rúm theo nội dung text ngắn.

### 3. Tăng cường Phản hồi UI (Operation Logic)
- **File:** `src/routes/_app.index.tsx`
- **Thay đổi:** 
    - Thêm trạng thái `loading` giả lập hoặc `transition` màu sắc ngay lập tức khi bấm "Khôi phục" để át đi độ trễ 500ms của debounce DB.
    - Sử dụng `toast.loading` cho các tác vụ `setLayout` để người dùng biết hệ thống đang xử lý.

## Kế hoạch xác minh
- **Playwright:** Chạy lại `inspect_dashboard_buttons.py` và kiểm tra `rect` sau khi sửa. Mục tiêu: `rect.height >= 32` và `rect.width >= 80` cho nút có label.
- **Manual:** Kiểm tra cảm giác bấm (tactile feedback) trên preview.
