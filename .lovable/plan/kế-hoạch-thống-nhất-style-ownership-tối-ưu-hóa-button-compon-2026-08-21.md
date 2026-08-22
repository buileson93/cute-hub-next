# Kế hoạch: Thống nhất Style Ownership & Tối ưu hóa Button Component (Phase U8.1)

Mục tiêu là làm sạch kiến trúc CSS, giải quyết xung đột giữa Tailwind/CVA và Astryx Skins, đồng thời đơn giản hóa component Button mà không làm thay đổi ngôn ngữ thiết kế MIRATS Blue.

## 1. Tìm hiểu & Thử nghiệm (Audit)

- **Tạo Fixture**: Sử dụng trang `/_app/admin/ui-kit` để hiển thị mọi trạng thái (Loading, Disabled, Hover, Active) của các variant (Default, Secondary, Outline, Ghost, link) trên 3 mức mật độ (Compact, Comfortable, Spacious).
- **Phân tích Computed Style**: Xác định các thuộc tính bị ghi đè (Border, Border-Radius, Transition) bởi lớp `.astryx-control` đang được gán cứng trong CVA.

## 2. Thay đổi dự kiến (File Map)

### `src/components/ui/button.tsx`

- **Cấu trúc lại CVA**: Loại bỏ `.astryx-control` khỏi lớp cơ sở nếu nó gây xung đột với các tiện ích Tailwind (như `rounded-lg` vs `var(--radius-element)`).
- **Đơn giản hóa renderContent**: Loại bỏ logic loading phức tạp, sử dụng cấu trúc phẳng hơn để tránh lỗi hitbox và render icon.
- **Tách Tooltip**: Đảm bảo Tooltip chỉ bao bọc khi cần thiết, không làm gián đoạn DOM structure của button.

### `src/styles/astryx-component-skins.css`

- **Thu hẹp Scope**: Chuyển `.astryx-control` thành một utility class thuần túy hoặc sử dụng data-attribute (ví dụ `[data-astryx-skin="true"]`) để tránh áp dụng toàn cục lên mọi button nếu không cần thiết.
- **Loại bỏ thuộc tính dư thừa**: Nếu CVA đã định nghĩa `font-weight: 600` và `transition`, xóa chúng khỏi skin CSS để Tailwind làm chủ (Source of Truth).

### `src/lib/mirats/ui/ui-density.ts`

- **Đồng bộ Height**: Đảm bảo `CONTROL_H` khớp chính xác với chiều cao mong đợi của các skin Astryx (32px/36px/40px).

## 3. Danh sách Selector & Token dự kiến thay đổi

- **Selectors**:
  - `.astryx-control` (Giảm ưu tiên hoặc thu hẹp scope)
  - `.astryx-control-skin` (Hợp nhất vào CVA secondary/ghost)
  - `buttonVariants` (Làm sạch base classes)
- **Tokens**:
  - `var(--radius-element)` -> Đồng bộ với `rounded-lg` (10px/12px)
  - `var(--color-primary)` -> Ép sử dụng OKLCH từ `src/styles.css`
  - `var(--duration-fast)` -> Sử dụng đồng nhất qua `transition-mirats-fast`

## 4. Kiểm tra & Báo cáo

- **Visual Regression**: Chụp ảnh màn hình trước/sau tại fixture route.
- **Typecheck & Build**: Chạy `tsgo` và `npm run build` để đảm bảo không lỗi runtime.
- **UI Audit**: Chạy `scripts/ui-audit.mjs` để xác nhận không có vi phạm mới về Typography/Color.

Checkpoint: Tôi sẽ trình bày Fixture và Baseline trước khi thực hiện bất kỳ thay đổi nào vào logic component core.
