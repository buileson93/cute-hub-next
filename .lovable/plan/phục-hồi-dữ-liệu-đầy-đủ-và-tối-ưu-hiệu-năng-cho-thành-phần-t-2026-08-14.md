# Phục hồi dữ liệu đầy đủ và Tối ưu hiệu năng cho Thành phần & Tài sản

Người dùng báo cáo dữ liệu trong database có 1.185 thành phần nhưng bảng chỉ hiển thị 1000. Đây là lỗi giới hạn mặc định của PostgREST. Nhiệm vụ là nạp đầy đủ dữ liệu (1.185+) trong khi vẫn duy trì ảo hóa (virtualization) để đảm bảo hiệu năng mượt mà.

## Bối cảnh kỹ thuật
- **Vấn đề số lượng**: Các hàm RPC (`rpc_thanh_phan_toan_cuc`, `rpc_tai_san_toan_cuc`) bị ngắt ở 1000 dòng.
- **Giải pháp nạp**: Sử dụng helper `fetchAllRows` hoặc gọi RPC kèm `.range()` theo vòng lặp để lấy trọn bộ dữ liệu.
- **Giải pháp hiệu năng**: Sử dụng `StandardTable` (đã tích hợp `@tanstack/react-virtual`) để chỉ render các dòng trong viewport, giúp xử lý hàng nghìn dòng mà không gây lag UI.

## Các mục cần thực hiện

### 1. Nạp đầy đủ dữ liệu (ThanhPhanTable.tsx)
- Cập nhật `useThanhPhanRows` và `useTaiSanRows` trong `src/components/mirats/ThanhPhanTable.tsx`.
- Triển khai vòng lặp nạp dữ liệu từ RPC bằng cách sử dụng `.range(from, to)` cho đến khi lấy hết.

### 2. Đảm bảo Ảo hóa (StandardTable.tsx)
- Kiểm tra cấu hình `useVirtualizer` trong `StandardTable.tsx` để chắc chắn nó hoạt động tốt với tập dữ liệu > 1000 dòng.
- Đảm bảo chiều cao các dòng (`h-7`/`h-8` theo chuẩn UI Density) được tính toán chính xác cho bộ ảo hóa.

### 3. Kiểm soát các bảng danh mục (db-taxonomy.ts)
- Rà soát các bảng danh mục lớn (`dm_he_thong`, `dm_vi_tri`...) trong `loadTaxonomy`. Nếu có nguy cơ vượt 1000 dòng, chuyển sang dùng `fetchAllRows`.

## Kế hoạch triển khai

### Bước 1: Sửa logic nạp dữ liệu RPC
- Modifiy `useThanhPhanRows` và `useTaiSanRows` để gọi RPC theo từng trang 1000 dòng.

### Bước 2: Kiểm tra Virtualization
- Xác minh `StandardTable` đang nhận đúng `rows` và `virtualizer` đang hoạt động (không render toàn bộ DOM cùng lúc).

### Bước 3: Kiểm định và Hiển thị
- Cập nhật các badge số lượng trên nút chuyển đổi chế độ (`ModeToggle`) để hiển thị con số thực tế (1.185+).
- Mở bảng "Thành phần & tài sản", kiểm tra tổng số dòng ở footer và trên các nút chuyển đổi (phải khớp với dữ liệu thực).
- Cuộn nhanh qua danh sách để xác nhận không bị giật lag (hiệu năng ảo hóa).


