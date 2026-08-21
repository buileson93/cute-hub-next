# Kế hoạch Khôi phục và Bảo vệ Liêm chính UI (U7)

Kế hoạch này tập trung vào việc sửa triệt để các lỗi hiển thị (layout breakage) mà người dùng đã báo cáo, đặc biệt là vùng PowerSearch, TopBar và các nút bấm bị sai kích thước hoặc căn lề.

## Các vấn đề cần giải quyết
1. **PowerSearch bị đè (Overlap):** Icon kính lúp và phím tắt Cmd+K đang đè lên chữ gợi ý trong thanh tìm kiếm.
2. **Nút bấm và Input không đồng nhất:** Kích thước font chữ (11px) quá nhỏ và kích thước nút bấm không chuẩn Astryx.
3. **Switch bị lệch:** Nút gạt (thumb) không nằm chính giữa khung.
4. **Tràn trang (Overflow):** Một số trang danh sách (như /su-co) làm xuất hiện thanh cuộn ngang toàn trang.

## Các bước thực hiện

### 1. Chuẩn hoá Foundation (CSS & UI Components)
- **Switch:** Sửa `src/components/ui/switch.tsx` và `astryx-component-skins.css` để ép thumb vào giữa bằng `top-50%` và `translate-y-[-50%]`.
- **Input:** Cập nhật `src/components/ui/input.tsx` để ép font-size lên `13px` và chiều cao chuẩn theo mật độ (h-7/8/9).
- **Button:** Tối ưu logic `loading` để không làm thay đổi chiều rộng nút khi spinner xuất hiện.

### 2. Sửa lỗi hiển thị TopBar & PowerSearch
- **TopBar Search:** Refactor `src/components/mirats/app-shell/TopBar.tsx`. 
    - Sử dụng `pl-10` để tránh icon kính lúp.
    - Cố định phím tắt Cmd+K ở bên phải bằng `absolute right-3`.
    - Tăng `z-index` cho các thành phần điều khiển để không bị đè bởi nền.
- **PowerSearch Dialog:** Kiểm tra padding và margin của các `CommandItem` để tránh tràn văn bản.

### 3. Khắc phục tràn trang (StandardTable)
- Thêm `max-w-full overflow-hidden` vào `PageFrame` và `PageBody` của các trang G1.
- Đảm bảo `StandardTable` luôn có `overflow-x-auto` ở cấp độ container của nó.

### 4. Kiểm chứng bằng Playwright (Tiếng Việt)
- Viết script `scripts/verify-ui-fix.mjs` sử dụng Playwright để:
    - Chụp ảnh vùng tìm kiếm và so sánh toạ độ các icon.
    - Quét lỗi tràn ngang (horizontal scroll) ở độ phân giải 1280px và 390px (mobile).
    - Kiểm tra đích chạm (touch target) của các nút.

## Chi tiết kỹ thuật
- Tệp ảnh hưởng: `src/components/mirats/app-shell/TopBar.tsx`, `src/components/ui/button.tsx`, `src/components/ui/input.tsx`, `src/components/ui/switch.tsx`, `src/styles/astryx-component-skins.css`.
- Công cụ kiểm tra: Playwright, `ui-audit.mjs`.

Tôi sẽ tiến hành thực hiện ngay sau khi bạn đồng ý.
