# Kế hoạch Cải thiện UI/UX MIRATS 2.0 (Tiếp tục)

Người dùng yêu cầu tiếp tục kế hoạch cải thiện UI/UX, hủy bỏ việc sửa đổi văn bản tại `TzClock.tsx` và tập trung vào các giai đoạn tiếp theo trong tài liệu thiết kế.

## Giai đoạn Hiện tại: Triển khai Giai đoạn 2 & 4.2

### 1. Triển khai Giai đoạn 2: Tái cấu trúc trang chi tiết tài sản
- **Bài toán**: Trang chi tiết thiết bị (`_app.thiet-bi.$maThietBi.tsx`) hiện có quá nhiều tab (15 tab), gây rối mắt và làm chậm tốc độ tải trang do khởi tạo quá nhiều query cùng lúc.
- **Giải pháp**: Gom 15 tab thành 5 nhóm nghiệp vụ:
    - **Tổng quan**: Thông tin cơ bản, Mã QR, Nhãn, Lý lịch rút gọn.
    - **Vận hành**: Dòng thời gian, Bảo dưỡng, Sự cố, Thay thế.
    - **Hồ sơ & pháp lý**: KĐ/HC, Giấy phép, Bàn giao, Tệp đính kèm.
    - **Cấu hình**: Linh kiện, Đo đạc, Phần mềm bản quyền, Cấp phát, Thành phần hệ thống.
    - **Nâng cao**: Toàn bộ trường, Lịch sử thay đổi (mặc định ẩn hoặc chỉ dành cho Admin).
- **Các bước thực hiện**:
    1. Tạo thư mục `src/components/mirats/thiet-bi-detail/`.
    2. Tách từng tab thành các file component riêng lẻ (ví dụ: `TabTongQuan.tsx`, `TabVanHanh.tsx`).
    3. Cập nhật `src/routes/_app.thiet-bi.$maThietBi.tsx` để render cấu trúc tab mới.
    4. Thêm **Sticky Summary Bar** ở đầu trang hiển thị các thông tin cốt lõi (Tên, Mã, Trạng thái, Vị trí) để giữ ngữ cảnh.
    5. Áp dụng `React.lazy` cho các tab để tối ưu hiệu suất tải trang.

### 2. Triển khai Giai đoạn 4.2: Token trạng thái tập trung
- **Bài toán**: Mã màu trạng thái đang bị trùng lặp ở nhiều nơi (`_app.thiet-bi.index.tsx`, `ThietBiDetailDrawer.tsx`), gây khó khăn khi cần thay đổi đồng bộ.
- **Giải pháp**: Tạo một nguồn sự thật duy nhất cho các trạng thái.
- **Các bước thực hiện**:
    1. Tạo file `src/lib/mirats/ui/status-tokens.ts`.
    2. Định nghĩa object `TRANG_THAI_TOKEN` khóa theo `ma_trang_thai` (ví dụ: `DANG_KHAI_THAC`, `CHO_THANH_LY`).
    3. Mỗi token bao gồm: `class` (Tailwind styles), `dot` (màu chấm), `kyHieu` (ký hiệu cho người mù màu/in đen trắng).
    4. Thay thế các logic màu cứng bằng cách import từ file token này.

## Giai đoạn kế tiếp
- **Giai đoạn 3**: Bộc lộ dần ở tầng trường dữ liệu (Ẩn trường trống, Chế độ kỹ thuật).
- **Giai đoạn 4.3**: Trực quan hóa dữ liệu (Health bar, Life bar, Breadcrumb vị trí).

## Câu hỏi làm rõ
Bạn có muốn tôi bắt đầu thực hiện việc tách nhỏ file `_app.thiet-bi.$maThietBi.tsx` (hiện tại ~840 dòng) ngay bây giờ không? Việc này sẽ giúp code sạch hơn và dễ bảo trì hơn theo đúng kế hoạch Giai đoạn 2.
