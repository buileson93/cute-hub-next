# Kế hoạch Cải thiện UI/UX & Khắc phục lỗi Bảng (Phase 11C)

Cập nhật lộ trình chuẩn hóa hệ thống MIRATS theo các yêu cầu mới về tối ưu giao diện bảng và bộ design tokens, đồng thời khắc phục lỗi chức năng chọn dòng và tải dữ liệu.

## Các thay đổi chính

### 1. Cập nhật Tooltip Lộ trình (Visual Text Edits)
Thay thế văn bản trong `src/components/mirats/app-shell/TopBar.tsx` (tooltip của `TzClock`) thành nội dung lộ trình mới:
> "Refactor các bảng dữ liệu để tối ưu column width, overflow và pagination cho desktop, tablet và mobile, đồng thời tránh tình trạng bị khuất nội dung.\n\nÁp dụng bộ design tokens cho toàn bộ spacing, typography và kích thước nút trên tất cả component, đồng thời rà soát lại các trạng thái hover/focus/disabled.\n\n\nCác bảng đang không select all và selec từng dòng được , và đang không tải hết được các dữ liệu tải xong 100/all là dừng nghiên cứu lý do và đưa kế hoạch khắc phục"

### 2. Khắc phục lỗi Bảng (StandardTable & Keyset Pagination)
- **Lỗi Chọn (Selection):** 
    - Kiểm tra logic `toggleRow` và `toggleAll` trong `StandardTable.tsx`.
    - Đảm bảo `getRowId` luôn trả về giá trị duy nhất (không dùng `Math.random()` làm fallback nếu thiếu ID).
    - Đồng bộ `selected` state giữa `StandardTable` và các panel gọi nó (`ComponentTablePanel`, `AssetTablePanel`).
- **Lỗi Tải dữ liệu (100/all):**
    - Kiểm tra `useInfiniteThanhPhanRows` và `useInfiniteTaiSanRows` (trong `src/components/mirats/ThanhPhanTable.tsx`).
    - Khắc phục lỗi dừng ở 100 dòng do giới hạn `pageSize` hoặc logic `hasNextPage` trong Supabase RPC/View calls.
    - Đảm bảo Keyset Pagination hoạt động đúng để tải vô tận (Infinite Scroll).

### 3. Tối ưu Giao diện Bảng (Responsive & Column Width)
- Điều chỉnh `minW` và `cellClassName` trong `ComponentTablePanel.tsx` và `AssetTablePanel.tsx` để cột không chiếm quá nhiều diện tích.
- Cải thiện hiển thị trên Mobile: Đảm bảo `HorizontalScrollRail` hoạt động ổn định và nội dung quan trọng không bị ẩn.
- Áp dụng triệt để bộ tokens từ `ui-density.ts` cho các trạng thái Hover/Focus.

## Chi tiết kỹ thuật
- **File ảnh hưởng:**
    - `src/components/mirats/app-shell/TopBar.tsx` (Tooltip text)
    - `src/components/mirats/StandardTable.tsx` (Selection logic)
    - `src/components/mirats/ThanhPhanTable.tsx` (Infinite loading logic)
    - `src/components/mirats/inventory/ComponentTablePanel.tsx` & `AssetTablePanel.tsx` (Column geometry)
- **Bảo mật:** Duy trì RLS bằng cách sử dụng views `v_tai_san_toan_cuc` và `v_thanh_phan_toan_cuc`.
