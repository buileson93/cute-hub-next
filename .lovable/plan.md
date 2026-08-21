# Kế hoạch Phase U8.1: Thống nhất Style Ownership & Tối ưu hóa Button Component

Người dùng yêu cầu áp dụng quy trình `obra/superpowers:systematic-debugging` và `test-driven-development` để thống nhất style ownership cho component Button mà không làm thay đổi ngôn ngữ thiết kế MIRATS.

## Mục tiêu
- Phân định rõ ranh giới giữa Tailwind/CVA (Shadcn) và Astryx Skins.
- Đơn giản hóa `button.tsx` để tăng độ ổn định hitbox và render.
- Đảm bảo tính nhất quán của MIRATS Blue (#0074e2) và các token mật độ (Density).

## Các bước thực hiện

### 1. Tạo Fixture Audit (Visual Kit)
- Tạo `src/routes/lovable/ui-kit.tsx` hiển thị toàn bộ các variant (default, outline, ghost, link, destructive), các size (lg, default, sm, xs, icon) và các trạng thái (loading, disabled).
- Fixture này sẽ dùng để kiểm tra computed styles và chụp ảnh visual regression.

### 2. Phân tích Style Ownership
- Sử dụng Playwright để xác định các thuộc tính nào đang bị `.astryx-control` hoặc `.astryx-control-skin` ghi đè (override) so với Tailwind/CVA.
- **Dự kiến thay đổi:**
    - Loại bỏ `.astryx-control` khỏi `buttonVariants` trong `src/components/ui/button.tsx` nếu Tailwind có thể đảm nhận hoàn toàn (border, radius, transition).
    - Thu hẹp selector trong `src/styles/astryx-component-skins.css` để chỉ áp dụng cho các thành phần Astryx thuần túy, không ghi đè global lên Shadcn components trừ khi được yêu cầu.

### 3. Tối ưu hóa Button Component
- Xóa bỏ các nhánh logic `loading` phức tạp gây dư thừa DOM.
- Tách biệt logic Tooltip (hiện đã được tích hợp) để đảm bảo không làm phình to component chính.
- Sử dụng `min-h-` thay cho `h-` để đảm bảo độ cao tối thiểu ổn định theo `UI_DENSITY`.

### 4. Kiểm chứng (Verification)
- Chạy `ui:audit` để kiểm tra vi phạm typography/color.
- Chạy visual regression test so sánh screenshots trước và sau thay đổi.

## Danh sách Selectors/Tokens dự kiến thay đổi

### Selectors
- `.astryx-control`: Sẽ được thu hẹp scope hoặc loại bỏ các thuộc tính trùng lặp với Tailwind CVA (ví dụ: `font-weight: 500`, `transition`).
- `buttonVariants`: Cập nhật class base và các variant `size`.

### Tokens
- `CONTROL_H`: Đảm bảo đồng bộ với `min-h` trong CVA.
- `--scale-active`: Thống nhất ở mức `0.98`.

## Bản đồ tệp tin (File Map)
- `src/components/ui/button.tsx`: Refactor cấu trúc DOM và styles.
- `src/styles/astryx-component-skins.css`: Thu hẹp scope `.astryx-control`.
- `src/lib/mirats/ui/ui-density.ts`: (Nếu cần) Điều chỉnh token mật độ.
- `src/routes/lovable/ui-kit.tsx`: Fixture phục vụ audit.
