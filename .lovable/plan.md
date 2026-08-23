# Kế hoạch khắc phục lỗi Build: Unified TypeScript Components

Người dùng gặp lỗi build `Unexpected JSX expression` trong tệp `.js`. Điều này xảy ra do các thành phần UI phức tạp chứa JSX (như `DataTableCore.js`) được build từ TypeScript nhưng tệp `.js` gốc vẫn tồn tại hoặc được tạo ra sai cách, khiến Vite cố gắng transform tệp JavaScript không hợp lệ cho môi trường production.

## Các bước thực hiện

1. **Dọn dẹp các tệp JavaScript dư thừa**: Đã thực hiện xóa `src/components/mirats/DataTableCore.js` và `src/components/mirats/StandardTable.js`. Việc tồn tại song song tệp `.tsx` và `.js` cùng tên thường gây xung đột trong quá trình build của Vite/TanStack Start.
2. **Kiểm tra và chuẩn hóa tệp TypeScript**:
    - Đảm bảo `src/components/mirats/DataTableCore.tsx` và `src/components/mirats/StandardTable.tsx` không có lỗi cú pháp.
    - Xác minh các import và export trong các tệp `.tsx` này.
3. **Xác minh môi trường Build**:
    - Kiểm tra `build-errors.log` để đảm bảo không còn lỗi sau khi xóa các tệp `.js`.
    - Đảm bảo các thành phần như `OptimizedCell` và `StatusBadge` được import đúng từ tệp nguồn TypeScript.

## Chi tiết kỹ thuật

- **Nguyên nhân**: Vite transform lỗi khi gặp JSX trong tệp `.js` mà không có cấu hình transformer phù hợp cho JavaScript thuần túy. Trong dự án này, chúng ta sử dụng TypeScript làm tiêu chuẩn.
- **Giải pháp**: Luôn ưu tiên tệp `.tsx`. Xóa bỏ các tệp `.js` được sinh ra tự động hoặc do lỗi copy-paste trước đó trong thư mục `src/components/mirats/`.

## Các tệp bị ảnh hưởng

- `src/components/mirats/DataTableCore.js` (Đã xóa)
- `src/components/mirats/StandardTable.js` (Đã xóa)
- `src/components/mirats/DataTableCore.tsx` (Xác minh)
- `src/components/mirats/StandardTable.tsx` (Xác minh)
