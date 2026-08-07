# Plan - Nâng cấp Giai đoạn 2: Quản lý Bản quyền Phần mềm

Tiếp tục lộ trình nâng cấp module Quản lý bản quyền, tập trung vào trải nghiệm người dùng chuyên sâu, bảo mật License Key và hệ thống cảnh báo tự động.

## 1. Route Chi tiết & Quản lý Tệp (Phase 2 core)
- **Tạo Route Chi tiết**: Xây dựng `src/routes/_app.phan-mem-ban-quyen.$ma.tsx` để hiển thị Dashboard riêng cho từng bản quyền.
    - Tab **Tổng quan**: Thông tin kỹ thuật, tài chính, biểu đồ seats.
    - Tab **Cấp phát**: Danh sách thiết bị đang dùng, lịch sử cài đặt/thu hồi (chuyển logic từ dialog vào đây).
    - Tab **Tệp đính kèm**: Quản lý PDF hợp đồng, chứng nhận bản quyền sử dụng `DocViewerDialog` và bảng `phan_mem_ban_quyen_tep`.
- **Đồng bộ Navigation**: Cho phép click vào dòng trong bảng danh sách để điều hướng sang trang chi tiết.

## 2. Bảo mật & Kiểm soát License Key
- **Masking mặc định**: License key trên mọi giao diện (Bảng, Chi tiết, Cấp phát) sẽ bị che (VD: `XXXX-XXXX-1234`).
- **Tính năng "Hiện Key"**:
    - Chỉ hiển thị nút cho vai trò Quản lý (`admin`, `phong_kt`).
    - Khi bấm, thực hiện ghi log vào `audit_log` với hành động `VIEW_LICENSE_KEY` trước khi hiển thị giá trị thật.
- **Form Edit**: Cập nhật `BanQuyenFormDialog` để xử lý mask/unmask khi nhập liệu.

## 3. Hệ thống Cảnh báo tự động
- **Cảnh báo Hạn dùng**: Kết nối module bản quyền vào job quét hàng ngày. Ghi log vào `canh_bao_het_han_log` khi bản quyền còn 60, 30, hoặc 7 ngày.
- **Cảnh báo Seats**: Gửi thông báo khi tỷ lệ sử dụng ghế vượt ngưỡng 90% hoặc 95%.
- **Tích hợp Email/Telegram**: Đảm bảo các cảnh báo này được đẩy qua hạ tầng thông báo đã có.

## 4. Dọn dẹp & Tối ưu (Phase 3 transition)
- **Chuẩn hóa UI**:
    - Thay thế donut SVG thủ công trong trang tổng quan bằng `Progress` hoặc `Recharts`.
    - Loại bỏ hàm `cn` cục bộ, sử dụng `@/lib/utils`.
- **Refactor Data Flow**:
    - Chuyển KPI trang chủ sang sử dụng RPC `ban_quyen_tong_hop` để đảm bảo tính toán chính xác khi phân trang server-side.
    - Gộp các hook truy vấn trùng lặp vào `src/lib/mirats/ban-quyen.ts`.
- **Phân quyền module**: Thay thế hardcode `hasRole` bằng `PermGate` với module `ban_quyen`.

## Verification Plan
1. **Trang chi tiết**: Truy cập `/phan-mem-ban-quyen/BQ_123`, kiểm tra các tab hiển thị đúng dữ liệu.
2. **Bảo mật Key**: Dùng tài khoản Manager bấm "Hiện Key", sau đó vào `Nhật ký hệ thống` kiểm tra có dòng log tương ứng không.
3. **Cấp phát**: Thực hiện cấp phát từ trang chi tiết bản quyền, verify seats count cập nhật realtime.
4. **Cảnh báo**: Chạy script test gửi thông báo cho một bản quyền sắp hết hạn, check email nhận được.
