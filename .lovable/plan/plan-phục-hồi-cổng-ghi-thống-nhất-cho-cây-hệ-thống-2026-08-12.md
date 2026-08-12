# Plan: Phục hồi Cổng ghi Thống nhất cho Cây Hệ thống

Phục hồi pipeline `useCellEditor` / `resolveEditIntent` để đảm bảo mọi thao tác chỉnh sửa (đổi tên, sửa cột vật lý, sửa node tùy chỉnh) được định tuyến đúng bảng, đúng cột và tuân thủ phân quyền (Admin ghi trực tiếp, User tạo Change Request).

## Sơ đồ luồng ghi

### Trước (Lỗi)
Node (PL/NH/HT/TB) -> UI (onRename) -> saveCellSecurely -> LUÔN ghi vào bảng `thiet_bi` (Sai bảng cho PL/NH/HT).

### Sau (Đúng)
Node (Any) -> `useCellEditor` -> `resolveEditIntent` -> **Intent** (renameEntity / saveCell / saveNode) -> **Cổng ghi an toàn**:
- **renameEntity**: Định tuyến theo `kind` (pl/nh/ht/tb) -> Bảng tương ứng.
- **saveCell**: Chỉ dành cho `tb` -> Bảng `thiet_bi`.
- **saveNode**: Định tuyến theo `kind` -> Node thật (ghi đè) hoặc Node tùy chỉnh (`cay_node_edit`).

## Định tuyến Entity

| Entity (Kind) | Bảng DB | Key Column | Mutation | Invalidate Query Key |
| :--- | :--- | :--- | :--- | :--- |
| **pl** (Phân loại) | `dm_phan_loai` | `id` | `renameEntity` | `["db_taxonomy"]` |
| **nh** (Nhóm HT) | `dm_nhom_he_thong` | `id` | `renameEntity` | `["db_taxonomy"]` |
| **ht** (Hệ thống) | `dm_he_thong` | `id` | `renameEntity` | `["db_taxonomy"]` |
| **tb** (Tài sản) | `thiet_bi` | `ma_thiet_bi` | `renameEntity` / `saveCell` | `["thiet_bi_cay"]` |
| **Node tùy chỉnh** | `cay_node_edit` | `kind, ma` | `saveNode` | `["cay_node_edit"]` |

## Các file sẽ sửa đổi

1.  **`src/lib/mirats/ui/save-cell-securely.ts`**:
    *   Đổi tên thành `save-entity-securely.ts` (hoặc tạo file mới).
    *   Nâng cấp logic: Nhận `kind`, `id`, `field`, `value`.
    *   Thêm `allowlist` bảng/cột để chặn ghi trái phép.
    *   Định tuyến Change Request theo `kind` (ví dụ: `he_thong.propose_field`).

2.  **`src/routes/_app.he-thong.cay.tsx`**:
    *   Tích hợp `useCellEditor` vào component chính.
    *   Cung cấp `isRealFor` helper để xác định node thật/giả.
    *   Thay thế các handler `onRename` tạm bợ bằng `editor.commit`.

3.  **`src/components/mirats/he-thong-cay/NodeEditorSheet.tsx`**:
    *   Kết nối `submit` handler thật qua `CayContext` hoặc `mutations`.
    *   Phục hồi các logic: `physSection` (cột vật lý), `unitCode`, `childInfo`.
    *   Sửa lỗi `addSystem` truyền `plId=""` (lấy từ node cha).

4.  **`src/components/mirats/he-thong-cay/mutations.ts`**:
    *   Bổ sung mutation `renameEntity`, `saveCell`, `saveNode` tuân thủ an toàn.
    *   Đảm bảo `invalidateQueries` đầy đủ sau mỗi thao tác.

## Kế hoạch triển khai

### 1. Hạ tầng ghi an toàn
*   Xây dựng `saveEntityFieldSecurely` entity-aware.
*   User role `phong_kt` / `user` -> `createChangeRequest`.
*   User role `admin` -> `supabase.from(table).update(...)`.

### 2. Khôi phục NodeEditor
*   Đồng bộ `ten` và `tenMindmap` (node tùy chỉnh).
*   Hiển thị thông tin thành phần con (`childInfo`).
*   Xử lý đổi mã nhóm (`renameGroupCode`) kèm theo migrate node tùy chỉnh liên quan.

### 3. Kiểm thử (Test Matrix)
*   **Tree/Table/Mindmap**: Đổi tên PL/NH/HT/TB xem có ghi đúng bảng không.
*   **Role Admin**: Kiểm tra ghi trực tiếp + Invalidate cache.
*   **Role KTV**: Kiểm tra tạo Change Request (vào bảng `change_request`).
*   **Rollback**: Mutation thất bại phải hiện `toast.error` và không thay đổi UI.

## Ràng buộc
*   KHÔNG dùng `supabaseAdmin`.
*   KHÔNG cho phép UI gửi tên bảng tùy ý (dùng mapping cứng trong code).
*   Giữ nguyên ngôn ngữ tiếng Việt.

---
**Migration**: Không cần migration DB vì cấu trúc bảng đã sẵn sàng, chỉ cần sửa logic định tuyến ở ứng dụng.
