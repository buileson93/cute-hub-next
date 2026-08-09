# Kế hoạch Cập nhật Thuật ngữ "Máy tính" thay cho "Laptop"

Thay đổi thuật ngữ "Laptop" thành "Máy tính" (hoặc "Máy tính & Laptop") trong toàn bộ hệ thống để bao quát cả PC và Laptop, tránh gây hiểu nhầm cho người dùng.

## 1. Cập nhật Navigation & Route
- [ ] **src/lib/mirats/nav-contract.ts**:
    - Thay đổi `label: "Thống kê Laptop"` thành `label: "Thống kê Máy tính"`.
    - Thay đổi `title: "Thống kê Laptop & Bản quyền"` thành `title: "Thống kê Máy tính & Bản quyền"`.
- [ ] **src/routes/_app.thong-ke.laptop.tsx**:
    - Cập nhật tiêu đề trong `head()` và `PageHeader`.
    - Cập nhật các nhãn KPI: "Laptop/PC đang được nhân viên phụ trách", "Tổng máy tính đã gán".
    - Cập nhật các đoạn văn bản hướng dẫn và Tooltip.
    - Đổi tên biến/type nếu cần thiết (ví dụ `LaptopStatsRow` -> `MayTinhStatsRow`) để code tường minh hơn.

## 2. Cập nhật Components
- [ ] **src/components/mirats/AssetImportDialog.tsx**:
    - Thay đổi "Nhập tài sản máy tính hàng loạt" (đã là máy tính nhưng rà soát lại các text liên quan).
    - Cập nhật mô tả: "thêm nhanh máy tính/laptop".
- [ ] **src/components/mirats/BanQuyenCapPhatDialog.tsx**:
    - Thay đổi các nhãn "Tài sản (Máy tính/Máy chủ)" (rà soát tính nhất quán).
- [ ] **src/components/mirats/BanQuyenFormDialog.tsx**:
    - Cập nhật mô tả và tooltip liên quan đến việc cấp phát cho máy tính.
- [ ] **src/components/mirats/NhanVienSoftwareSheet.tsx**:
    - Thay đổi "Nhân viên này chưa được gán tài sản máy tính nào".
- [ ] **src/components/mirats/ThietBiBanQuyen.tsx**:
    - Rà soát các text hiển thị.

## 3. Rà soát khác
- [ ] **src/routes/_app.phan-mem-ban-quyen.tsx**: Cập nhật đoạn text hướng dẫn ("Hiện nay đã có tính năng để phần mềm bản quyền cấp pháp cho máy tính laptop nào...").
- [ ] **src/routes/_app.admin.kiem-tra-layout.tsx**: Cập nhật nhãn trong PRESETS (Laptop -> Máy tính/Laptop).

## Ghi chú
- Giữ nguyên đường dẫn route `/thong-ke/laptop` để tránh phá vỡ các liên kết hiện có, chỉ thay đổi nhãn hiển thị UI.
