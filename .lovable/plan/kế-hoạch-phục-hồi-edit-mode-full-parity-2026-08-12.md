---
name: Full Parity Edit Mode Restoration
description: Restore Edit Mode UI, business logic, and mutation pipelines across all key routes with 100% parity to the "chaytot" version.
type: feature
---

# Kế hoạch phục hồi Edit Mode (Full Parity)

## A. Ma trận hiện trạng

| Giao diện            | Edit mode cũ    | Edit mode mới   | UI còn?    | Mutation? | Quyền?   | Hành động                                                       |
| :------------------- | :-------------- | :-------------- | :--------- | :-------- | :------- | :-------------------------------------------------------------- |
| **Cây hệ thống**     | `useUserPref`   | `useCayContext` | Có         | Một phần  | Có       | Nối `useCellEditor`, khôi phục `EditableCell`, sửa handler rỗng |
| **Chi tiết tài sản** | Local state     | `useUserPref`   | Nút Switch | Mất       | Một phần | Khôi phục logic `canManage`, nối mutation cho 5 tab             |
| **Bảng thành phần**  | Props           | Local + Props   | Có         | Có        | Có       | Đồng bộ `externalEditMode`                                      |
| **StandardTable**    | Prop `editMode` | Mất             | Không      | N/A       | N/A      | Phục hồi API `editMode`, `reorder`, `GripVertical`              |
| **Danh mục**         | `useUserPref`   | `useUserPref`   | Có         | Có        | Có       | Regression test                                                 |

## B. State Ownership & Contract

1.  **Contract chung**:
    - `canEdit`: Kiểm tra role (Admin/Phòng KT).
    - `editMode`: Trạng thái bật/tắt của user (có lưu `useUserPref`).
    - `canManage = canEdit && editMode`.
2.  **State Mapping**:
    - `/_app/he-thong/cay`: State nằm trong `CayContext`.
    - `/_app/thiet-bi/$ma`: State nằm trong route, lưu qua `thiet-bi-detail:edit-mode`.
    - `StandardTable`: Nhận `editMode` từ prop hoặc tự quản lý `internalEdit` cho reorder.

## C. Mutation Pipeline

- Sử dụng `useCellEditor` + `resolveEditIntent` làm cổng ghi duy nhất.
- Mapping `kind` -> Bảng:
  - `pl` -> `dm_phan_loai`
  - `nh` -> `dm_nhom_he_thong`
  - `ht` -> `dm_he_thong`
  - `tb` -> `thiet_bi`
- Logic: Admin ghi trực tiếp; User thường tạo `Change Request` qua `createChangeRequest`.

## D. Danh sách file cần sửa

### 1. `src/components/mirats/StandardTable.tsx`

- Thêm prop `editMode?: boolean`, `hideReorderToggle?: boolean`.
- Khôi phục logic `reorder = editMode || internalEdit`.
- Render `GripVertical` và bật tính năng kéo thả hàng/cột khi `reorder` bật.

### 2. `src/routes/_app.he-thong.cay.tsx`

- Khôi phục `useCellEditor` trong route.
- Định nghĩa `EditableCell` (inline) hoặc import nếu tách file.
- Nối `onRename`, `onSave` vào `useCellEditor` API thay vì `() => {}`.
- Khôi phục logic `move/delete/undo` thực thụ qua `useCayMutations`.

### 3. `src/routes/_app.thiet-bi.$maThietBi.tsx`

- Nối `useSession` để lấy roles.
- Đảm bảo `canManage` được truyền xuống tất cả các tab.
- Khôi phục các action lifecycle (ngừng khai thác, thanh lý) trong `PageHeader`.

### 4. `src/components/mirats/he-thong-cay/NodeEditorSheet.tsx`

- Thay `() => {}` bằng các mutation thực từ `useCayMutations`.
- Đảm bảo `unitCode`, `physicalSection` nhận dữ liệu thật.

### 5. `src/components/mirats/he-thong-cay/mutations.ts`

- Sửa logic `renameEntity` để mapping đúng bảng (dm_phan_loai, dm_nhom_he_thong, v.v.).

## E. Kế hoạch Commit độc lập

1.  **Commit 1**: Phục hồi API và UI Edit cho `StandardTable`.
2.  **Commit 2**: Hoàn thiện pipeline `saveEntityFieldSecurely` và `useCellEditor` logic.
3.  **Commit 3**: Khôi phục 100% Edit Mode cho route `Cây hệ thống`.
4.  **Commit 4**: Khôi phục 100% Edit Mode cho route `Chi tiết tài sản`.
5.  **Commit 5**: Regression test và dọn dẹp handler giả.

## F. Test Matrix

- **Admin**: Có nút Edit, bật lên sửa được mọi field, ghi trực tiếp DB.
- **KTV**: Có nút Edit, bật lên sửa được field được phép, tạo Change Request.
- **User chỉ đọc**: Không thấy nút Edit, mọi field đều read-only.
