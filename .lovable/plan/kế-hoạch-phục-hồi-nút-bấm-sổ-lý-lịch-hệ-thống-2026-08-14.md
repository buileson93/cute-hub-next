# Kế hoạch phục hồi nút bấm Sổ lý lịch hệ thống

Người dùng phản hồi không tìm thấy hoặc không bấm được nút để vào xem "Sổ lý lịch hệ thống" từ giao diện cây hệ thống.

## Hiện trạng

1. **TreeView.tsx:** Nút "Lịch sử" (icon `History`) đã có nhưng có thể chưa được nối đúng với hàm `onHistory` hoặc `onHistory` trong `_app.he-thong.cay.tsx` chưa điều hướng chính xác.
2. **CayMindMap.tsx:** Nút "Sổ lý lịch" (`onRecord`) trong `MindNode` đang trỏ đến trang tài sản cụ thể (`/thiet-bi/$maThietBi`), nhưng chưa có nút chuyên biệt cho "Lý lịch hệ thống" (`/he-thong/$id`).
3. **\_app.he-thong.$id.tsx:** Trang chi tiết hệ thống đã tích hợp `LyLichHeThongPanel` nhưng người dùng khó tiếp cận từ các sơ đồ.

## Mục tiêu

1. Đảm bảo mọi node "Hệ thống" (HT) trên cả Cây (Tree) và Sơ đồ (Mindmap) đều có nút bấm rõ ràng để mở Sổ lý lịch hệ thống (`/he-thong/$id`).
2. Đồng bộ hóa hành vi: Bấm vào icon "Lịch sử" (History) -> Mở trang chi tiết hệ thống.
3. Kiểm tra tính sẵn sàng của dữ liệu trong `LyLichHeThongPanel` để tránh hiển thị "Chưa sẵn sàng".

## Các bước thực hiện

### 1. Phục hồi entry point trong TreeView

- Kiểm tra `TreeView.tsx` (của hệ thống cây): Đảm bảo khi bấm vào icon `History` của node `ht`, nó gọi `onHistory(ht.ma)`.
- Trong `_app.he-thong.cay.tsx`, hàm `onHistory` phải parse được `sysId` từ `htMa` và điều hướng đến `/he-thong/$id`.

### 2. Bổ sung nút bấm trong CayMindMap

- Cập nhật `MindNode` trong `CayMindMap.tsx` để hiển thị thêm icon `History` (Lịch sử hệ thống) bên cạnh icon `History` hiện tại (đang dùng cho tài sản).
- Phân biệt rõ:
  - Icon `History` (trên node HT): Mở `/he-thong/$id`.
  - Icon `History` (trên node TB): Mở `/thiet-bi/$maThietBi`.

### 3. Kiểm tra logic điều hướng

- Đảm bảo hàm `parseHtSysMa(ma).sysName` trả về đúng UUID của hệ thống để `navigate` không bị lỗi 404 hoặc ID không hợp lệ.

### 4. Xác minh giao diện đích

- Kiểm tra `src/routes/_app.he-thong.$id.tsx` để chắc chắn tab "Dòng thời gian" hoặc Panel lý lịch được hiển thị ngay lập tức khi người dùng chuyển đến.

## Chi tiết kỹ thuật

- **File ảnh hưởng:**
  - `src/components/mirats/he-thong-cay/TreeView.tsx`
  - `src/components/mirats/he-thong-cay/CayMindMap.tsx`
  - `src/routes/_app.he-thong.cay.tsx`
- **Component:** `LyLichHeThongPanel`, `LyLichThanhPhanPanel`.
