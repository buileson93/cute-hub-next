# Kế hoạch: Nâng cấp Quản lý Bản quyền Phần mềm & Tài sản

Mục tiêu là cải thiện quy trình cấp phát bản quyền, bổ sung thống kê chi tiết máy tính-nhân viên, triển khai nhập liệu hàng loạt cho tài sản kèm gán nhân viên, và cung cấp khả năng xuất báo cáo.

## Giai đoạn 1: Ràng buộc Dữ liệu & Kiểm tra Cấp phát
- Cập nhật `src/components/mirats/BanQuyenCapPhatDialog.tsx`:
    - Cải thiện form cấp phát: tự động kiểm tra xem máy tính đã được gán nhân viên phụ trách hay chưa.
    - Kiểm tra các thông tin cần thiết (như Model, Số Serial) trước khi cho phép lưu cấp phát.
    - Hiển thị cảnh báo trực quan nếu dữ liệu tài sản chưa đầy đủ để đảm bảo tính minh bạch.

## Giai đoạn 2: Trang Thống kê Máy tính - Nhân viên
- Tạo route mới `src/routes/_app.thong-ke.laptop.tsx`:
    - Hiển thị danh sách nhân viên cùng các máy tính (laptop/PC) đã gán.
    - Trạng thái cấp phát bản quyền: Máy nào đã có bản quyền, máy nào còn thiếu.
    - Thống kê số ghế (seats) còn trống của từng loại bản quyền liên quan.
    - Bộ lọc theo Đơn vị và trạng thái nhân sự.

## Giai đoạn 3: Nhập liệu hàng loạt Assets & Nhân viên
- Tạo `src/components/mirats/AssetImportDialog.tsx`:
    - Hỗ trợ tải tệp Excel/CSV cho tài sản máy tính.
    - Quy trình 1 bước: Tự động gán nhân viên phụ trách thông qua mã nhân viên hoặc email có trong file nhập.
    - Tích hợp vào trang danh mục tài sản để tối ưu thời gian nhập liệu ban đầu.

## Giai đoạn 4: Xuất Báo cáo (PDF/Excel)
- Triển khai tính năng xuất dữ liệu:
    - Báo cáo cá nhân: Xuất PDF/Excel cho từng nhân viên bao gồm danh sách máy tính, phần mềm đang sử dụng và lịch sử cấp phát.
    - Báo cáo đơn vị: Tổng hợp dữ liệu tài sản và phần mềm theo phòng ban.
    - Tích hợp nút xuất báo cáo tại trang Quản lý nhân viên và trang Thống kê mới.

## Giai đoạn 5: Cấu hình Điều hướng & Kiểm tra
- Cập nhật menu sidebar trong `src/lib/mirats/nav-contract.ts` để bổ sung mục "Thống kê tài sản".
- Kiểm tra lại toàn bộ phân quyền (RLS) để đảm bảo an toàn dữ liệu khi xuất báo cáo hàng loạt.

