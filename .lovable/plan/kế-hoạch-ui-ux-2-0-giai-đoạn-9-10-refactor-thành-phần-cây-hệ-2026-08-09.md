# Kế hoạch UI/UX 2.0: Giai đoạn 9 & 10 (Refactor Thành phần & Cây hệ thống)

Người dùng yêu cầu tập trung vào việc refactor hai thành phần phức tạp nhất hệ thống: Bảng thành phần (56 cột) và Cây hệ thống (6.165 dòng).

## 1. Giai đoạn 9: Tối ưu Bảng thành phần hệ thống (`ThanhPhanTable.tsx`)
Bảng hiện tại có 56 cột gây quá tải thông tin. Mục tiêu là chuyển sang mô hình "Lớp dữ liệu" (Data Layering).

- **9.1. Phân nhóm cột (Column Grouping)**:
    - Nhóm 1: Định danh vai trò (Mã TP, Tên TP, Hệ thống, Nhóm hệ thống).
    - Nhóm 2: Tài sản đang lắp (Serial, Model, P/N, Nhà sản xuất).
    - Nhóm 3: Thông số kỹ thuật & Vòng đời (Năm SX, Năm KT, Hạn BH, Tỷ lệ tuổi thọ).
    - Nhóm 4: Trạng thái & Vị trí (Trạng thái TP, Vị trí lắp, Đơn vị quản lý).
- **9.2. Triển khai View Presets**:
    - `Cơ bản`: 8 cột chính (Mã, Tên, Hệ thống, Trạng thái, Tài sản, Serial, Model, Vị trí).
    - `Kỹ thuật`: Tập trung vào P/N, Năm SX, Tuổi thọ, Bảo trì.
    - `Quản lý tài sản`: Tập trung vào Bravo ID, NSX, NCC, Hạn BH.
- **9.3. UX Improvements**:
    - Tích hợp `StatusBadge` (registry GĐ 8) cho cột Trạng thái.
    - Dùng `MultiRoleBadge` highlight tài sản lắp ở nhiều vị trí.
    - Thêm "Technical Sheet" (cửa sổ bên) để xem 40+ cột còn lại thay vì dàn hàng ngang.

## 2. Giai đoạn 10: Refactor Cây hệ thống (`_app.he-thong.cay.tsx`)
File 6.165 dòng là rủi ro bảo trì cực lớn. Cần chia để trị (Split & Conquer).

- **10.1. Tách cấu trúc (Structural Splitting)**:
    - `CayContext.tsx`: Quản lý state dùng chung (search, filters, expanded nodes, overrides).
    - `CayTreeView.tsx`: Logic render cây danh sách (Virtual List).
    - `CayMindmapView.tsx`: Logic React Flow cho sơ đồ tư duy.
    - `CayTableView.tsx`: Logic xem dạng bảng thu gọn.
    - `CayNodeEditor.tsx`: Các Dialog/Sheet chỉnh sửa node (PL/LV/NH/HT).
- **10.2. Hợp nhất Tab (Tab Consolidation)**:
    - Gom 12 tab hiện tại về 4 nhóm chức năng chính:
        1. `Khai thác` (Cây + Bảng + KPI).
        2. `Sơ đồ` (Mindmap + Network).
        3. `Thiết kế` (Kéo thả, Re-org, Rename).
        4. `Dữ liệu` (Import/Export, Audit, Backup).
- **10.3. Tối ưu hiệu năng**:
    - Dùng `useMemo` và `memo` cho các Node component để tránh re-render 6k+ dòng.
    - Tối ưu bộ lọc Badge Filter (GĐ 8) để chạy mượt với dữ liệu lớn.

## 3. Rà soát an toàn (Safety Guards)
- **N10**: Đảm bảo các `Redirect` từ các tab cũ không làm hỏng URL bookmark của user.
- **N11**: Kiểm tra lại logic `MultiRoleMap` khi tách file để không bị mất màu highlight tài sản.
- **N12**: Verify grants trên các RPC mới (`rpc_thanh_phan_toan_cuc`) đảm bảo RLS vẫn hoạt động.

## 4. Lịch trình thực hiện
1. **Turn 1**: Tách `CayContext` và các types dùng chung từ `_app.he-thong.cay.tsx`.
2. **Turn 2**: Triển khai `ThanhPhanTable` presets và rút gọn số cột mặc định.
3. **Turn 3**: Tách các sub-components cho Cây hệ thống (TreeView, MindmapView).
4. **Turn 5**: Hợp nhất giao diện tab và cập nhật PageHeader.
