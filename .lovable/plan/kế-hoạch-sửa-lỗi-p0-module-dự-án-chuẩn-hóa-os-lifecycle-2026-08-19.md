# Kế hoạch Sửa lỗi P0 Module Dự án & Chuẩn hóa OS Lifecycle

Giải quyết các lỗi Hooks, đồng bộ dữ liệu Lean UX, và khôi phục tính toàn vẹn cho luồng Dossier/Công văn.

## 1. Sửa lỗi P0 & Runtime

- **\_app.du-an.$id.tsx**: Chuyển `Route.useSearch()` lên đầu hàm component, trước mọi `if (loadingDA)` hoặc `if (!duAn)` để tránh vi phạm Rule of Hooks.
- **Lean UX Canvas**:
  - Chỉnh sửa `LeanUXCanvas.tsx` để nhận dữ liệu từ Supabase theo `project_id`.
  - Sau khi `upsert`, sử dụng `.select().single()` để lấy ID thật từ DB và cập nhật state local, tránh tạo bản ghi trùng khi nhấn Lưu nhiều lần.
  - Đảm bảo cơ chế `upsert` hoạt động đúng (sử dụng `project_id` làm khóa duy nhất nếu cần hoặc kiểm tra ID tồn tại).

## 2. Khôi phục Dữ liệu & Tính toàn vẹn

- **Dọn dẹp Mock Data**:
  - Thay thế dữ liệu mẫu "hardcoded" trong `OperationsLane`, `HillChart` (Cycle 08, Incidents demo) bằng `EmptyState` hoặc dữ liệu thực từ backend.
  - Xóa các đoạn mã tạo dữ liệu ngẫu nhiên trong các view Delivery/Operations.
- **Project Workspace Hook**:
  - Tạo `src/hooks/mirats/use-project-workspace.ts` để quản lý tập trung: milestones, tasks, collaborators, documents, và timeline.
  - Triển khai logic `invalidateQueries` nhất quán: sau khi cập nhật task/milestone, phải làm mới toàn bộ các queries liên quan (project, timeline, v.v.).

## 3. Tái cấu trúc Điều hướng & View

- **Thống nhất Filter/Query**: Đảm bảo thanh tìm kiếm và bộ lọc áp dụng đồng nhất cho cả 4 view: Kanban, Gantt, Danh sách và Timeline.
- **Cấu trúc Tab mới**:
  - **Tổng quan**: Dashboard tóm tắt.
  - **Công việc**: Chứa View Switch (Board, Gantt, Danh sách).
  - **Timeline**: Luồng sự kiện dự án.
  - **Discovery**: Lean UX Canvas.
  - **Tài liệu**: Chứa phân loại (Tất cả, Công văn, Hồ sơ).
- **Kích hoạt Module bị ẩn**: Thêm điều hướng thực tế và kết nối logic cho các tab `hoso` và `cong-van`.

## Chi tiết kỹ thuật

- **Supabase Types**: Chạy regenerate types để đảm bảo `lean_ux_canvases` và các bảng dự án mới được định nghĩa rõ ràng, loại bỏ `as any`.
- **RLS**: Kiểm tra lại chính sách RLS cho các bảng `lean_ux_canvases`, `project_dossiers`, `du_an_cong_van` để đảm bảo quyền truy cập đúng theo `user_id` và `role`.
- **Performance**: Tối ưu hóa việc fetch dữ liệu trong `useProjectWorkspace` để tránh over-fetching.
