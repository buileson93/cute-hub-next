# Plan: Phase 10I - Performance & Architecture

Tập trung tối ưu hóa hiệu năng, tinh gọn kiến trúc và củng cố độ ổn định hệ thống sau các đợt di chuyển dữ liệu lớn.

## 1. Visual Documentation
- Cập nhật `src/components/mirats/TzClock.tsx` `aria-label` với nội dung verbatim Phase 10I để theo dõi tiến độ.

## 2. Tối ưu hóa Bảng (StandardTable & Table Pilot)
- **Fix Mapping**: Sửa lỗi "wrong-row mapping" trong `StandardTable.tsx` (có thể gây sai lệch selection/action trên danh sách lớn hoặc khi filter).
- **Scroll Ownership**: Đảm bảo mỗi bảng chỉ có một scroll owner duy nhất, tránh tình trạng scroll lồng nhau gây khó khăn cho UX.
- **Typed Modes**: Chuẩn hóa các chế độ `client | infinite | paged` cho bảng thông qua các hook dùng chung.
- **Mobile Virtualization**: Tối ưu hóa ảo hóa trên mobile dựa trên các chỉ số benchmark (đích chạm, tốc độ cuộn).

## 3. Tối ưu hóa Realtime (Supabase & Events)
- **Scoped Subscriptions**: Cập nhật các subscription trong `NetworkOverview.tsx` và các component khác để filter theo user/project/conversation ngay từ phía server nếu hỗ trợ.
- **Event Burst Control**: Triển khai `debounce` hoặc `coalesce` cho các luồng sự kiện dày đặc (RT event storm) để tránh hiện tượng reload liên tục.
- **Unmount Cleanup**: Rà soát và đảm bảo 100% các Channel, Listener và Timer được cleanup triệt để khi component unmount.

## 4. Tách biệt Hotspots & Module hóa
- **Responsibility Extraction**: Tách nhỏ các logic phức tạp từ các "điểm nóng" (hotspots) sang các hook hoặc util riêng biệt:
  - `NetworkOverview` (Graph logic vs UI logic).
  - `he-thong` detail route.
  - `StandardTable` (Core rendering vs Logic filtering/sorting).
  - `so-do` detail route.
  - `CatalogTable` và `ThanhPhanTable`.
- **Characterization Tests**: Viết các bài test đặc tính (baseline) trước khi tách logic để đảm bảo không thay đổi hành vi cũ.

## 5. Đo lường & Benchmark
- Thực hiện đo đạc các chỉ số trước và sau khi refactor:
  - **Render count**: Số lần re-render không cần thiết.
  - **Memory usage**: Lượng bộ nhớ chiếm dụng bởi các tập dữ liệu lớn.
  - **Bundle chunk size**: Kích thước các gói JS sau khi tách code.
  - **Interaction latency**: Độ trễ khi thao tác trên UI.

## Technical Details
- Sử dụng `@tanstack/react-virtual` v3 cho các bảng lớn.
- Sử dụng `lodash.debounce` hoặc giải pháp custom cho RT coalescing.
- Duy trì các Adapter API cũ để tránh gây lỗi (breaking changes) cho các component chưa được migrate.
- Tuyệt đối không thay đổi ngôn ngữ thiết kế hoặc hành vi nghiệp vụ (business behavior).
