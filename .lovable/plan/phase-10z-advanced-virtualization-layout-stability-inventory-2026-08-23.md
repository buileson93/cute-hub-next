# Phase 10Z+: Advanced Virtualization & Layout Stability (Inventory)

Tập trung vào tối ưu hóa hiệu năng chuyên sâu cho các bảng danh mục Thành phần & Tài sản, đảm bảo mượt mà trên thiết bị yếu và duy trì cấu trúc giao diện ổn định.

## Tối ưu hình học và cuộn (Geometry & Scroll Ownership)

1.  **Lock Scroll Chain**: Khóa chiều cao `AppShell` và `PageFrame` để đảm bảo bảng virtualized luôn có container height xác định.
2.  **Sticky Header & Horizontal Rail**: Cố định tiêu đề bảng và đảm bảo thanh cuộn ngang luôn xuất hiện ở đáy vùng hiển thị (viewport), không phải ở đáy toàn bộ tập dữ liệu.
3.  **Layout Isolation**: Áp dụng `contain: content` và `will-change: transform` để GPU hardware acceleration xử lý việc cuộn.

## Tối ưu nạp dữ liệu (Data Loading Optimization)

1.  **Mount-on-Demand (Stage 1)**: Tách `ThanhPhanTable.tsx` thành các sub-panels (`ThanhPhanTablePanel`, `TaiSanTablePanel`). Chỉ mount và chạy các hook nạp dữ liệu của tab hiện tại để tránh lãng phí request và CPU.
2.  **Server-side Filtering**: Chuyển logic search và lọc `bucket` sang server-side trong `fetchKeyset` để giảm tải cho client.
3.  **Keyset Abort Signal**: Hỗ trợ `AbortSignal` để hủy các request cũ ngay lập tức khi người dùng đổi tab hoặc gõ tìm kiếm nhanh.

## Tối ưu Render (Rendering Performance)

1.  **Adaptive Virtualization**: Tự động điều chỉnh `overscan` (4-15 hàng) dựa trên FPS thực tế để cân bằng giữa độ mượt và tài nguyên CPU/Memory.
2.  **Registry Lazy Loading**: Chỉ tải danh mục `dm_model` khi cần thiết (ví dụ: khi hover hoặc mở modal chi tiết), thay vì tải toàn bộ registry lúc bảng mới mount.
3.  **Memoized OptimizedCell**: Sử dụng `dataHash` để so sánh sâu dữ liệu ô, ngăn chặn việc render lại không cần thiết khi cuộn.

## Kỹ thuật chi tiết

- **ThanhPhanTable.tsx**: Tách component chính thành các sub-component nhỏ hơn để dễ quản lý và tối ưu.
- **DataTableCore.tsx**: Nâng cấp thuật toán adaptive overscan.
- **keyset-supabase.ts**: Thêm hỗ trợ abort signal và server filters.
