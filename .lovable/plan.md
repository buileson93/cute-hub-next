# Plan: Task T13 - Implement hideBelow for 5 Target Tables (Debt Collection)

Optimize UI responsiveness for 5 critical tables by implementing the `hideBelow` attribute on `StandardTable` columns, ensuring a mobile-first experience.

## Target Tables & Files
1. **Sổ lý lịch**: `src/routes/_app.thiet-bi.index.tsx` (Nested Table in TreeView/Search)
2. **Giấy phép**: `src/components/mirats/tuan-thu/AssetRegistryBook.tsx` (Imported in `_app.giay-phep.tsx`)
3. **Vật tư (Tồn kho)**: `src/components/mirats/vat-tu/SparePartsTable.tsx` (Imported in `_app.vat-tu.tsx`)
4. **Vật tư (Giao dịch)**: `src/components/mirats/vat-tu/StockMovementLog.tsx` (Imported in `_app.vat-tu.tsx`)
5. **Bảo trì**: `src/routes/_app.bao-tri.index.tsx`
6. **Sự cố**: `src/routes/_app.su-co.index.tsx`

*(Note: The user asked for 5 tables but listed 5 routes, some of which use internal components for the tables. I will apply it to the `StandardTable` instances within these files.)*

## Column Visibility Convention (BP_PX)
- **Always Visible**: Name (Tên), ID/Code (Mã).
- **sm (640px)**: Status (Trạng thái).
- **md (768px)**: Location (Vị trí), Department/Unit (Đơn vị).
- **lg (1024px)**: Model, Serial number.
- **xl (1280px)**: Dates (Ngày tháng), Supplier (Nhà cung cấp).
- **2xl (1536px)**: Derived columns, Photos.

## Implementation Steps

### 1. Sổ lý lịch (`_app.thiet-bi.index.tsx`)
- Locate the search results table or the list view.
- Apply `hideBelow` to columns like Serial (lg), Model (lg), Unit (md), Status (sm).

### 2. Giấy phép (`AssetRegistryBook.tsx`)
- Apply `hideBelow` to:
    - `soGP` (lg)
    - `ngayHetHan` (xl)
    - `donViReal` (md)
    - `trangThai` (sm)

### 3. Vật tư (`SparePartsTable.tsx` & `StockMovementLog.tsx`)
- **SpareParts**: `ma_vat_tu` (lg), `ten_kho` (md), `loai` (sm).
- **StockMovement**: `ngay` (xl), `loai` (sm), `kho` (md).

### 4. Bảo trì (`_app.bao-tri.index.tsx`)
- `ngay_bat_dau` (xl)
- `thiet_bi` (always)
- `he_thong` (md)
- `loai_bao_tri` (lg)
- `don_vi_thuc_hien` (md)
- `trang_thai` (sm)

### 5. Sự cố (`_app.su-co.index.tsx`)
- `ngay_phat_hien` (xl)
- `thiet_bi` (always)
- `hien_tuong` (md)
- `muc_do` (lg)
- `trang_thai` (sm)

## Verification
- Run `npx tsc --noEmit`.
- Run `npm test`.
- Verify mobile view (375px) shows max 4 columns.
- Verify desktop view (1280px) remains unchanged.
- Verify Excel export remains complete.
