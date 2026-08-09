# Kế hoạch Cải thiện UI/UX MIRATS 2.0 (Tiếp tục)

Người dùng yêu cầu tiếp tục kế hoạch cải thiện UI/UX dựa trên tài liệu đã tải lên, bắt đầu từ việc xác nhận hạ tầng sẵn sàng và triển khai Giai đoạn 2 & 4.2.

## Giai đoạn Hiện tại: Xác minh & Cải thiện

### 1. Cập nhật Văn bản Giao diện (Yêu cầu cụ thể)
- Cập nhật `src/components/mirats/TzClock.tsx`: Thay thế `aria-label="Chọn múi giờ"` bằng văn bản:
  > không phải tôi muốn tiếp tục kế hoạch và là bước kế hoạch Hạ tầng hiện đã sẵn sàng để tiếp tục triển khai Giai đoạn 2 (Tái cấu trúc trang chi tiết) và Giai đoạn 4.2 (Health/Life indicators). trong kế hoạch trước

### 2. Triển khai Giai đoạn 2: Tái cấu trúc trang chi tiết tài sản
- **Mục tiêu**: Giảm tải nhận thức bằng cách gom 15 tab phẳng thành 5 nhóm nghiệp vụ chính: **Tổng quan**, **Vận hành**, **Hồ sơ & pháp lý**, **Cấu hình**, và **Nâng cao**.
- **Các bước thực hiện**:
    - Tách các tab hiện có trong `src/routes/_app.thiet-bi.$maThietBi.tsx` thành các component riêng lẻ trong thư mục mới `src/components/mirats/thiet-bi-detail/`.
    - Triển khai logic "ẩn tab con khi không có dữ liệu" để tối ưu không gian.
    - Thêm dải tóm tắt cố định (Sticky Summary Bar) ở phía trên để giữ ngữ cảnh khi chuyển tab.

### 3. Triển khai Giai đoạn 4.2: Token trạng thái tập trung
- **Mục tiêu**: Nhất quán hóa hiển thị trạng thái trên toàn hệ thống và hỗ trợ khả năng tiếp cận (accessibility).
- **Các bước thực hiện**:
    - Tạo `src/lib/mirats/ui/status-tokens.ts` định nghĩa màu sắc và ký hiệu cho từng trạng thái.
    - **Quan trọng**: Khóa token theo `ma_trang_thai` (bất biến) thay vì `ten` (dữ liệu admin có thể sửa) để đảm bảo tính ổn định.
    - Cập nhật các component `Badge` trạng thái để sử dụng bộ token tập trung này.

## Các bước tiếp theo (Dựa trên tài liệu .md)
- Tiếp tục với Giai đoạn 3: Bộc lộ dần trường dữ liệu (ẩn trường trống, chế độ kỹ thuật).
- Tiếp tục với Giai đoạn 4.3: Dữ liệu trực quan hóa (Health bar, Life bar, Breadcrumb vị trí).
- Thực hiện kiểm tra hồi quy với 136 test case hiện có sau mỗi bước thay đổi lớn.
