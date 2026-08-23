# Kế hoạch khắc phục hiệu năng và hình học bảng (Phase 10Z++)

Người dùng báo cáo:
1. Thanh cuộn ngang không hiển thị hoặc bị khuất.
2. Tab "Theo thành phần" không hiển thị dữ liệu (bị trắng).
3. Cuộn bảng làm trôi cả giao diện (vi phạm One Scroll Owner).
4. FPS lag, sidebar giật cục.

## Phân tích nguyên nhân
- **Scroll Ownership**: `AppShell` hoặc các container trung gian chưa khóa chiều cao (`overflow-hidden`), dẫn đến trình duyệt cuộn toàn trang thay vì cuộn trong bảng.
- **Dữ liệu trắng**: Có thể do logic `Mount-on-Demand` trong `ThanhPhanTable.tsx` hoặc lỗi trong `ComponentTablePanel.tsx` khiến hook không kích hoạt.
- **FPS/Sidebar**: `will-change: transform` có thể đang gây quá tải GPU nếu dùng sai chỗ, hoặc sidebar bị re-render do state changes quá mức.

## Các bước thực hiện

### 1. Khóa Scroll Ownership (Cực kỳ quan trọng)
- Kiểm tra lại `AppShell.tsx` và `PageFrame.tsx` để đảm bảo `h-full min-h-0 overflow-hidden` được áp dụng triệt để.
- Xóa bỏ mọi `min-h-screen` ở các cấp độ con.

### 2. Khôi phục hiển thị Tab Thành phần
- Kiểm tra logic render trong `ThanhPhanTable.tsx` và `ComponentTablePanel.tsx`.
- Đảm bảo `useInfiniteThanhPhanRows` được gọi đúng và không bị chặn bởi các điều kiện ẩn.

### 3. Tối ưu thanh cuộn ngang (Horizontal Scroll Rail)
- Đảm bảo `HorizontalScrollRail` được mount chính xác bên trong `StandardTable`.
- Cố định rail ở đáy view nhìn thấy bằng `sticky bottom-0`.

### 4. Cải thiện FPS & Sidebar
- Sử dụng `React.memo` cho các thành phần Sidebar.
- Điều chỉnh `adaptiveOverscan` trong `DataTableCore.tsx` và `StandardTable.tsx` để nhẹ hơn cho máy yếu.
- Đảm bảo `translate3d` chỉ áp dụng cho các hàng đang hiển thị.

## Kỹ thuật áp dụng
- **CSS Grid/Flex Locking**: `display: flex; flex-direction: column; height: 100%; min-height: 0;`.
- **Z-Index Layering**: Đảm bảo Rail luôn nằm trên các hàng nhưng dưới Header.
- **Render Guard**: `if (!rows.length && !isLoading) return <EmptyState />`.
