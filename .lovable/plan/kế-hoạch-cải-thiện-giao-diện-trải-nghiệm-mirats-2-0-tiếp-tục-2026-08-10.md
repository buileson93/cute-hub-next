# Kế hoạch Cải thiện Giao diện & Trải nghiệm (MIRATS 2.0) — Tiếp tục Giai đoạn 12

Người dùng đã xác nhận hoàn thành **Giai đoạn 11 (Tái cấu trúc Quản lý Phân quyền)**. Hiện tại hệ thống đã có các component mô-đun hóa cho Phân quyền (`RoleOverview`, `PermissionMatrix`, `DistributionStats`, `AuditLogViewer`, `SecurityPolicies`).

Bước tiếp theo là tiến hành **Giai đoạn 12: Quản lý Vật tư & Vòng đời thiết bị**.

## Trạng thái hiện tại
- **Giai đoạn 8, 9, 10, 11**: Đã hoàn thành (Nền tảng thị giác, Thành phần hệ thống, Cây hệ thống, Phân quyền).
- **Vấn đề mục tiêu**: Vùng "Vật tư" và "Vòng đời & Tuân thủ" hiện đang có quá nhiều cột (21-24 cột) và tab (7-16 tab), gây ngợp cho người dùng (điểm 4/10).

## Mục tiêu Giai đoạn 12: Vật tư & Vòng đời (8-11 ngày)
Tái cấu trúc các trang liên quan đến kho, vật tư dự phòng và các hồ sơ tuân thủ (kiểm định, bảo hiểm, giấy phép).

### 1. Mô-đun hóa vùng Vật tư (`_app.vat-tu.tsx`)
- Tách file monolith thành các component chuyên biệt:
    - `InventoryDashboard.tsx`: Tổng quan kho, cảnh báo dưới định mức.
    - `SparePartsTable.tsx`: Danh sách vật tư dùng `StandardTable`, rút gọn từ 24 cột xuống 8 cột chính.
    - `CompatibilityManager.tsx`: Quản lý khả năng thay thế cho nhiều hệ thống (theo yêu cầu trước đó).
    - `StockMovementLog.tsx`: Nhật ký nhập/xuất kho.

### 2. Tối ưu vùng Vòng đời & Tuân thủ (`_app.tuan-thu.tsx`)
- Hợp nhất các trang rời rạc về một dashboard tuân thủ duy nhất:
    - `ComplianceTimeline.tsx`: Trực quan hóa lộ trình kiểm định/hết hạn giấy phép.
    - `AssetRegistryBook.tsx`: Giao diện "Sổ lý lịch" cho các loại giấy phép/kiểm định.
    - `InspectionScheduler.tsx`: Lập kế hoạch kiểm định định kỳ.

### 3. Cải thiện UX Form nhập liệu
- Áp dụng `ViewPresets` cho bảng vật tư.
- Tích hợp OCR/AI hỗ trợ nhập liệu giấy phép từ PDF (nâng cấp logic đã có).

## Các bước thực hiện
1. **Khảo sát cấu trúc file hiện tại**: Kiểm tra `src/routes/_app.vat-tu.tsx` và các route liên quan đến tuân thủ.
2. **Tạo folder cấu trúc**: `src/components/mirats/vat-tu/` và `src/components/mirats/tuan-thu/`.
3. **Refactor code**: Di chuyển logic xử lý dữ liệu và UI thô vào các component mới.
4. **Cập nhật Route**: Thay thế bằng các Tabs/Layout sạch sẽ hơn.

Bạn có đồng ý bắt đầu **Giai đoạn 12** ngay bây giờ không?
