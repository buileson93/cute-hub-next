# Plan - Nâng cấp Workspace Dự án: Trình ký số, Trung tâm điều phối & Dashboard Hybrid (Phase U12-U15)

Phát triển các tính năng chuyên sâu cho quản lý công văn, ký số và giám sát sức khỏe dự án theo yêu cầu trực quan.

## 1. Task Detail & Trình ký số (Slide-over)
- **Live PDF Preview**: Tích hợp trình xem PDF trong `TaskDetailSlideOver.tsx` dùng `<iframe>` hoặc thư viện PDF viewer nhẹ cho các hồ sơ đính kèm.
- **Nút Trình ký / Ban hành**: Thêm các action "Trình ký ngay" và "Ban hành công văn" trong tab "Sản phẩm & Trình ký".
- **Lưu dấu điện tử**: Cập nhật logic mutation để lưu hash chữ ký và mã con dấu điện tử vào trường `metadata` của `dossier_documents`.

## 2. Approval Hub (Trung tâm điều phối)
- **Route mới**: Xây dựng `src/routes/_app.trinh-ky.tsx` (hoặc index) hiển thị danh sách văn bản chờ duyệt.
- **Tính năng**:
    - Hàng đợi (Queue) phân loại theo "Cần tôi ký" và "Đang theo dõi".
    - Bộ lọc theo Vai trò (Phòng KT, Lãnh đạo) và Cá nhân.
    - **Ký hàng loạt**: Cho phép chọn nhiều văn bản và thực hiện ký số/phê duyệt một lần (Batch Actions).

## 3. Dòng thời gian Audit Log
- **Component**: Tạo `src/components/mirats/projects/AuditLog.tsx` hiển thị lịch sử thay đổi.
- **Dữ liệu**: Truy vấn bảng `audit_log` lọc theo `entity` (task/dossier) và `entity_id`.
- **Nội dung**: Ghi lại: Thay đổi trạng thái, bình luận mới, người thực hiện, thời gian chi tiết.
- **Xuất báo cáo**: Nút "Xuất nhật ký" (CSV/PDF) cho từng thực thể.

## 4. Executive Hybrid Dashboard
- **Route**: Nâng cấp `src/routes/_app.tong-quan.tsx` hoặc tạo widget mới trong `DashboardGrid.tsx`.
- **Work Health Metrics**: 
    - Biểu đồ Gauge cho `% Hoàn thành`.
    - Biểu đồ Bar cho `% Trễ hạn` theo dự án/phòng ban.
- **Dossier Compliance**: Bảng nhiệt (Heatmap) hoặc Progress Ring hiển thị tỷ lệ hồ sơ hợp lệ (complete) so với yêu cầu bắt buộc của Phase-Gate.
- **Xuất dữ liệu**: Tích hợp nút xuất báo cáo CSV/PDF toàn cục cho Dashboard.

## Chi tiết kỹ thuật
- **Database**: 
    - Sử dụng bảng `dossier_documents` cho hồ sơ.
    - Sử dụng `audit_log` cho lịch sử.
    - Cần kiểm tra xem có cần migration để thêm `signed_metadata` (Json) vào `dossier_documents` không.
- **Auth/RLS**: Đảm bảo nút "Ký số" chỉ hiển thị cho người có vai trò phù hợp (dựa trên `user_roles`).
- **Performance**: Virtualization cho danh sách Approval Hub nếu số lượng văn bản lớn.

## Verification Plan
- **Manual**: Kiểm tra luồng Trình ký -> Chuyển trạng thái -> Audit log ghi nhận.
- **Playwright**: Test hành vi "Ký hàng loạt" và chuyển đổi tab trên Dashboard.
