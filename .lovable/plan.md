# MIRATS ASTRYX SAFE MIGRATION — P5/9: PRESENTATIONAL UI

## BỐI CẢNH ĐỘC LẬP
- MIRATS 2.0: React 19.2, TanStack Router, Tailwind v4, shadcn/Radix.
- Astryx Theme VATM và /admin/ui-kit đã hoàn tất.
- Mục tiêu: Chuyển đổi các component trình bày (không điều khiển dữ liệu/hành vi) sang Astryx.
- 5 route pilot: Dashboard (`/`), Danh mục thiết bị, Form new (`new.$code`), Chi tiết hệ thống (`$id`), Sơ đồ (`$id`).

## BẤT BIẾN
- Không đổi route/loader/query/mutation/conditions/strings/permissions.
- Không sửa Button, Form, Input, Select, Dialog, Sheet, Drawer, Table, Tooltip, Command, Toast hoặc AppShell.
- Mọi chuyển đổi phải rollback được bằng cách đổi import.

## DANH SÁCH COMPONENT WRAPPER (src/components/astryx/)
Tạo các wrapper mỏng để mapping dữ liệu trình bày:
- `MiratsStatus`: Mapping `Badge` và `StatusDot`. Giữ nguyên mapping màu semantic (success, warning, error, info, accent, neutral).
- `MiratsEmptyState`: Mapping `EmptyState`.
- `MiratsSkeleton`: Mapping `Skeleton`.
- `MiratsCard`: Mapping `Card`.
- `MiratsHeading` / `MiratsText`: Mapping `Heading` / `Text`.
- `MiratsSection`: Mapping `Section`.
- `MiratsDivider`: Mapping `Divider`.
- `MiratsPageHeader`: Mapping `LayoutHeader` + `Stack/Toolbar`.
- `MiratsPageBody`: Mapping `LayoutContent`.

## LỘ TRÌNH THỰC HIỆN

### 1. Chuẩn bị (Namespace & Wrappers)
- Tạo thư mục `src/components/astryx/`.
- Triển khai các component wrapper trên.

### 2. Pilot Route 1: Dashboard (`src/routes/_app.index.tsx`)
- Thay thế `Card`, `SectionHeader`, `Badge`, `StatusDot` bằng `Mirats*` wrappers.
- Giữ nguyên logic widget kéo thả và dữ liệu.

### 3. Pilot Route 2: Danh mục thiết bị (`src/routes/_app.thiet-bi.index.tsx`)
- Thay thế `PageHeader` và các container trình bày.
- Giữ nguyên `StandardTable`.

### 4. Pilot Route 3: Form mới (`src/routes/_app.forms.new.$code.tsx`)
- Thay thế các `Card`, `Section`, `Heading` bao bọc form.
- Giữ nguyên `FormWizardSteps` và `DynamicFieldsForm`.

### 5. Pilot Route 4: Chi tiết hệ thống (`src/routes/_app.he-thong.$id.tsx`)
- Thay thế `Card`, `Badge`, `StatusDot` trong các tab thông tin.
- Giữ nguyên `Tabs` (vì TabList thuộc nhóm interactive/navigation sẽ xử lý ở P6).

### 6. Pilot Route 5: Sơ đồ (`src/routes/_app.so-do.$id.tsx`)
- Thay thế khung layout trình bày bao quanh Mindmap.
- Giữ nguyên logic React Flow.

### 7. Inventory & Batching
- Lập danh sách toàn bộ các route còn lại (dự kiến ~124 route).
- Phân nhóm batch (5 route/batch) để chuyển đổi hàng loạt component trình bày.

## KIỂM TRA & BÁO CÁO
- Typecheck, build thành công sau mỗi route pilot.
- So sánh parity trước/sau (screenshot light/dark, mobile/desktop).
- Báo cáo kết quả batch và dừng nếu có lỗi logic/layout nghiêm trọng.

## CẤM
- Không codemod toàn bộ repo tự động.
- Không thay đổi icon, text hoặc trạng thái nghiệp vụ.
- Không xoá component legacy trong `components/ui` hoặc `components/mirats`.
