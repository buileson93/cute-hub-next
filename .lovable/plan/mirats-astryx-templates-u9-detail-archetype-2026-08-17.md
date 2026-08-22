# [MIRATS ASTRYX TEMPLATES — U9: DETAIL ARCHETYPE]

## Bối cảnh & Mục tiêu

Refactor trang chi tiết hệ thống (`src/routes/_app.he-thong.$id.tsx`) theo ngôn ngữ thiết kế Astryx DF3 (Stone skin). Tập trung vào việc chuẩn hoá Anatomy (cấu trúc trang) mà không làm thay đổi logic dữ liệu hoặc quy trình nghiệp vụ hiện có.

## Các thay đổi chính

### 1. Page Anatomy (Cấu trúc trang)

- Sử dụng bộ khung `PageFrame` -> `PageHeader` -> `PageBody` thay cho cấu trúc `div` lồng nhau hiện tại.
- Di chuyển `PageHeader` lên trên cùng, tích hợp breadcrumbs (`Hệ thống > Tên hệ thống`), tiêu đề thực tế, và các hành động (In, Gọn/Đầy đủ).

### 2. Header & Metadata

- Chuẩn hoá `PageHeader`: Title là tên hệ thống, Subtitle là mã BraVO/ID.
- Metadata hiển thị Đơn vị quản lý (với link), Health Score badge, và Gói GPKT.
- Loại bỏ các card header dư thừa lặp lại thông tin.

### 3. Summary & InfoGrid

- Refactor phần "Định danh & chỉ số vận hành" thành một `PageSection` tóm tắt.
- Sử dụng `InfoGrid` cho các cặp Label/Value để đạt được mật độ hiển thị cao và đồng bộ.
- Nhấn mạnh các chỉ số quan trọng (MTBF, Ngày không sự cố) bằng font mono/tabular.

### 4. Tabbed Content Evolution

- Cải thiện giao diện `TabsList` theo phong cách Astryx: Edge-to-edge on mobile, sticky positioning với blur background.
- Giữ nguyên cơ chế deep-link và filter trong tab Nhật ký.
- Standardized `EventRow` và `Timeline` theo visual mới.

### 5. Layout Panels

- Sử dụng `ContentGrid` để phân bổ Card thông tin.
- Tối ưu hóa Sticky Sidebar cho các chỉ số quan trọng khi ở chế độ xem màn hình lớn.

## Kế hoạch thực hiện

1. **Checkpoint 1 (Header/Frame):** Thay thế `HeThongInner` root div bằng `PageFrame` và `PageHeader`.
2. **Checkpoint 2 (Summary/Grid):** Refactor card thông tin trái thành `InfoGrid` trong `PageSection`.
3. **Checkpoint 3 (Charts/Operations):** Căn chỉnh `MiniCharts` và `Timeline` vào `PageBody` grid.
4. **Checkpoint 4 (Tabs/Timeline):** Tối ưu hóa `Tabs` navigation và `Timeline` density.
5. **Validation:** Kiểm tra hiển thị Dark/Light mode, Responsive (Mobile), và tính năng Print.

## Ràng buộc

- Không thay đổi `useOperationsData` hoặc bất kỳ logic query nào.
- Giữ nguyên các Dialog/Sheet (`SuCoMoiForm`, `ThanhPhanChiTietDialog`, v.v.).
- Đảm bảo SSR stability (không sử dụng `window` trực tiếp ngoài `useEffect`).
