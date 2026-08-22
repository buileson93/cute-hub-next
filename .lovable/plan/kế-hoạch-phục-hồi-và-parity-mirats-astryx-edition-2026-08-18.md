# Kế hoạch Phục hồi và Parity MIRATS (Astryx Edition)

## 1. Phân tích Diff & Trạng thái Parity

| Route / Component                 | Hành vi chuẩn (chaytot)                | Implementation hiện tại                     | Trạng thái                   | Mức | File/Dòng liên quan                               | Test Parity                                    |
| :-------------------------------- | :------------------------------------- | :------------------------------------------ | :--------------------------- | :-- | :------------------------------------------------ | :--------------------------------------------- |
| **Home Dashboard** (`/_app/`)     | Hiển thị KPI Availability, MTTR, PM    | Unified Dashboard Hook + HeartBeat          | **Thay đúng**                | P0  | `src/routes/_app.index.tsx`                       | So khớp số liệu với `useUnifiedDashboardStats` |
| **System Tree** (`/he-thong/cay`) | Cây phân cấp 4 tầng, MindMap ReactFlow | Modular CayProvider, MindMap tab            | **Thay đúng** (đã fix 5 lỗi) | P0  | `src/routes/_app.he-thong.cay.tsx`                | Test mở rộng node & Search focus               |
| **StandardTable**                 | High-density, multi-select, export     | Astryx token, Virtualizer, Density toggle   | **Thay đúng**                | P1  | `src/components/mirats/StandardTable.tsx`         | Test Virtual scroll & Column preference        |
| **Unified Write**                 | Gửi mutation qua RPC/secure helper     | `save-entity-securely.ts`                   | **Thay đúng**                | P1  | `src/components/mirats/he-thong-cay/mutations.ts` | Test Permission check & Audit log              |
| **UI Contrast**                   | Nút xám/chữ trắng khó nhìn             | Token `bg-primary` & high-contrast variants | **Đang thay**                | P1  | `src/styles.css`, `AppShell.tsx`                  | A11y Contrast Ratio check                      |
| **Lean Project OS**               | Gantt/Kanban truyền thống              | Lean UX Canvas, Hill Chart, Pitch/Betting   | **Mới** (Giữ parity)         | P2  | `src/components/mirats/projects/*`                | Test Backward compat với Kanban cũ             |
| **Search (PowerSearch)**          | Header search & Cmd+K                  | Unified PowerSearch (Split-pane)            | **Thay đúng**                | P1  | `src/components/mirats/search/PowerSearch.tsx`    | Test AI intent matching & Shortcut             |

## 2. Kiểm tra Ràng buộc Tuyệt đối

- **Schema/Migration**: Không thay đổi. Dùng `notification_loai` đã bổ sung.
- **Dữ liệu/KPI**: Không hard-code. Sử dụng `useUnifiedDashboardStats` và `db-taxonomy`.
- **Permission**: RBAC qua `useCan` và RLS được duy trì 100%.
- **Implementation**: Các logic cũ (hoán tác, di chuyển node) được bọc trong `useCayMutations` thay vì xóa bỏ.

## 3. Kế hoạch Phục hồi nhỏ nhất (Minimal Restoration Plan)

Mục tiêu: Đạt 100% parity về hành vi trong khi vẫn giữ UI Astryx.

1. **Giai đoạn 1: Ổn định Core Logic (P0)**
   - Kiểm tra lại toàn bộ route param trong `validateSearch` (đặc biệt là `editTb`, `view`) để đảm bảo deep-linking từ hệ thống cũ vẫn hoạt động.
   - Xác minh `useUnifiedDashboardStats` lấy đúng dữ liệu từ `availability` và `mttr` helpers (parity 1:1 với logic SQL/JS của chaytot).

2. **Giai đoạn 2: Hoàn thiện UI Contrast & Interactivity (P1)**
   - Rà soát các component `Tabs`, `Toggle`, `Badge` còn sót màu xám/trắng khó nhìn để chuyển sang `bg-primary/10` (blue accent).
   - Fix triệt để lỗi "0px height" ở các view chi tiết (Maintenance, Lifecycle) bằng cách áp dụng `h-full` và `min-h` tương tự như đã làm với MindMap.

3. **Giai đoạn 3: Wiring & Data Integrity (P1)**
   - Đảm bảo các action "Export CSV" và "Audit/Undo" trong `StandardTable` gọi đúng service logic cũ.
   - Kiểm tra cache invalidation trong `mutations.ts` để sau khi Save/Update, dữ liệu MindMap và Table đồng bộ ngay lập tức.

4. **Giai đoạn 4: QA Parity (P2)**
   - Chạy script Playwright `structural-integrity.test.ts` để phát hiện các vùng UI bị khuất hoặc không tương tác được.
   - So sánh output của `reliability-core.tsx` với phiên bản chaytot để đảm bảo không có "dữ liệu giả" trong báo cáo độ tin cậy.

**Kết luận:** Hệ thống hiện tại đã đạt ~90% parity về tính năng. Các bước tiếp theo chỉ tập trung vào việc tinh chỉnh hiển thị (contrast) và đảm bảo các wiring nghiệp vụ phức tạp (Change Requests) không bị lỗi hook call.
