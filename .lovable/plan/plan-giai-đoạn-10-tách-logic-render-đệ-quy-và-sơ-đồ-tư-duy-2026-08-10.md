# Plan: Giai đoạn 10 — Tách logic render đệ quy và sơ đồ tư duy

Kế hoạch này tập trung vào việc tách nhỏ file monolith `src/routes/_app.he-thong.cay.tsx` (~6000 dòng) bằng cách di chuyển logic render đệ quy (TreeView) và sơ đồ tư duy (CayMindMap) sang các component riêng biệt đã được tạo khung.

## 1. Mục tiêu
- Giảm kích thước file `cay.tsx`.
- Tách biệt logic xử lý dữ liệu (Cây) và logic hiển thị (View).
- Cải thiện khả năng bảo trì và hiệu năng render.

## 2. Các bước thực hiện

### Bước 1: Hoàn thiện `utils.ts`
Di chuyển các hàm tiện ích dùng chung từ `cay.tsx` sang `src/components/mirats/he-thong-cay/utils.ts`:
- Logic dựng cây `buildTree`.
- Các hàm so sánh, lọc và xử lý dữ liệu (`cmpDeviceByLoai`, `filterTreeByBadge`, `deviceMatchesBadge`).
- Các hàm định dạng hiển thị (`statusTone`, `importanceTone`, `deviceChips`).
- Logic layout cho sơ đồ tư duy (tidy tree algorithm).

### Bước 2: Hoàn thiện `TreeView.tsx`
Di chuyển logic render đệ quy của chế độ xem danh sách từ `cay.tsx` sang `src/components/mirats/he-thong-cay/TreeView.tsx`:
- Render các cấp Phân loại, Nhóm hệ thống, Hệ thống, Tài sản.
- Tích hợp các tương tác kéo thả và menu ngữ cảnh.

### Bước 3: Hoàn thiện `CayMindMap.tsx`
Di chuyển logic render sơ đồ tư duy từ `cay.tsx` sang `src/components/mirats/he-thong-cay/CayMindMap.tsx`:
- Sử dụng `@xyflow/react`.
- Tích hợp thuật toán layout đệ quy đã tách ra `utils.ts`.
- Xử lý các node tùy chỉnh (`MindNode`) và các kết nối (`edges`).

### Bước 4: Hoàn thiện `NodeEditorSheet.tsx`
Di chuyển logic biên tập chi tiết từ `cay.tsx` (sidebar) sang `src/components/mirats/he-thong-cay/NodeEditorSheet.tsx`:
- Quản lý `ThanhPhanManager` bên trong hệ thống.
- Chỉnh sửa các trường dữ liệu động.
- Logic xóa và lưu thay đổi.

### Bước 5: Refactor `cay.tsx`
Cập nhật file route chính để sử dụng các component mới:
- Thay thế các đoạn code render cũ bằng `TreeView`, `CayMindMap`, `NodeEditorSheet`.
- Sử dụng `CayProvider` để quản lý trạng thái dùng chung qua Context thay vì prop drilling.

## 3. Kiểm tra (Verification)
- [ ] Chạy `bunx tsc` để đảm bảo không có lỗi type.
- [ ] Kiểm tra giao diện Cây hệ thống ở cả 3 chế độ: Cây, Bảng, Sơ đồ.
- [ ] Test các tính năng: Tìm kiếm, Lọc badge, Mở rộng/Thu nhỏ, Kéo thả di chuyển.
- [ ] Đảm bảo logic "Dừng khai thác" vẫn hiển thị song song chính xác.

Sau khi hoàn thành Giai đoạn 10, tôi sẽ đề xuất thực hiện **Giai đoạn 11: Nâng cấp Điều hướng & Command Palette** hoặc tối ưu tiếp **Giai đoạn 1: Bảng thành phần hệ thống**.
