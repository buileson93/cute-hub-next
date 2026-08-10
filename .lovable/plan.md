# Kế hoạch T36: Sửa việc chữ vỡ khi vùng nội dung hẹp (Container Queries)

Dự án sử dụng Tailwind v4, cho phép sử dụng Container Queries trực tiếp để giải quyết vấn đề grid đo theo cửa sổ trình duyệt thay vì không gian thực tế của nội dung.

## Giai đoạn 1: Khảo sát (Đã hoàn thành)
- Tailwind version: 4.2.1 (Hỗ trợ sẵn container queries).
- Container Queries syntax: `@md`, `@lg` hoặc `@[width]`.
- Sidebar hiện tại: Có thể thu gọn về 0px, nhưng khi mở rộng (16rem) sẽ chiếm không gian gây vỡ lưới 3-4 cột ở các màn hình laptop.

## Giai đoạn 2: Triển khai mẫu (Proof of Concept)
1. **AppShell.tsx**: Đánh dấu thẻ `<main>` là container chính.
   - Thêm lớp `[@container]` vào dòng 256.
2. **_app.kiem-dinh.tsx**: Chuyển đổi lưới tại dòng 226.
   - Thay vì `grid-cols-3` cố định, sử dụng: `grid grid-cols-1 @md:grid-cols-2 @xl:grid-cols-3`.
   - Lưu ý: Các breakpoint `@md`, `@xl` của container query trong Tailwind v4 mặc định tương đương với các breakpoint của màn hình nhưng đo theo container.
3. **Kiểm tra**: Thu hẹp thanh menu và cửa sổ để xác nhận lưới nhảy cột đúng lúc nội dung hẹp lại.

## Giai đoạn 3: Nhân rộng (18 vị trí còn lại)
Chia làm các đợt nhỏ (batch 5 file) để đảm bảo không gây lỗi hồi quy:

### Lượt 1: Các Dialog và Preview quan trọng
- `FieldPreview.tsx`
- `FormFieldRuntime.tsx`
- `ThanhPhanChiTietDialog.tsx`

### Lượt 2: Các trang quản lý (Manager/Admin)
- `ThanhPhanManager.tsx`
- `_app.admin.forms.$id.tsx`
- `admin.audit.tsx`

### Lượt 3: Các trang nghiệp vụ (Dự án/Sổ lý lịch)
- `_app.du-an.$id.tsx`
- `_app.du-an.index.tsx`
- `_app.so-do.$id.tsx`

### Lượt 4: Các trang báo cáo và vấn đề
- `_app.tuoi-tho.tsx`
- `_app.van-de.tsx`

## Quy tắc mới cho MIRATS 2.0
- Cập nhật tài liệu nội bộ: "Mọi lưới từ 3 cột trở lên trong vùng nội dung phải được bọc trong `@container` và sử dụng tiền tố `@` thay vì `md:`/`lg:` để đảm bảo hiển thị đúng khi sidebar mở/đóng."

## Kiểm tra sau cùng
- `npx tsc --noEmit`
- `npm run test`
