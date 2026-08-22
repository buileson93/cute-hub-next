# MIRATS — SSoT cho TÊN Hệ thống / Nhóm / Tài sản

Mục đích: chốt "nguồn sự thật duy nhất" (SSoT) cho **tên** của Hệ thống,
Nhóm hệ thống và Tài sản, trước khi refactor. P0 — chỉ đọc, không sửa code.

## 1. Nguồn sự thật (khẳng định)

| Thực thể             | Bảng gốc (SSoT)       | Cột tên          |
| -------------------- | --------------------- | ---------------- |
| Hệ thống             | `dm_he_thong`         | `ten`            |
| Nhóm hệ thống        | `dm_nhom_he_thong`    | `ten`            |
| Tài sản / thành phần | `thiet_bi`            | `ten_thiet_bi`   |
| Thành phần (vị trí)  | `he_thong_thanh_phan` | `ten_thanh_phan` |

Bảng `cay_node_edit` KHÔNG phải nguồn sự thật cho tên. Vai trò hợp lệ còn lại
của nó chỉ là **metadata sơ đồ** (màu nhóm, thứ tự thủ công, `manual_nh_key`,
ghi chú, các bản nháp "nh" chưa có bản ghi thật).

## 2. Ba đường ghi/đọc TÊN hiện tại

### Đường A — `saveNode` (cây/mindmap)

`src/routes/_app.he-thong.cay.tsx` (mutation `saveNode`, ~L980-1046):

1. Nếu node là **THẬT** (`ht` / `tb`) → `UPDATE` thẳng vào bảng gốc
   (`dm_he_thong.ten` hoặc `thiet_bi.ten_thiet_bi`) và **xoá**
   `du_lieu.ten_mindmap`.
2. Sau đó vẫn `upsert` vào `cay_node_edit`, nhưng với `ten: null` cho node thật
   (chỉ giữ `du_lieu` cho metadata sơ đồ + `don_vi_ma`).
3. Với node **nháp/tuỳ chỉnh** (nhóm `nh`, hệ thống nháp cũ) → `cay_node_edit.ten`
   là nơi lưu tên duy nhất.
4. Cột vật lý khác (`input.phys`) ghi thẳng vào `thiet_bi` / `dm_he_thong` qua
   `PHYS_TABLE_BY_LAYER`.

`renameDisplay` chỉ là wrapper mỏng gọi `saveNode.mutate({ kind, ma, ten })`.

### Đường B — Dialog "Danh mục › Hệ thống"

`src/routes/_app.danh-muc.he-thong.tsx` (L145–L165):

- Đọc `dm_he_thong` trực tiếp.
- `UPDATE dm_he_thong { ten, mo_ta, gp_so, active }` theo `id`.
- KHÔNG chạm `cay_node_edit`.

### Đường C — Name-override maps (chỉ đọc)

`src/lib/mirats/db-taxonomy.ts`:

- `useSystemNameOverrides` (L452) — đọc `cay_node_edit` kind=`ht`, ưu tiên
  `du_lieu.ten_mindmap` rồi `ten`; trả về `Map<sysId, tenĐãĐổi>`.
- `useDeviceNameOverrides` (L483) — tương tự cho kind=`tb`,
  key = `ma_thiet_bi`.
- `loadTaxonomy` (L216) chỉ đọc `cay_node_edit` kind=`ht` để lấy
  `manual_nh_key` (override nhóm hệ thống theo tên); KHÔNG lấy tên từ đây.

Các trang khác (Sổ lý lịch, danh sách thiết bị) tiêu thụ 2 map trên và **đè**
tên bảng gốc bằng override → nguồn gốc của "sự lệch tên".

## 3. Kiểm kê nơi `cay_node_edit.ten` được ĐỌC / GHI

### Ghi (`insert` / `upsert` / `update`)

- `src/routes/_app.he-thong.cay.tsx`:
  - `saveNode` upsert (L1015) — mọi lần edit trên cây/mindmap.
  - `renameGroupCode` (L1151, L1158) — copy nhóm nháp sang mã mới.
  - `addSystem` xóa nhóm nháp (L1207) sau khi promote.
  - `restore snapshot` (L1296), CSV backup (L1477), color/manual key
    (L1491, L1589) — chỉ metadata trong `du_lieu`, nhưng lệnh vẫn upsert
    kèm `ten` cũ.
- `src/lib/mirats/cay-reorg.ts` (L124) — invalidate queryKey.

### Đọc (`select`)

- `useOverrides` (L345) — map toàn cục cho cây + mindmap.
- `useSystemNameOverrides`, `useDeviceNameOverrides`
  (`db-taxonomy.ts` L458, L492).
- `loadTaxonomy` (L216) — chỉ dùng `manual_nh_key`.
- `renameGroupCode` (L1142), `addSystem` (fallback nhóm nháp).
- Recall trong AI data-dictionary, realtime hook, admin schema, audit — chỉ
  metadata / phân loại, không ảnh hưởng SSoT tên.

## 4. Đánh giá hệ quả

- **Node thật**: kể từ commit gần đây `saveNode` đã ghi thẳng bảng gốc và xóa
  `ten_mindmap`, nhưng `cay_node_edit` row VẪN tồn tại (ten = null) cho metadata.
  Các map override đang trả về "" cho row này → OK, không đè.
- **Rủi ro còn lại**: bất kỳ row `cay_node_edit` cũ nào còn giữ `ten` hoặc
  `du_lieu.ten_mindmap` không rỗng cho `kind ∈ {ht, tb}` sẽ **đè** tên bảng gốc
  ở Sổ lý lịch / danh sách. Đây là nguồn "cái có cái không".
- **Node nháp `nh`**: hợp lệ khi chưa có `dm_nhom_he_thong` thật; sau khi
  `addSystem` promote thì xóa. Có thể còn nhóm nháp mồ côi cần dọn.

## 5. Đề xuất chốt trước khi vào P1

1. **SSoT tên = bảng gốc**. `cay_node_edit` không được lưu `ten` cho node THẬT
   (`kind` = `ht` hoặc `tb`); chỉ dùng `du_lieu` cho metadata sơ đồ.
2. Loại bỏ `du_lieu.ten_mindmap` trong `useSystemNameOverrides` /
   `useDeviceNameOverrides`, để mọi consumer đọc thẳng `dm_he_thong.ten` /
   `thiet_bi.ten_thiet_bi`. Xóa 2 hook override sau khi migrate xong.
3. Chạy 1 migration one-shot:
   - `UPDATE dm_he_thong SET ten = coalesce(o.ten_mindmap, o.ten, dm.ten)` từ
     `cay_node_edit` trước khi bỏ.
   - Tương tự cho `thiet_bi`.
   - Rồi `UPDATE cay_node_edit SET ten = NULL, du_lieu = du_lieu - 'ten_mindmap'`
     cho `kind in ('ht','tb')`.
4. `saveNode` tiếp tục upsert `cay_node_edit` chỉ khi có metadata cần lưu (màu,
   thứ tự, ghi chú); nếu `du_lieu` rỗng và node thật → không upsert.
5. Dialog "Danh mục › Hệ thống" giữ nguyên (đã đúng SSoT).

## 6. Câu hỏi cần bạn chốt

1. Xác nhận cho phép chạy migration cập nhật `dm_he_thong.ten` / `thiet_bi.ten_thiet_bi`
   từ dữ liệu override (áp `ten_mindmap` > `ten` > giá trị hiện tại)?
2. Với node nháp `kind='nh'` (chưa promote thành `dm_nhom_he_thong`), giữ hay
   ép promote toàn bộ để loại luôn khái niệm "nhóm nháp"?
3. Nhóm hệ thống đang có `manual_nh_key` — muốn xử lý ra sao (nâng thành nhóm
   thật rồi bỏ override, hay giữ để không phá dữ liệu cũ)?

Chờ bạn duyệt P0 để chuyển sang P1 (viết migration + refactor consumer).
