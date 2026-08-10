# Plan: Task T13 - Implement hideBelow for 5 Target Tables (Debt Collection)

Optimize UI responsiveness for 5 critical tables by implementing the `hideBelow` attribute on `StandardTable` columns, ensuring a mobile-first experience.

## Target Tables & Files
1. **Bảo trì**: `src/routes/_app.bao-tri.index.tsx`
2. **Sự cố**: `src/routes/_app.su-co.index.tsx`
3. **Giấy phép**: `src/components/mirats/tuan-thu/AssetRegistryBook.tsx` (Imported in `_app.giay-phep.tsx`)
4. **Vật tư (Tồn kho)**: `src/components/mirats/vat-tu/SparePartsTable.tsx` (Imported in `_app.vat-tu.tsx`)
5. **Vật tư (Giao dịch)**: `src/components/mirats/vat-tu/StockMovementLog.tsx` (Imported in `_app.vat-tu.tsx`)
6. **Vật tư (Cảnh báo & Danh mục)**: `src/routes/_app.vat-tu.tsx`

*(Note: The user asked for 5 tables but listed 5 routes. I will apply it to all `StandardTable` instances within these files.)*

## Column Visibility Convention (BP_PX)
- **Always Visible**: Name (Tên), ID/Code (Mã).
- **sm (640px)**: Status (Trạng thái).
- **md (768px)**: Location (Vị trí), Department/Unit (Đơn vị), Hiện tượng.
- **lg (1024px)**: Model, Serial number, Loại.
- **xl (1280px)**: Dates (Ngày tháng), P/N, Chủng loại.
- **2xl (1536px)**: Derived columns, Photos, Supplier.

## Implementation Steps

### 1. Bảo trì (`src/routes/_app.bao-tri.index.tsx`)
- `ma_bao_tri`: Always
- `ngay_bat_dau`: `xl`
- `thiet_bi`: Always
- `he_thong`: `md`
- `loai_bao_tri`: `lg`
- `don_vi_thuc_hien`: `md`
- `trang_thai`: `sm`

### 2. Sự cố (`src/routes/_app.su-co.index.tsx`)
- `ma_su_co`: Always
- `ngay_phat_hien`: `xl`
- `thiet_bi`: Always
- `hien_tuong`: `md`
- `muc_do`: `lg`
- `trang_thai`: `sm`

### 3. Giấy phép (`src/components/mirats/tuan-thu/AssetRegistryBook.tsx`)
- `so_gp`: Always
- `doi_tuong`: Always
- `loai`: `lg`
- `han_dung`: `xl`
- `trang_thai`: `sm`

### 4. Vật tư (SparePartsTable.tsx)
- `vat_tu`: Always
- `loai`: `sm`
- `kho`: `md`
- `ton`: Always
- `dinh_muc`: `lg`

### 5. Vật tư (StockMovementLog.tsx)
- `so_ct`: Always
- `ngay`: `xl`
- `vat_tu`: Always
- `kho`: `md`
- `loai`: `sm`
- `so_luong`: Always

### 6. Vật tư (Cảnh báo & Danh mục in `src/routes/_app.vat-tu.tsx`)
- Apply similar conventions to the internal tables in this file.

## Verification
- Run `npx tsc --noEmit`.
- Run `npm test`.
- Verify mobile view (375px) shows max 4 columns.
- Verify desktop view (1280px) remains unchanged.
- Verify Excel export remains complete.
