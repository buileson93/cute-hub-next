# Kế hoạch Nâng cấp Workspace Dự án: Trình ký số, Trung tâm điều phối & Dashboard Hybrid (Phase U12-U15)

Tập trung vào tính chuyên sâu của hồ sơ công văn, quy trình trình ký và giám sát hoạt động dự án.

## Giai đoạn 1: Task Detail & Trình ký số (Slide-over)
- **Live PDF Preview**: Tích hợp `iframe` trong tab "Sản phẩm & Trình ký" để xem nhanh hồ sơ.
- **Nút hành động**: Thêm "Trình ký ngay" và "Ký số & Ban hành" vào `TaskDetailSlideOver`.
- **E-seal**: Lưu mã con dấu điện tử vào `metadata` của tài liệu khi ký số thành công.

## Giai đoạn 2: Approval Hub (Trung tâm Trình ký)
- **Route**: `src/routes/_app.trinh-ky.index.tsx`.
- **Hàng đợi văn bản**: Hiển thị danh sách văn bản chờ duyệt, lọc theo vai trò (Cần tôi ký/Đang theo dõi).
- **Ký hàng loạt**: Cho phép chọn nhiều văn bản và thực hiện ký số/ban hành một lần.

## Giai đoạn 3: Nhật ký hoạt động & Xuất báo cáo (Audit Log)
- **Audit Timeline**: Hiển thị dòng thời gian chi tiết trong `AuditLog.tsx` (Tạo, Sửa, Ký, Bình luận).
- **Xuất báo cáo**: Thêm chức năng xuất CSV cho lịch sử hoạt động của Task/Dossier.

## Giai đoạn 4: Executive Hybrid Dashboard
- **Work Health**: Widget biểu đồ tiến độ dự án vs tình trạng trễ hạn.
- **Dossier Compliance**: Heatmap tuân thủ hồ sơ theo từng giai đoạn dự án.

## Kỹ thuật & Bảo mật
- **RLS**: Đảm bảo chỉ người có vai trò (quản lý, lãnh đạo) mới thấy nút ký số.
- **Atomic Operations**: Sử dụng transaction hoặc RPC khi ký số để cập nhật trạng thái hồ sơ và ghi log đồng thời.

## Chi tiết kỹ thuật
- `src/components/mirats/projects/TaskDetailSlideOver.tsx`: Cập nhật tab "Sản phẩm & Trình ký".
- `src/routes/_app.trinh-ky.index.tsx`: Hoàn thiện logic lọc và ký hàng loạt.
- `src/components/mirats/projects/AuditLog.tsx`: Thêm logic xuất dữ liệu.
- `src/components/mirats/dashboard/grid/DashboardGrid.tsx`: Triển khai các widget mới.
