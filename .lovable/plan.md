# Plan: Nâng cấp MIRATS Project Workspace & Lean OS (Phase U11-U15)

Mục tiêu: Hiện thực hóa các ý tưởng về "Trung tâm điều phối cá nhân", "Multi-View Project Screens" và "Hybrid Views" bằng cách tích hợp sâu Lean UX, Shape Up và các công cụ quản lý hồ sơ vào workspace dự án hiện tại, đồng thời chuẩn hóa giao diện theo hệ thống Astryx.

## 1. Mở rộng Hệ thống Phân hệ (Workspace Architecture)
- Cập nhật `src/lib/mirats/nav-contract.ts`:
    - Thêm phân hệ "Trung tâm Trình ký" (Approval Hub) với icon `FileCheck`.
    - Thêm route "My Tasks" (Gom task cá nhân từ nhiều dự án) vào phân hệ "Dự án".
    - Thêm route "Activity Inbox" vào phân hệ "Trao đổi".

## 2. Nâng cấp Project Detail (Multi-View & Hybrid)
- Sửa đổi `src/routes/_app.du-an.$id.tsx`:
    - Kích hoạt lại (Uncomment) các thành phần Lean OS: `LeanUXCanvas`, `HillChart`, `PitchEditor`.
    - Thêm tab "Lean OS" (chứa Canvas & Hill Chart) và tab "Lộ trình" (Shaping/Pitches).
    - Triển khai "Hybrid Task Card" trong Kanban: Hiển thị Badge trạng thái hồ sơ pháp lý đính kèm (dựa trên liên kết `du_an_cong_van`).
    - Cải tiến Kanban View: Hỗ trợ kéo thả (Drag & Drop) và Swimlanes theo Milestone.

## 3. Chi tiết Công việc (Advanced Task Detail)
- Tạo component `src/components/mirats/projects/TaskDetailSlideOver.tsx`:
    - Giao diện trượt từ cạnh phải (Slide-over).
    - Chia 2 tab: "Tiến độ & Phối hợp" và "Sản phẩm Văn bản (Dossier/E-Sign)".
    - Tích hợp Live PDF Preview cho văn bản đính kèm.
    - Hỗ trợ Slash command (/) và Checklist cho sub-tasks.

## 4. Tự động hóa & Dossier Gate (Phase-Gate)
- Triển khai "Dossier Compliance Check":
    - Cảnh báo màu trên thẻ Task nếu hồ sơ pháp lý thiếu hoặc bị trễ.
    - Logic "Phase Gate": Chặn chuyển trạng thái Milestone nếu các hồ sơ bắt buộc của Milestone trước chưa hoàn thành.

## 5. Bảng điều khiển Bento (Bento Dashboard)
- Cập nhật `src/components/mirats/dashboard/grid/DashboardGrid.tsx`:
    - Thêm widget "My Today Tasks", "Project Health Heatmap", "Dossier Compliance Gauge".
    - Tối ưu hóa layout Bento Grid cho màn hình Home của Workspace.

## 6. Giao diện & Trải nghiệm Astryx
- Áp dụng `UI_DENSITY` và `LayoutPanel` cho toàn bộ các màn hình mới.
- Tích hợp Command Palette shortcuts (Cmd+K) cho các hành động nhanh trong dự án.

## Thông số kỹ thuật
- **Database**: Sử dụng các bảng hiện có `project_framework_settings`, `lean_ux_canvases`, `pitches`, `pitch_scopes`, `du_an_cong_van`.
- **UI Framework**: Astryx (Tailwind v4), Lucide Icons, Framer Motion (cho Slide-over), TanStack Query/Start.
- **Trạng thái**: Tiếng Việt (giao diện chính), chuẩn hóa TYPO 7 bậc.
