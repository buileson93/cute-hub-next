# Kế hoạch: Khắc phục lỗi chồng lấn UI và hiển thị Icon Tìm kiếm (Phase U7.3)

Người dùng báo cáo các lỗi UI dai dẳng: các nút trong thanh công cụ dashboard bị chồng lấn và biểu tượng kính lúp bị mất trên Header. Phân tích cho thấy component `Button` đang thiếu thuộc tính `relative`, khiến các phần tử con định vị tuyệt đối (như spinner tải) bị sai lệch. Ngoài ra, các nút trên dashboard cần được chuẩn hóa để khớp với mô hình nút trên Header vốn đã ổn định hơn.

## Yêu cầu người dùng xem xét

> [!IMPORTANT]
> Tôi sẽ đơn giản hóa component `Button` và cấu trúc lại thanh công cụ dashboard để sử dụng cùng một logic với các nút trên Header.

- Bạn có muốn các nút trên dashboard có màu nền (như nút "Cá nhân hóa") hay giữ nguyên dạng ghost/outline như hiện tại? (Tôi sẽ giữ nguyên các variant hiện có nhưng sửa lại bố cục).

## Chi tiết kỹ thuật

### 1. Ổn định Component Button

- Sửa đổi `src/components/ui/button.tsx`:
  - Thêm `relative` vào `buttonVariants` để đảm bảo các phần tử con `absolute` được neo đúng vị trí.
  - Chuẩn hóa `renderContent` để ngăn chặn việc thay đổi bố cục bên trong khi trạng thái thay đổi.

### 2. Hiển thị Icon Tìm kiếm trên TopBar

- Sửa đổi `src/components/mirats/app-shell/TopBar.tsx`:
  - Đảm bảo icon `Search` có `flex-shrink: 0` và kích thước rõ ràng.
  - Kiểm tra độ tương phản màu sắc của icon search trên nền `bg-[#0074e2]/5`.

### 3. Cấu trúc lại Thanh công cụ Dashboard

- Sửa đổi `src/routes/_app.index.tsx`:
  - Cấu trúc lại container `flex` chứa "Thêm Widget", "Khôi phục", và "Cá nhân hóa".
  - Đảm bảo khoảng cách `gap-2` được duy trì và các mục không bị chồng lấn bằng cách loại bỏ các thuộc tính `absolute` hoặc margin âm gây xung đột.
  - Thêm `aria-label` cho tất cả các nút để tăng khả năng truy cập.

### 4. Đồng bộ hóa Style

- Kiểm tra `src/styles/astryx-component-skins.css` xem có class `astryx-control` nào đang ép chiều rộng cố định hoặc định vị tuyệt đối gây lỗi không.

## Kế hoạch xác minh

### Kiểm tra tự động

- Chạy `lovable-exec "bunx playwright test tests/ui/structural-integrity.test.ts"` để kiểm tra tính ổn định của bố cục chung.
- Sử dụng script tùy chỉnh để xác minh khả năng hiển thị và vị trí của icon search.

### Xác minh thủ công

- Kiểm tra preview tại `http://localhost:8080/` để đảm bảo các nút trong thanh công cụ dashboard được giãn cách đúng và không chồng lấn.
- Xác nhận biểu tượng kính lúp đã hiển thị rõ ràng trong TopBar.
