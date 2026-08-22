# Phục hồi Tab Sơ đồ & Sửa lỗi Sơ đồ trắng trơn

Tôi sẽ thực hiện phục hồi tab "Sơ đồ tổng thể" và khắc phục tình trạng sơ đồ hiển thị trắng trơn bằng cách tối ưu hóa các thành phần điều khiển trạng thái và hiển thị.

## Các thay đổi chính

### 1. Frontend & UI

- **Tối ưu hóa `CayMindMap.tsx`**:
  - Sửa lỗi chiều cao sơ đồ (Height) bằng cách sử dụng `h-[calc(100vh-200px)]` thay vì `min-h-[500px]` hoặc `h-full` không xác định rõ ràng.
  - Cải thiện logic `fitView` để đảm bảo sơ đồ luôn nằm trong khung nhìn ngay sau khi render.
  - Bổ sung `loading` state cho sơ đồ để tránh hiển thị "trắng trơn" khi đang xử lý hàng nghìn node.
- **Tăng cường `CayContext.tsx`**:
  - Lưu trạng thái `display` vào `localStorage` để ghi nhớ tab người dùng đã chọn (Mindmap/Cây).
  - Đồng bộ hóa chặt chẽ hơn giữa search query và việc tự động mở rộng các node liên quan trong sơ đồ.
- **Chỉnh sửa `src/routes/_app.he-thong.cay.tsx`**:
  - Đảm bảo `display === "mindmap"` nhận đúng diện tích hiển thị từ `PageBody`.
  - Thêm chỉ báo "Đang vẽ sơ đồ..." khi React Flow đang tính toán layout.

### 2. Dữ liệu & Logic

- Kiểm tra lại logic `buildNodes` trong `CayMindMap.tsx` để đảm bảo không có giá trị `NaN` hoặc `undefined` trong tọa độ `x, y` của node khi cây dữ liệu lớn.
- Khắc phục lỗi "expanded đóng băng" bằng cách xử lý `Set` trong context một cách immutable đúng tiêu chuẩn React.

## Kỹ thuật chi tiết

- Sử dụng `useLayoutEffect` để đo đạc container sơ đồ chính xác nhất.
- Ép kiểu dữ liệu tọa độ node về số nguyên để tránh các lỗi render của browser.
- Thêm `background` và `grid` cho React Flow để người dùng dễ nhận diện không gian sơ đồ.
