# Phase 10H: Data Loading Optimization & Integrity

Lập kế hoạch tối ưu hóa hiệu năng tải dữ liệu, loại bỏ hiện tượng nạp dư thừa (eager loading) và sửa lỗi cắt dữ liệu âm thầm (silent truncation).

## Inventory & Phân loại
Hiện tại hệ thống có khoảng 139 vị trí dùng `.limit()` và 338 vị trí dùng `.slice()`. `ScopeProvider` đang nạp hàng nghìn bản ghi vào bộ nhớ trình duyệt ngay khi khởi tạo route `/_app`.

- **Intentional Bounded Lookup**: Các bảng danh mục nhỏ (đơn vị, nhóm hệ thống, trạng thái) - Giữ nguyên.
- **Bug Silent Truncation**: Các query `fetchAllRows` hoặc `.limit(1000)` dùng cho dữ liệu lớn (Thiết bị, Sự cố, Bảo trì) - Chuyển sang Paged/Infinite.
- **Server Paged**: Danh sách tài sản, lịch sử vận hành - Chuyển sang server-side pagination.
- **Payload Hotspots**: `select *` trên bảng `thiet_bi` (nhiều cột JSON/text nặng) - Chuyển sang `TB_COLS` chọn lọc.

## Các bước thực hiện

### 1. Tối ưu ScopeProvider (Phá vỡ Bottleneck)
- Loại bỏ việc nạp `useDbTaxonomy`, `useLicensesData`, và `useOperationsData` tại root `ScopeProvider`.
- Thay bằng lazy fetching hoặc route-level queries. `ScopeProvider` chỉ giữ lại context về `donViCode` và `permissions`.

### 2. Pilot Route Migration: Danh sách Thiết bị (`/_app.danh-muc.thiet-bi`)
- Chuyển từ `useScope().thietBi` (nạp full memory) sang `useThietBiList` (paged server query).
- Áp dụng `TB_COLS` để giảm kích thước payload.
- Cập nhật UI hiển thị: "Đang hiển thị X trên tổng số Y tài sản".
- Đảm bảo Filter/Sort chạy trên toàn bộ tập dữ liệu (server-side) thay vì lọc trên mảng memory.

### 3. Cải thiện List UI & Infinite Scroll
- Tích hợp `DataTableCore` với logic `onLoadMore` cho các danh sách lớn.
- Loại bỏ các logic `.slice(0, 100)` cứng nhắc trong component con.

### 4. Benchmark
- Đo lường Query Count, Payload Bytes (gZIP), TTFB và Memory usage của route Pilot.
- Rollout cho các route Sự cố, Bảo trì sau khi Pilot thành công.

## Technical Details

### New Service: `src/lib/mirats/db-thiet-bi.ts`
Cung cấp `useThietBiList` với:
- `range(from, to)` của Supabase.
- `count: 'exact'` để lấy tổng số bản ghi.
- Mapping type an toàn từ Database Row sang `ThietBi` UI interface.

### Refactor `ScopeProvider`
```typescript
// src/lib/mirats/scope.tsx
// CHỈ nạp taxonomy nhỏ (Đơn vị, Nhóm HT)
const { data: baseTax } = useBaseTaxonomy(); 
// KHÔNG nạp devices, suCo, baoTri, hongHoc...
```

## Kết quả cần đạt
- Giảm 70-90% payload ban đầu khi vào trang Tổng quan.
- Không còn lỗi mất dữ liệu khi số lượng tài sản vượt ngưỡng 1000.
- Filter/Sort chính xác trên toàn bộ phạm vi dữ liệu của đơn vị.

Commit:
- perf(data): remove global eager data loads
- fix(list): expose and remove silent truncation
- perf(query): select only required columns
