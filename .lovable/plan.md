# Plan: Nâng cấp MIRATS Project Workspace & Hồ sơ Công văn (Phase U11-U15)

Mục tiêu: Chuyển đổi từ mô hình Lean OS sang hệ thống quản lý Công việc & Hồ sơ chuyên sâu, tập trung vào luồng công văn, trình ký và phối hợp nhóm, chuẩn hóa theo hệ thống Astryx.

## 1. Mở rộng Hệ thống Phân hệ (Workspace Architecture)
- Cập nhật `src/lib/mirats/nav-contract.ts`:
    - Thêm phân hệ "Trung tâm Trình ký" (Approval Hub) - Nơi gom tất cả các văn bản đang chờ phê duyệt hoặc ký số.
    - Bổ sung "Kho Hồ sơ Dự án" vào phân hệ "Tài sản & Hồ sơ".
    - Thêm route "Việc của tôi" (My Tasks) vào phân hệ "Dự án" để gom task từ nhiều dự án.

## 2. Nâng cấp Project Detail (Hồ sơ & Công văn Focused)
- Sửa đổi `src/routes/_app.du-an.$id.tsx`:
    - Loại bỏ hoàn toàn các tab/thành phần Lean OS (Canvas, Hill Chart, Pitch Editor) không còn phù hợp.
    - Củng cố tab "Hồ sơ" và "Công văn" làm trọng tâm.
    - Triển khai "Hybrid Task Card" trong Kanban: Hiển thị nhãn trạng thái văn bản trực quan (VD: [Chờ ký số], [Thiếu hồ sơ]).
    - Cảnh báo tính pháp lý: Thẻ task đổi màu vàng/đỏ nếu văn bản đính kèm bị từ chối hoặc trễ hạn.

## 3. Chi tiết Công việc & Trình ký (Slide-over UX)
- Tạo component `src/components/mirats/projects/TaskDetailSlideOver.tsx`:
    - Mở dạng Slide-over từ cạnh phải để không mất ngữ cảnh.
    - Tab 1: Tiến độ & Phối hợp (Checklist, Thảo luận, Time-tracking).
    - Tab 2: Sản phẩm & Trình ký (Live PDF Preview, nút "Trình ký số", Lịch sử luồng duyệt).

## 4. Tự động hóa Luồng việc & Văn bản
- Triển khai logic "Phase-Gate Dossier": Chặn chuyển giai đoạn dự án nếu danh mục hồ sơ bắt buộc của giai đoạn hiện tại chưa đầy đủ (Đã ban hành/Ký số).
- Automation: Khi Lãnh đạo ký số, task tự động chuyển trạng thái "Hoàn thành" và file PDF được lưu vào Kho Hồ sơ.

## 5. Bảng điều khiển Quản trị (Executive Hybrid Dashboard)
- Cập nhật `src/components/mirats/dashboard/grid/DashboardGrid.tsx`:
    - Widget "Độ hoàn thiện Hồ sơ" (Dossier Compliance): Tỷ lệ % bộ hồ sơ pháp lý hợp lệ.
    - Widget "Tiến độ Công việc": % Task hoàn thành vs Trễ hạn.
    - Luồng hoạt động (Activity Stream) tập trung cho các thông báo @mention và thay đổi trạng thái hồ sơ.

## 6. Giao diện & Trải nghiệm Astryx
- Áp dụng `UI_DENSITY` (thanh cuộn, lề trang) và `LayoutPanel` chuẩn Astryx.
- Tích hợp Command Palette (Cmd+K) để điều hướng nhanh đến các hồ sơ/công văn cụ thể.

## Thông số kỹ thuật
- **Database**: Sử dụng bảng `du_an_cong_van`, `project_dossiers`, `dossier_documents`. Loại bỏ sự phụ thuộc vào `lean_ux_canvases` và `pitches`.
- **UI Framework**: Astryx (Tailwind v4), Lucide Icons, Framer Motion.
- **Ngôn ngữ**: 100% Tiếng Việt.