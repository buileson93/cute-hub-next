# Đồng nhất Font chữ và Kích thước Input trang Đăng nhập

Người dùng phản hồi rằng font chữ trong các ô nhập liệu (Email, Họ tên) không đồng nhất và có vẻ nhỏ hơn so với mong đợi (ví dụ: `Nguyễn Văn A`, `buileson93@gmail.com`). Kế hoạch này sẽ điều chỉnh component `Field` trong trang `auth.tsx` để ép kiểu font chữ và kích thước hiển thị đồng bộ.

## Các thay đổi chính

### 1. Đồng nhất Font chữ và Kích thước cho Input

- Hiện tại `Input` trong `auth.tsx` đang sử dụng class `text-[15px]`, nhưng component `Input.tsx` cơ bản lại có các định nghĩa `text-[11px]` và `text-[13px]` có thể gây xung đột hoặc không đủ lớn trên một số trình duyệt.
- Tôi sẽ cập nhật `Field` component trong `src/routes/auth.tsx` để ép thuộc tính font-size trực tiếp vào phần tử `input` bên trong thông qua prop `className` với modifier `!text-[16px]` (hoặc giá trị phù hợp hơn để trông rõ nét).
- Đảm bảo font chữ sử dụng `Geist Sans` hoặc font hệ thống đồng nhất với toàn bộ giao diện Astryx.

### 2. Tăng cường khả năng hiển thị

- Cập nhật placeholder và text màu sắc để tăng độ tương phản.
- Kiểm tra lại chiều cao `!h-13` để đảm bảo văn bản không bị lệch trục dọc.

## Chi tiết kỹ thuật

### Tệp tin bị ảnh hưởng:

- `src/routes/auth.tsx`

### Cấu trúc dự kiến cho Field:

```tsx
<Input
  // ...
  className="!h-14 !rounded-2xl ... !text-[16px] font-medium"
/>
```

Tôi sẽ sử dụng Playwright để kiểm tra font-family và font-size thực tế được render để đảm bảo `Nguyễn Văn A` và email hiển thị đẹp, rõ ràng và đồng nhất.
