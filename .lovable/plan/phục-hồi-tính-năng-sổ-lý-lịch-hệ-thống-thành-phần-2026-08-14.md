# Phục hồi tính năng Sổ lý lịch (Hệ thống & Thành phần)

Tính năng sổ lý lịch cấp Hệ thống và Thành phần hiện đang gặp lỗi "không hoạt động" hoặc mất đường vào từ giao diện. Kế hoạch này tập trung phục hồi đường dẫn truy cập và đảm bảo dữ liệu lý lịch (Sự cố, Bảo trì, Hỏng hóc, Tháo lắp) được hiển thị đầy đủ, đồng thời sửa lỗi build đang tồn tại.

## Các vấn đề phát hiện

1.  **Lỗi Build:** File `src/routes/_app.he-thong.$id.tsx` đang thiếu import `ThanhPhanChiTietDialog` và sai lệch tham số so với định nghĩa component thực tế.
2.  **Thiếu dữ liệu (Data Missing):** Trang chi tiết tài sản (`_app.thiet-bi.$maThietBi.tsx`) có các tab lý lịch nhưng dữ liệu `timeline`, `suCo`, `baoTri` đang bị bỏ trống (mảng rỗng) trong code.
3.  **Thiếu điểm vào (Entry Point):** Giao diện danh sách thành phần và cây hệ thống chưa có nút hoặc hành động rõ ràng để mở Sổ lý lịch thành phần/hệ thống một cách nhất quán.

## Kế hoạch thực hiện

### 1. Sửa lỗi Build và Phục hồi Sổ lý lịch Hệ thống

- **File:** `src/routes/_app.he-thong.$id.tsx`
- **Hành động:**
  - Bổ sung import `ThanhPhanChiTietDialog`.
  - Điều chỉnh logic gọi `ThanhPhanChiTietDialog`: component này yêu cầu prop `viTri` (kiểu `ViTriChucNangTree`) thay vì `thanhPhanId`.
  - Tích hợp dữ liệu từ `useViTriChucNang` để cung cấp prop `viTri` chính xác khi mở dialog lịch sử thành phần.

### 2. Phục hồi Sổ lý lịch Tài sản (Asset Level)

- **File:** `src/routes/_app.thiet-bi.$maThietBi.tsx`
- **Hành động:**
  - Sử dụng hook `useLyLichThietBi` để lấy dữ liệu timeline thực tế.
  - Tích hợp `useOperationsData` để lọc và cung cấp danh sách `suCo`, `baoTri`, `hongHoc`, `banGiao` cho các tab tương ứng.

### 3. Đồng bộ hóa logic hiển thị Thành phần

- **File:** `src/components/mirats/ThanhPhanChiTietDialog.tsx`
- **Hành động:**
  - Đảm bảo phần `SoLyLichThanhPhanSection` hiển thị chính xác các tab con (Tất cả, Tháo-lắp, Sự cố, BD/HH).
  - Kiểm tra việc gọi `LyLichHeThongPanel` trong Dialog để xem lịch sử gộp của toàn hệ thống.

### 4. Bổ sung Entry Point trong danh sách

- **File:** `src/components/mirats/ThanhPhanTable.tsx`
- **Hành động:** Đảm bảo icon `History` (Lý lịch) trong bảng dẫn tới việc mở `ThanhPhanChiTietDialog` với đúng dữ liệu vị trí.

## Kiểm thử

1.  Mở chi tiết một tài sản, kiểm tra tab "Lý lịch" có hiện dòng thời gian không.
2.  Mở chi tiết một hệ thống, chọn một thành phần trong danh sách, kiểm tra Drawer có hiện "Sổ lý lịch thành phần" không.
3.  Bấm vào nút "History" ở header card của chi tiết hệ thống để xem nhật ký toàn hệ thống.
