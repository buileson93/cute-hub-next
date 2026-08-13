# Phục hồi Bố cục Dashboard và Di chuyển Nhật ký vận hành

Người dùng phản hồi rằng phần "Nhật ký vận hành" (Live Timeline) hiện đang chiếm quá nhiều diện tích màn hình (chiếm 1/4 chiều rộng và toàn bộ chiều cao bên phải). Kế hoạch này sẽ di chuyển phần này xuống phía dưới để ưu tiên không gian cho các biểu đồ KPI chính.

## Thay đổi cấu trúc

### 1. src/routes/_app.index.tsx
- Loại bỏ chia cột `lg:grid-cols-4`. Chuyển toàn bộ nội dung chính sang `w-full`.
- Di chuyển `LiveTimeline` từ cột phụ vào một hàng mới ở dưới cùng của dashboard.
- Sắp xếp lại các thẻ ở tầng dưới cùng (Chất lượng hồ sơ, Trạng thái vận hành, Nhật ký vận hành) thành một lưới 3 cột trên màn hình lớn.

### 2. src/components/mirats/dashboard/LiveTimeline.tsx
- Cập nhật chiều cao của `ScrollArea` hoặc container để nó không cố gắng chiếm "h-full" khi nằm trong một hàng có chiều cao cố định. Thiết lập chiều cao mặc định khoảng `350px-400px` để phù hợp với các thẻ bên cạnh.

## Chi tiết kỹ thuật
- Chuyển `lg:col-span-3` thành `w-full` (hoặc loại bỏ lớp col-span).
- Gom nhóm `Quality Card`, `Ops Status Card` và `LiveTimeline Card` vào một `<div className="grid grid-cols-1 md:grid-cols-3 gap-6">`.
- Đồng bộ hóa thiết kế này với trang `/tong-quan` nếu cần thiết (người dùng cũng phàn nàn về LiveTimeline ở đó).

## Tác động giao diện
- Dashboard chính sẽ rộng rãi hơn, các biểu đồ VisualKpiChart sẽ có nhiều không gian để hiển thị chi tiết.
- Nhật ký vận hành vẫn có thể truy cập được nhưng không còn gây xao nhãng hoặc chiếm dụng không gian quan trọng ở phía trên.
