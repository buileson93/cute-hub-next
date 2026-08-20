# Kế hoạch: Bổ sung Token Mật độ Mobile & Đảm bảo Đích chạm 44px

Bổ sung hệ thống token mật độ dành riêng cho thiết bị di động (mobile) vào hệ thống MIRATS UI, đảm bảo kích thước đích chạm (touch target) tối thiểu 44px để tối ưu trải nghiệm người dùng trên điện thoại.

## Mục tiêu kỹ thuật
- **Đích chạm tối thiểu:** 44px (iOS/Android standard).
- **Khoảng cách tối thiểu:** 8px giữa hai đích chạm.
- **Quy tắc mật độ:** Tự động ép về `comfortable` trên mobile, vô hiệu hóa `compact`.

## Các bước thực hiện

### 1. Cập nhật `src/lib/mirats/ui/ui-density.ts`
- Thêm các token mới cho Mobile: `CONTROL_H_MOBILE`, `TABLE_ROW_H_MOBILE`, `GAP_MOBILE`.
- Tích hợp logic "Mobile luôn là Comfortable":
  - Sử dụng Tailwind variants `md:` để giữ giá trị hiện tại cho desktop.
  - Sử dụng giá trị mặc định (không có prefix) là giá trị tối ưu cho mobile (44px).
  - Ví dụ: `h-11 md:h-7 md:data-[density=comfortable]:h-8`. (h-11 = 44px).

### 2. Cập nhật `src/components/ui/button.tsx`
- Bổ sung chú thích (JSDoc) cho các size, nêu rõ size nào đạt chuẩn 44px trên mobile.
- Đảm bảo `size="default"` và `size="icon"` đạt 44px (h-11) khi ở màn hình mobile.
- Giữ nguyên tên các variant để không gây lỗi cho 1093 vị trí đang sử dụng.

### 3. Cập nhật `src/lib/mirats/ui/responsive-scope.ts` (Nếu cần)
- Đảm bảo logic nhận diện mobile đồng nhất với hệ thống token mới.

### 4. Viết Test kiểm chứng `src/lib/mirats/ui/__tests__/ui-density.test.ts`
- Kiểm tra không có token mobile nào trả về giá trị chiều cao < 44px (h-11).
- Kiểm tra dưới ngưỡng 768px, giá trị mật độ trả về luôn là `comfortable` dù truyền vào `compact`.

## Thông số kiểm chứng (DevTools 390px)

| Thành phần | Trước (Ước tính) | Sau (Kỳ vọng) | Trạng thái |
| :--- | :--- | :--- | :--- |
| Nút (Default) | 32px - 36px | 44px | Đạt chuẩn |
| Ô chạm (Icon) | 28px - 32px | 44px | Đạt chuẩn |
| Hàng danh sách | ~32px | >= 44px | Đạt chuẩn |
| Khoảng cách nút | 4px | >= 8px | Đạt chuẩn |

## Chi tiết kỹ thuật (dành cho lập trình viên)
- Sử dụng class Tailwind `h-11` (44px) làm base, sau đó ghi đè bằng `md:h-7` hoặc `md:h-8`.
- Token `CONTROL_H` sẽ được cập nhật thành: `h-11 md:h-7 md:data-[density=comfortable]:h-8`.
- Token `TABLE_ROW_H` sẽ được cập nhật để đảm bảo chứa được text 3 tầng trên mobile.
- Token `GAP` sẽ đảm bảo tối thiểu `gap-2` (8px).
