# Kế hoạch Cải thiện UI/UX MIRATS 2.0 (Tiếp tục)

Người dùng đã đồng ý triển khai Giai đoạn 2: Tái cấu trúc trang chi tiết tài sản, bắt đầu bằng việc tách nhỏ file `_app.thiet-bi.$maThietBi.tsx`.

## Giai đoạn Hiện tại: Triển khai Giai đoạn 2 & 4.2

### 1. Triển khai Giai đoạn 2: Tái cấu trúc trang chi tiết tài sản
- **Mục tiêu**: Tối ưu hóa trang chi tiết thiết bị, giảm tải nhận thức và tăng hiệu năng tải trang.
- **Các bước thực hiện**:
    1. **Tạo cấu trúc thư mục mới**: `src/components/mirats/thiet-bi-detail/` để chứa các component tab.
    2. **Tách các tab thành component riêng**:
        - `TabTongQuan.tsx`: Gom Thông tin cơ bản, Mã QR, Nhãn, Lý lịch rút gọn.
        - `TabVanHanh.tsx`: Gom Dòng thời gian, Bảo dưỡng, Sự cố, Thay thế.
        - `TabHoSoPhapLy.tsx`: Gom KĐ/HC, Giấy phép, Bàn giao, Tệp đính kèm.
        - `TabCauHinh.tsx`: Gom Linh kiện, Đo đạc, Bản quyền, Cấp phát, Thành phần hệ thống.
        - `TabNangCao.tsx`: Gom Toàn bộ trường, Lịch sử thay đổi.
    3. **Tối ưu hóa file route**: Refactor `src/routes/_app.thiet-bi.$maThietBi.tsx` để sử dụng cấu trúc tab mới, giảm kích thước file từ ~840 dòng xuống còn ~200 dòng.
    4. **Sticky Summary Bar**: Triển khai dải thông tin tóm tắt cố định ở đầu trang giúp người dùng không mất ngữ cảnh khi cuộn.
    5. **Lazy Loading**: Áp dụng `React.lazy` và `Suspense` cho các tab để đảm bảo chỉ những gì cần thiết mới được tải và query dữ liệu.

### 2. Triển khai Giai đoạn 4.2: Token trạng thái tập trung
- **Mục tiêu**: Nhất quán hóa hiển thị trạng thái và màu sắc trên toàn hệ thống.
- **Các bước thực hiện**:
    1. Tạo `src/lib/mirats/ui/status-tokens.ts` khóa theo mã trạng thái bất biến.
    2. Cập nhật các component liên quan để sử dụng bộ token chuẩn này.

## Giai đoạn kế tiếp
- **Giai đoạn 3**: Bộc lộ dần trường dữ liệu (Ẩn trường trống, Chế độ kỹ thuật).
- **Giai đoạn 4.3**: Trực quan hóa dữ liệu (Thanh tuổi thọ, Chấm sức khỏe).

## Câu hỏi làm rõ
Tôi sẽ bắt đầu bằng việc tạo thư mục và các component tab con, sau đó mới cập nhật file route chính để đảm bảo không làm gián đoạn ứng dụng. Bạn có yêu cầu đặc biệt nào về thứ tự các thông tin trong tab "Tổng quan" không?
