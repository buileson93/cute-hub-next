# Kế hoạch tinh chỉnh giao diện "Nhẹ và Sạch" (Compact & Minimalist UI)

Mục tiêu là đạt được cảm giác nhẹ nhàng, hiện đại như mẫu SnowUI (card bo tròn 16px, viền mảnh, chiều sâu bằng màu nền thay vì bóng đổ), trong khi vẫn giữ nguyên hệ màu chủ đạo của MIRATS (Brand Blue, Status Colors).

## 1. Rà soát & Cập nhật Theme (src/styles.css)

Thay vì hard-code, chúng ta sẽ điều chỉnh bộ biến CSS gốc để các component tự động thừa hưởng.

### Đề xuất giá trị mới:
- `--radius`: Tăng từ `0.625rem` (10px) lên `1rem` (16px) cho `rounded-lg` (thường dùng cho card).
- `--border`: Giảm độ tương phản. Hiện tại `oklch(0.92 0.004 250)`. Sẽ chuyển sang `oklch(0.95 0.002 250)` (~5% tương phản trên nền trắng) để đạt độ mảnh 6-8%.
- `--muted`: Tăng nhẹ độ sáng để làm nền phân cách thay cho bóng đổ.
- `surface-elegant`: Loại bỏ bóng đổ nặng, chỉ giữ lại viền mảnh và bóng đổ cực nhẹ (1px).

## 2. Đồng bộ hóa Token (src/lib/mirats/ui/ui-density.ts)

- `CARD_RADIUS`: Sử dụng `rounded-2xl` (tương ứng 16px).
- `CONTROL_RADIUS` (mới): `rounded-lg` (tương ứng 8px) cho Button, Input.
- `BADGE_RADIUS` (mới): `rounded-full` cho badge tròn đầy.
- Đảm bảo các token này được sử dụng nhất quán thay vì các class lẻ tẻ.

## 3. Cập nhật Component Base (shadcn UI)

### Các file cần sửa đổi:
- `src/components/ui/card.tsx`: Đảm bảo dùng `UI_DENSITY.CARD_RADIUS` và bỏ bóng đổ (`shadow-sm` -> `shadow-none` hoặc `shadow-[0_1px_2px_rgba(0,0,0,0.05)]`).
- `src/components/ui/button.tsx` & `input.tsx`: Chuyển từ `rounded-md` sang `rounded-lg` (8px).
- `src/components/ui/badge.tsx`: Chuyển từ `rounded-md` sang `rounded-full`.
- `src/components/mirats/app-shell/AppShell.tsx`: Bỏ `bg-gradient-to-br` nếu nó tạo cảm giác nặng nề, chuyển sang nền phẳng `bg-background` với các vùng `bg-muted/30` để phân tách.

## 4. Kiểm tra & Bảo toàn

- **Giữ nguyên màu trạng thái**: Tuyệt đối không chạm vào logic màu cho: Đang khai thác (Emerald), Dự phòng (Blue), Sửa chữa (Amber), Hỏng (Red), Thanh lý (Slate).
- **Độ tương phản**: Kiểm tra text trên `bg-muted` hoặc các vùng màu nhạt của Primary để đảm bảo đạt chuẩn 4.5:1.
- **Dark Mode**: Cập nhật biến `--border` trong block `.dark` để đảm bảo không bị quá mờ hoặc quá gắt.

## Danh sách file sửa đổi:
1. `src/styles.css`
2. `src/lib/mirats/ui/ui-density.ts`
3. `src/components/ui/card.tsx`
4. `src/components/ui/button.tsx`
5. `src/components/ui/input.tsx`
6. `src/components/ui/badge.tsx`
7. `src/components/mirats/app-shell/AppShell.tsx` (loại bỏ gradient nền và bóng đổ rail)
8. `src/components/mirats/StandardTable.tsx` (nếu cần tinh chỉnh viền dòng)
