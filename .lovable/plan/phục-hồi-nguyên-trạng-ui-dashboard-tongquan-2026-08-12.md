# Phục hồi nguyên trạng UI Dashboard (TongQuan)

Phục hồi giao diện nguyên bản (visual contract) của trang Tổng quan KPI trong khi vẫn duy trì logic xử lý dữ liệu, KPI chính xác và tính an toàn kiểu dữ liệu của phiên bản mới.

## Phân tách các thành phần

### 1. Presentation (Phải phục hồi bản cũ)

- **Cấu trúc Wrapper**: Thay thế `<PageBody>` bằng `div` với lớp `gap-4 p-4 md:p-6`.
- **Khoảng cách (Spacing)**: Loại bỏ `space-y-4` chồng lấn trong các section của `PageBody`.
- **Card DOM & Click Area**: Phục hồi cấu trúc DOM cũ của `KpiCard` và `HealthTile`, đảm bảo vùng nhấp chuột và hiệu ứng hover khớp pixel.
- **Header & Title**: Phục hồi nhãn, màu sắc và cỡ chữ của `SectionHeader` và `CardTitle`.
- **HealthTile**: Gỡ bỏ lớp bọc `TooltipProvider/Tooltip/div` không cần thiết, đưa `description` về dạng text/hint cũ nếu bản cũ có, hoặc loại bỏ nếu là mới thêm.
- **Biểu đồ**: Khôi phục chiều cao và tỷ lệ của các biểu đồ Recharts.

### 2. Logic & Data (Giữ nguyên bản mới)

- **Dữ liệu KPI & Query**: Giữ nguyên logic `useQuery` và các hàm tính toán KPI từ RPC Supabase.
- **Loading & Refresh**: Giữ nguyên trạng thái `loading` (Skeleton) và nút `Làm mới`.
- **Tooltip Recharts**: Giữ các alias Tooltip trong biểu đồ để hiển thị tiếng Việt chính xác.
- **Typed Links**: Giữ `Link` với params/search an toàn từ TanStack Router.

## Kế hoạch thực hiện

### Bước 1: Phục hồi cấu trúc Layout và Spacing

- Sửa `src/routes/_app.tong-quan.tsx`: Thay `<PageBody>` bằng `div className="flex flex-1 flex-col gap-4 p-4 md:p-6 overflow-auto"`.
- Loại bỏ các lớp `space-y-4` bên trong để tránh nhân đôi khoảng cách.

### Bước 2: Phục hồi KpiCard và HealthTile

- Chỉnh sửa component `KpiCard` để khớp DOM cũ (loại bỏ transition shadow nếu bản cũ không có).
- Chỉnh sửa `HealthTile`:
  - Chỉ giữ lại Tooltip cho các chỉ số thực sự phức tạp (tối đa 1 InfoHint mỗi section).
  - Phục hồi nhãn Compliance đầy đủ.
  - Loại bỏ chữ nghiêng hoặc các style phụ mới thêm.

### Bước 3: Tinh chỉnh SectionHeader và CardTitle

- Phục hồi `SectionHeader` (loại bỏ text phụ hoặc icon mới nếu không có trong bản cũ).
- Sửa lại `CardTitle` để không chứa mô tả dài, chuyển mô tả vào Tooltip chỉ khi cần thiết.

### Bước 4: Kiểm tra và Đối chiếu (Acceptance)

- Kiểm tra trên 3 kích thước màn hình: Desktop (1440px), Tablet, Mobile.
- Đối chiếu pixel-perfect với bản "chaytot".
- Kiểm tra lại các link điều hướng (MTTR -> `/bao-tri`, v.v.).

## Invariants (Ràng buộc)

- Không thiết kế lại Overview.
- Không thêm mô tả/chữ nhỏ/icon mới.
- Không đổi màu/token đã định nghĩa.
- Giữ nguyên thứ tự các section.
