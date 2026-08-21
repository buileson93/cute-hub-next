# Kế hoạch Khôi phục và Bảo vệ Liêm chính UI (U7) - Cập nhật Rà soát Tổng thể

Kế hoạch này tập trung vào việc sửa triệt để các lỗi hiển thị (layout breakage) mà người dùng đã báo cáo, đặc biệt là các nút bấm đang bị chồng lấn, sai kích thước hoặc căn lề, và vùng PowerSearch/TopBar.

## Các vấn đề cần giải quyết
1. **Chồng lấn nút bấm (Button Overlap):** Rà soát toàn bộ các trang chính để tìm và sửa các nút bấm đang đè lên nhau hoặc đè lên nội dung khác.
2. **PowerSearch bị đè (Overlap):** Icon kính lúp và phím tắt Cmd+K đang đè lên chữ gợi ý trong thanh tìm kiếm.
3. **Nút bấm và Input không đồng nhất:** Kích thước font chữ (11px) quá nhỏ và kích thước nút bấm không chuẩn Astryx.
4. **Switch bị lệch:** Nút gạt (thumb) không nằm chính giữa khung.
5. **Tràn trang (Overflow):** Một số trang danh sách (như /su-co) làm xuất hiện thanh cuộn ngang toàn trang.

## Các bước thực hiện

### 1. Rà soát và Sửa lỗi Chồng lấn (Overlap Audit)
- **TopBar Search:** Refactor `src/components/mirats/app-shell/TopBar.tsx`. 
    - Sử dụng `pl-10` để tránh icon kính lúp.
    - Cố định phím tắt Cmd+K ở bên phải bằng `absolute right-3`.
    - Đảm bảo khoảng cách (gap) giữa các icon thông báo, QR, và profile không bị co lại gây chồng lấn.
- **Bulk Action Bar:** Kiểm tra `src/components/mirats/BulkActionBar.tsx` để đảm bảo khi xuất hiện không đè lên các nút thao tác của hàng cuối cùng trong bảng.
- **StandardTable Actions:** Kiểm tra cột thao tác (`actions`) trong `StandardTable.tsx` để nút "Xem thêm" hoặc icon không bị tràn ra ngoài ô.

### 2. Chuẩn hoá Foundation (Astryx Parity)
- **Switch:** Sửa `src/components/ui/switch.tsx` và `astryx-component-skins.css` để ép thumb vào giữa bằng `top-50%` và `translate-y-[-50%]`.
- **Input:** Cập nhật `src/components/ui/input.tsx` để ép font-size lên `13px` và chiều cao chuẩn (h-7/8/9).
- **Button:** Tối ưu logic `loading` để không làm thay đổi chiều rộng nút khi spinner xuất hiện, tránh việc nút bị nhảy kích thước gây chồng lấn các nút lân cận.

### 3. Khắc phục tràn trang & Bố cục
- Đảm bảo `PageFrame` và `PageBody` có `max-w-full overflow-hidden` để ngăn cuộn ngang cấp độ trang.
- Kiểm tra các container dùng Flex/Grid để đảm bảo có `min-w-0` trên các phần tử co giãn, tránh việc đẩy các phần tử khác ra ngoài hoặc chồng lên nhau.

### 4. Xác nhận bằng Playwright (Tiêu chuẩn MIRATS Integrity)
- Viết script `scripts/verify-ui-integrity.py` để:
    - **Quét chồng lấn (Overlap detection):** Sử dụng Playwright để kiểm tra bounding boxes của các nút bấm trong TopBar, Table Toolbar và Form Actions. Nếu các box giao nhau (intersect) > 0px, đánh dấu là lỗi.
    - **Quét cuộn ngang:** Kiểm tra `scrollWidth > clientWidth` của `body` ở nhiều độ phân giải.
    - **Chụp ảnh so sánh:** Chụp ảnh các vùng "nhạy cảm" (TopBar, Search, Table Header) để đảm bảo không còn lỗi hiển thị.

## Chi tiết kỹ thuật
- Tệp ảnh hưởng: `src/components/mirats/app-shell/TopBar.tsx`, `src/components/ui/button.tsx`, `src/components/ui/input.tsx`, `src/components/ui/switch.tsx`, `src/styles/astryx-component-skins.css`, `src/components/mirats/StandardTable.tsx`.
- Công cụ kiểm tra: Playwright, `ui-audit.mjs`.

Tôi sẽ thực hiện rà soát và sửa lỗi ngay sau khi bạn đồng ý.
