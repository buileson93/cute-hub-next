# Kế hoạch: Tối ưu mật độ hiển thị và Căn lề Bảng Hệ thống

Người dùng phản hồi rằng ô "Chọn tất cả" vẫn chưa thẳng hàng với các ô chọn từng dòng và yêu cầu làm gọn giao diện, giảm khoảng trắng thừa, đồng thời loại bỏ các nhãn văn bản dư thừa trong bộ lọc (như "tất cả chưa gắn", "đúng 1",...). Tôi sẽ tập trung sửa triệt để việc căn lề trong `StandardTable` và làm sạch thanh công cụ của `ThanhPhanTable`.

## Các thay đổi đề xuất

### 1. `src/components/mirats/StandardTable.tsx` (Sửa căn lề)
- **Căn chỉnh cột Checkbox**: Điều chỉnh CSS trong `TableHead` và `TableCell` của cột checkbox để đảm bảo căn giữa tuyệt đối và thẳng hàng dọc giữa tiêu đề và các dòng, bất kể chế độ hiển thị (`compact`, `comfortable`, `spacious`).
- **Đồng bộ Padding Header**: Đảm bảo chiều cao của header khớp với các dòng dữ liệu để tránh lệch trục.

### 2. `src/components/mirats/ThanhPhanTable.tsx` (Tối ưu mật độ & Làm gọn)
- **Loại bỏ văn bản dư thừa**: Xóa các nhãn text không cần thiết cạnh các bộ lọc (ví dụ: các đoạn giải thích trạng thái chọn trong bộ lọc "Số lượng lắp").
- **Thu gọn Thanh công cụ**: Giảm khoảng cách (gap) và lề (padding) để dành tối đa diện tích cho bảng dữ liệu.
- **Chuẩn hóa Phân trang**: Đảm bảo các nút điều hướng trang và bộ chọn số dòng trên trang được hiển thị gọn gàng nhất.

## Chi tiết kỹ thuật
- Trong `StandardTable.tsx`, tôi sẽ sử dụng `flex items-center justify-center` và kiểm tra `vertical-align` để đảm bảo checkbox luôn nằm chính giữa ô.
- Trong `ThanhPhanTable.tsx`, tôi sẽ lược bỏ các nhãn như "Số thành phần:", "đã lắp tài sản:" và các đoạn text phụ trong bộ lọc "Bucket" để giao diện thanh thoát hơn.

## Kế hoạch kiểm tra
- Truy cập `/he-thong/thanh-phan` trong trình duyệt.
- Xác nhận nút "Select All" ở header thẳng hàng tuyệt đối với các nút ở từng dòng.
- Xác nhận thanh công cụ sạch sẽ, không còn các đoạn text giải thích rườm rà.
- Kiểm tra các chế độ hiển thị (dày/thưa) để đảm bảo căn lề vẫn chuẩn.

