# Kế hoạch phục hồi 100% tính năng Cây Hệ thống & Mindmap (MIRATS 2.0)

Mục tiêu là đưa bộ module hiện tại (`CayContext`, `CayMindMap`, `NodeEditorSheet`, `mutations`, `utils`) về trạng thái đầy đủ tính năng như bản monolith "chaytot", khắc phục các lỗi về layout, dữ liệu và đồng bộ trạng thái.

## Phân tích Parity và Nguồn dữ liệu

### 1. Luồng dữ liệu và Tree Building

- **Nguồn**: `taxonomy` (dm_phan_loai, dm_nhom_he_thong, dm_he_thong, thiet_bi) + `overrides` (cay_node_edit).
- **buildTree**: Phải xử lý được:
  - `realSystems`: Các hệ thống khai báo trong danh mục nhưng chưa có tài sản (phải hiển thị node rỗng).
  - `customGroups/Systems`: Node do người dùng tạo thêm thủ công (lưu trong `cay_node_edit`).
  - `nhOrder/htOrder`: Thứ tự ưu tiên do người dùng sắp xếp (kéo thả).
  - `mau_nhom`: Màu sắc tùy chỉnh cho từng nhóm hệ thống.
  - `groupMode`: Chế độ gom nhóm theo Đơn vị quản lý hoặc theo Phân loại kỹ thuật.

### 2. Mindmap Invariants

- **Coordinates**: Đảm bảo mọi node có tọa độ hữu hạn (Finite). Khắc phục triệt để lỗi NaN gây trắng canvas.
- **Auto-expansion**: Khi mở trang hoặc tìm kiếm, cây phải tự mở rộng đến đúng level cần thiết.
- **State Persistence**: Lưu trạng thái `view` (tree/table/mindmap) và `expandedNodes` để reload không mất vị trí.

## Danh sách file và thay đổi

### 1. `src/components/mirats/he-thong-cay/utils.ts`

- Hoàn thiện `buildTree` để nhận đầy đủ tham số từ route.
- Thêm logic xử lý `realSystems` (hiển thị HT trống).
- Đồng bộ logic sắp xếp (`sort`) theo `thu_tu` từ `overrides`.

### 2. `src/components/mirats/he-thong-cay/mutations.ts`

- Thay thế các `supabase.update` trực tiếp bằng `useCayRpc` (`submit`, `hoanTac`) từ `src/lib/mirats/cay-reorg.ts`.
- Đảm bảo mọi thao tác (Move, Rename, Delete) đều đi qua cổng ghi nghiệp vụ có lưu nhật ký và hỗ trợ Undo.
- Tích hợp `xemTruocXoaThietBi` và `xoaThietBiAnToan` từ `cay-delete.ts`.

### 3. `src/components/mirats/he-thong-cay/CayMindMap.tsx`

- Cập nhật logic `useEffect` của `seededRef` để không bị khóa khi dữ liệu đang load.
- Sử dụng màu sắc (`mau_nhom`) và biểu tượng đúng từ `buildTree`.
- Đảm bảo `fitView` được gọi sau khi layout ổn định (ResizeObserver).

### 4. `src/routes/_app.he-thong.cay.tsx`

- Truyền đầy đủ các callback và dữ liệu bổ trợ (realSystems, donViList, overrides) vào `buildTree` và các component con.
- Đồng bộ hóa logic tìm kiếm (`searchQuery`) với Mindmap (focus/recenter).

### 5. `src/components/mirats/he-thong-cay/NodeEditorSheet.tsx`

- Phục hồi các trường thông tin vật lý (`physSection`), `unitCode`, `childInfo`.
- Nối nút "Xoá" vào `deleteNode` mutation mới (có preview).

## Kế hoạch thực hiện (2 bước)

### Bước 1: Phục hồi Parity (Nguyên trạng behavior "chaytot")

- Cập nhật `utils.ts` và `mutations.ts` để khôi phục logic nghiệp vụ.
- Đấu nối lại các tính năng bị thiếu: CSV Import/Export, Undo, Reorg History.
- Đảm bảo Mindmap hiển thị đủ node và không lỗi layout.

### Bước 2: Tối ưu và Refactor nhỏ

- Tinh chỉnh hiệu năng render React Flow.
- Cải thiện UX cho việc kéo thả (Reorder).
- Đảm bảo E2E test cho các luồng: Thêm -> Sửa -> Di chuyển -> Hoàn tác.

## Bảng Mapping Entity -> DB -> Mutation (Ref)

| Entity | DB Table           | Mutation (New)                          | Invalidate Query               |
| :----- | :----------------- | :-------------------------------------- | :----------------------------- |
| **pl** | `dm_phan_loai`     | `renameEntity`                          | `db_taxonomy`                  |
| **nh** | `dm_nhom_he_thong` | `renameEntity`, `setNhColor`, `reorder` | `db_taxonomy`, `cay_node_edit` |
| **ht** | `dm_he_thong`      | `renameEntity`, `moveSystem`, `reorder` | `db_taxonomy`, `cay_node_edit` |
| **tb** | `thiet_bi`         | `saveCell`, `moveDevice`, `deleteNode`  | `thiet_bi_cay`, `db_taxonomy`  |

## Kế hoạch Test

1. Mở Mindmap: Kiểm tra node hiện đủ, màu đúng, HT trống hiện diện.
2. Tìm kiếm: Gõ mã TB -> Mindmap tự mở nhánh và zoom tới.
3. Đổi tên: Admin đổi tên -> CSDL cập nhật ngay. KTV đổi tên -> Tạo đề xuất.
4. Di chuyển: Kéo HT sang Nhóm khác -> DB lưu `cay_thay_doi` -> Nút Hoàn tác xuất hiện.
