# Phục hồi hiển thị nội dung cho Tab Sơ đồ

Người dùng báo cáo rằng nút "Sơ đồ" (tại `/he-thong/cay`) đang bị "trống trơn" dù đường dẫn vẫn đúng. Qua kiểm tra code, Tab này đang render `CayMindMap`.

## Phân tích nguyên nhân
1. **Dữ liệu rỗng**: `CayMindMap` phụ thuộc vào `tree` props. Nếu `viewTree` trong parent không được tính toán đúng hoặc bị filter mất hết node, sơ đồ sẽ trắng.
2. **Lỗi Render React Flow**: React Flow yêu cầu container có kích thước (width/height) cụ thể. Nếu `PageBody` hoặc container cha bị `h-0`, sơ đồ sẽ không hiển thị.
3. **Z-index/Visibility**: Có thể Tab content bị ẩn bởi CSS hoặc các lớp phủ `DataState`.

## Kế hoạch thực hiện

### 1. Kiểm tra và sửa lỗi Layout Height
Đảm bảo container của `CayMindMap` luôn có chiều cao tối thiểu và chiếm trọn không gian.
- File: `src/routes/_app.he-thong.cay.tsx`
- Thay đổi: Đảm bảo `PageBody` có `flex-1` và `min-h-0`.

### 2. Bổ sung log chẩn đoán trong MindMap
Thêm log để biết `CayMindMap` có nhận được dữ liệu `tree` hay không.
- File: `src/components/mirats/he-thong-cay/CayMindMap.tsx`

### 3. Sửa lỗi "trống trơn" (Blank page)
Nếu `viewTree` trống, `DataState` sẽ hiển thị thông báo "Không tìm thấy kết quả". Nếu người dùng thấy "trống trơn" (không có cả thông báo), có thể do `DataState` đang ở trạng thái `loading` vô hạn hoặc lỗi runtime trong component `CayMindMap`.

### 4. Kiểm tra sự kiện click Tab
Đảm bảo khi bấm vào nút "Sơ đồ", URL search param `view=mindmap` được cập nhật và state `display` thay đổi tương ứng.

## Danh sách file sửa đổi
- `src/routes/_app.he-thong.cay.tsx`
- `src/components/mirats/he-thong-cay/CayMindMap.tsx`
