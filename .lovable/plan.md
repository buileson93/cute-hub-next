# Plan - Khôi phục Dashboard và KPIs MIRATS 2.0

Khôi phục các khối chỉ số quan trọng (Availability, MTTR, MTBF), PM đúng hạn, và phân bố sức khỏe tài sản A/B/C/D đã bị mất sau lần refactor trước, đồng thời tối ưu hóa cơ chế tải dữ liệu SSR.

## User Review Required

> [!IMPORTANT]
> Dashboard sẽ sử dụng dữ liệu thực từ `useScope` (CSDL) thay vì các hàm RPC `dashboard_health` mới, để đảm bảo tính nhất quán với logic tính toán cũ.

- Bạn có muốn giữ biểu đồ xu hướng sự cố hiện tại hay thay thế bằng biểu đồ Availability/Downtime không? (Tạm thời sẽ giữ cả hai trong các tab).
- Nút "Xuất báo cáo" sẽ thực hiện tải xuống CSV dữ liệu thiết bị hay một bản tóm tắt KPI? (Tạm thời sẽ cấu hình tải CSV danh mục thiết bị).

## Proposed Changes

### Logic và Data Loading (`src/routes/_app.index.tsx`)
- Thay đổi `loader` để đảm bảo prefetch các query cơ bản từ `useDbTaxonomy`, `useLicensesData`, và `useOperationsData` (thông qua `useScope` dependencies).
- Cập nhật Component `Dashboard` để sử dụng `useScope()` lấy dữ liệu thiết bị, sự cố, và bảo trì theo phạm vi đơn vị.
- Tích hợp `usePmOnTimeKpi` từ `@/lib/mirats/bao-tri-kpi` để lấy tỉ lệ PM đúng hạn.
- Tính toán Availability, MTTR, MTBF bằng `availability()`, `mttr()`, `mtbf()` từ `@/lib/mirats/reliability`.
- Phân loại sức khỏe tài sản A/B/C/D dùng `healthDetail` từ `@/lib/mirats/metrics`.
- Sửa cơ chế SSR: Thay `useSuspenseQuery` bằng `useQuery` với trạng thái loading/error tường minh để tránh treo trang khi prefetch lỗi.

### UI Components (`src/routes/_app.index.tsx`)
- **Khối KPIs độ tin cậy:** Thêm hàng card hiển thị Availability, MTTR, MTBF với màu sắc chỉ thị (xanh/cam/đỏ).
- **Khối Sức khỏe tài sản:** Thêm biểu đồ donut hoặc thanh tiến độ hiển thị tỉ lệ tài sản xếp loại A, B, C, D.
- **Khối PM đúng hạn:** Hiển thị tỉ lệ phần trăm hoàn thành PM đúng hạn.
- **Nút Xuất báo cáo:** Thêm icon `Download` cạnh tiêu đề trang để xuất dữ liệu.
- **Tabs chi tiết:** Thêm tab hiển thị bảng danh sách thiết bị có sức khỏe thấp (loại C, D).

### Bảo trì tính năng mới
- Giữ nguyên `HeartBeatStrip` (Nhịp tim hệ thống).
- Giữ nguyên `LiveTimeline` (Nhật ký vận hành).
- Giữ các chỉ số Completeness hiện có nhưng sắp xếp lại bố cục cho hài hòa.

## Technical Details

### Imports phục hồi
```typescript
import { availability, mttr, mtbf, formatKpiValue } from "@/lib/mirats/reliability";
import { healthDetail } from "@/lib/mirats/metrics";
import { usePmOnTimeKpi } from "@/lib/mirats/bao-tri-kpi";
import { useScope } from "@/lib/mirats/scope";
import { isFeatureEnabled } from "@/lib/mirats/feature-flags";
import { fmtDowntime } from "@/lib/mirats/format";
```

### Cấu trúc dữ liệu tính toán
- `devices`: `scope.thietBi`
- `incidents`: `scope.suCo`
- `reliability`: `availability({ assetCount: devices.length, windowHours: 720, incidents })`
- `healthStats`: Duyệt `devices` gọi `healthDetail(t)` và gom nhóm theo `xepLoai`.

### Xử lý SSR
- Trong `loader`: Gọi `queryClient.prefetchQuery` cho các core functions.
- Trong `Dashboard`: Dùng `useQuery` và kiểm tra `if (isLoading) return <LoadingSkeleton />` thay vì suspend.

### Ràng buộc
- Ngôn ngữ: Tiếng Việt.
- Styling: Tailwind CSS, Apple-like minimal.
- An toàn: Không bypass RLS.
