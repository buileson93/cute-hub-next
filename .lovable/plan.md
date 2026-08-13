# Kế hoạch Phục hồi Thành phần Mồ côi (Orphaned Components)

Dự án MIRATS đang có 6 component quan trọng bị "bỏ rơi" sau các đợt refactor. Kế hoạch này tập trung vào việc nối lại chúng vào các vị trí chiến lược để khôi phục tính năng mà không phá vỡ kiến trúc module mới.

## Danh sách thành phần và Quyết định

| Component | Vị trí cũ | Kết cục | Vị trí mới đề xuất | Tính năng khôi phục |
| :--- | :--- | :--- | :--- | :--- |
| **1. ThanhPhanChiTietDialog** | `_app.he-thong.cay.tsx` | **B** | `ThanhPhanTable.tsx` & `TreeView.tsx` | Xem chi tiết Vai trò, Sổ lý lịch 4 tab, Tháo/Lắp/Thay thế với đầy đủ ngữ cảnh. |
| **2. GlobalSearch** | `AppShell.tsx` | **C** | — | Đã được thay thế bởi `CommandPalette.tsx` (mở qua `TopBar.tsx:35-49`). |
| **3. CommandPaletteButton** | `AppShell.tsx` | **B** | `TopBar.tsx` (cạnh chuông thông báo) | Phím tắt trực quan để mở Bảng lệnh cho người dùng mobile/tablet. |
| **4. CayThayDoiPanel** | `_app.he-thong.cay.tsx` | **B** | `_app.he-thong.cay.tsx` (nút "Lịch sử" toolbar) | Xem nhật ký thay đổi cấu trúc cây, Duyệt/Từ chối/Hoàn tác các lệnh di chuyển. |
| **5. CollapsibleSection** | `SuCoMoiForm.tsx` | **A** | `SuCoMoiForm.tsx` & `BaoTriMoiForm.tsx` | Khôi phục khả năng thu gọn/mở rộng các phần form và Ghi nhớ trạng thái đóng/mở. |
| **6. VisionImageHint** | Một số form | **B** | `SuCoMoiForm.tsx` (khối "Hiện trường") | AI phân tích ảnh sự cố để tự điền mô tả, phân loại và từ khoá. |

## Chi tiết phục hồi ThanhPhanChiTietDialog (Mục 1)

### Câu hỏi nghiệp vụ
*   **Đường khác để Lắp/Tháo:** Hiện tại có `OperationDialog` trong `ThanhPhanTable`. Tuy nhiên, nó thiếu: (1) Sổ lý lịch quá khứ, (2) Mô tả chi tiết vai trò, (3) Khả năng Hoàn tác nhanh (Undo).
*   **Sổ lý lịch 4 tab:** Hiện không xem được ở đâu tập trung cho một "Thành phần" (Role). Chỉ có sổ lý lịch chung cho "Tài sản" (Entity).
*   **Điểm mở Dialog:** Sẽ mở từ cả 3 điểm:
    1.  **Bảng thành phần:** Click vào tên thành phần.
    2.  **Cây hệ thống:** Thêm icon "Chi tiết" hoặc click vào node TP (khi được hiển thị).
    3.  **Trang chi tiết tài sản:** Link "Xem vị trí đang lắp".

### Sơ đồ điểm mở sau khi nối lại
```text
[Bảng Thành phần] --(click Tên)--> [ThanhPhanChiTietDialog]
                                       |-- Tab 1: Thông tin vai trò (Sửa tên/mô tả)
[Cây Hệ thống] ----(icon Info)---->    |-- Tab 2: Thao tác tài sản (Lắp/Tháo/Thay/Chuyển)
                                       |-- Tab 3: Sổ lý lịch (4 sub-tabs: Sự cố, Bảo trì...)
[Chi tiết Tài sản] --(link Vị trí)-->  |-- Tab 4: Cấu trúc con (nếu có)
```

## Giải pháp Kỹ thuật

### 1. Nối lại các Component
- **Mục 1:** Import vào `ThanhPhanTable.tsx` và `TreeView.tsx`. Quản lý state `selectedTp` để mở `Sheet`.
- **Mục 3:** Thêm vào `TopBar.tsx` trong cụm action bên phải.
- **Mục 4:** Thêm một `Button` trong toolbar của `HeThongCayPage` (cạnh nút "Chỉnh sửa").
- **Mục 5 & 6:** Bọc các `CardContent` hiện tại trong `SuCoMoiForm.tsx` bằng `CollapsibleSection` và chèn `VisionImageHint` vào phần khai báo thông tin ban đầu.

### 2. Kiểm thử tự động chống hồi quy
Tạo file `src/scripts/check-orphaned-components.ts` chạy trong CI/Build:
- Sử dụng `ts-morph` hoặc `grep` để quét danh sách file trong `src/components/mirats`.
- Ngoại trừ danh sách `EXEMPT_LIST` (các entry points như `AppShell`, `StandardTable`), mọi file phải có ít nhất 1 import từ file khác.
- Nếu phát hiện import = 0, báo lỗi build.

## Ràng buộc thực hiện
- Không sửa signature của các hook trong `lib/mirats/he-thong-thanh-phan.ts`.
- Sử dụng `OperationDialog` bên trong `ThanhPhanChiTietDialog` để giữ tính thống nhất của logic CRUD.
- Không copy code cũ, chỉ import component đã có.
