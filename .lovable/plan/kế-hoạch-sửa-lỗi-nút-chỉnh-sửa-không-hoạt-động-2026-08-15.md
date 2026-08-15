# Kế hoạch sửa lỗi nút "Chỉnh sửa" không hoạt động

Người dùng báo cáo rằng nút "Chỉnh sửa" (Edit) không hoạt động, không chuyển sang chế độ edit mode. Qua rà soát, nguyên nhân có thể do việc xử lý trạng thái `editMode` không nhất quán giữa các tab (Bảng, Cây, Sơ đồ) hoặc do thiếu quyền hạn (`canManage`).

## Các bước thực hiện

1.  **Kiểm tra và sửa lỗi tại tab Bảng (`/he-thong/thanh-phan`):**
    *   Xác minh `useUserPref` có hoạt động đúng trong `ThanhPhanListPage`.
    *   Đảm bảo `ThanhPhanTable` nhận `externalEditMode` và sử dụng nó để điều khiển `StandardTable`.
    *   Trong `ThanhPhanTable.tsx`, sửa lỗi logic gán `setEditMode = setInternalEditMode` (dòng 299) vì nó không thể cập nhật trạng thái `externalEditMode` của parent.

2.  **Kiểm tra và sửa lỗi tại tab Cây & Sơ đồ (`/he-thong/cay`):**
    *   Đảm bảo `useCayContext` đồng bộ hóa `editMode` chính xác.
    *   Kiểm tra `canManage` (quyền `he-thong:manage`) để đảm bảo người dùng có đủ quyền hiển thị và tương tác với nút sửa.

3.  **Tối ưu hóa UI/UX cho nút Chỉnh sửa:**
    *   Thêm log chẩn đoán khi bấm nút để xác định lỗi nếu trạng thái không đổi.
    *   Đảm bảo icon và nhãn ("Chỉnh sửa" vs "Đang sửa") phản ánh đúng trạng thái hiện tại.

## Chi tiết kỹ thuật

### Sửa đổi `src/components/mirats/ThanhPhanTable.tsx`
*   Loại bỏ `internalEditMode` nếu `externalEditMode` được cung cấp.
*   Đảm bảo `editMode` được truyền xuống `StandardTable`.

### Sửa đổi `src/routes/_app.he-thong.thanh-phan.tsx`
*   Kiểm tra quyền `canManage` bằng `useCan("he-thong", "manage")`.

### Sửa đổi `src/routes/_app.he-thong.cay.tsx`
*   Đồng bộ `editMode` từ context và đảm bảo nút `Button` gọi đúng `setEditMode`.
