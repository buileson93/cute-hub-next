# Phục hồi Sổ lý lịch (Hệ thống & Thành phần)

Khôi phục các điểm truy cập và luồng dữ liệu cho Sổ lý lịch cấp Hệ thống và Thành phần, đảm bảo người dùng có thể xem lịch sử vận hành (bảo dưỡng, sự cố, tháo lắp) một cách liền mạch.

## Các thay đổi chính

### 1. Phục hồi đường vào Sổ lý lịch Hệ thống
- Tại `src/components/mirats/he-thong-cay/TreeView.tsx` và `CayMindMap.tsx`:
    - Cập nhật tooltip và biểu tượng để phân biệt rõ "Lý lịch tài sản" (Asset) và "Lý lịch hệ thống" (System).
    - Đảm bảo nút "Lý lịch hệ thống" dẫn đến `/he-thong/$id`.

### 2. Hoàn thiện Sổ lý lịch Thành phần (Sidebar)
- Tại `src/components/mirats/ThanhPhanChiTietDialog.tsx`:
    - Tích hợp `LyLichThanhPhanPanel` để hiển thị dòng thời gian sự kiện của riêng thành phần đó (Tháo, Lắp, Bảo dưỡng, Sự cố).
    - Thêm tab "Lịch sử gán" và "Lý lịch vận hành".
    - Thêm link "Xem sổ lý lịch toàn hệ thống" ở cuối ngăn kéo để người dùng dễ dàng chuyển đổi ngữ cảnh.

### 3. Đồng bộ hóa dữ liệu và điều hướng
- Tại `src/routes/_app.he-thong.$id.tsx`:
    - Đảm bảo các tab "Bảo dưỡng", "Sự cố", "Hỏng hóc" lọc đúng dữ liệu của hệ thống hiện tại.
    - Cập nhật nút "Quay lại" thành "Cây hệ thống" để giữ luồng người dùng.
    - Kiểm tra và phục hồi logic `LyLichHeThongPanel` (gộp từ các thành phần con) nếu bị thiếu.

## Chi tiết kỹ thuật
- Sử dụng hook `useLyLichThanhPhan` và `useLyLichHeThong` từ `he-thong-thanh-phan.ts`.
- Đảm bảo `ChangeLogPanel` được truyền đúng `entity` và `entityId` để ghi nhận nhật ký chỉnh sửa thông tin.
- Cập nhật `structural-integrity.test.ts` để kiểm tra sự tồn tại của các entry point này.
