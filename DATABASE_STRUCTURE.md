# Cấu trúc cơ sở dữ liệu MIRATS 2.0

Tài liệu này mô tả cấu trúc dữ liệu **Hệ thống tài sản** dưới dạng cây, và
phân biệt rõ **đoạn nào là cột vật lý** (`ALTER TABLE`, cố định trong schema)
với **đoạn nào là trường JSONB** (`thiet_bi.thuoc_tinh`, khai động qua giao diện).

> Quy ước ký hiệu
> - 🟦 **Cột vật lý** — nằm trong schema (`ALTER TABLE`), áp dụng cho **mọi** dòng.
> - 🟨 **Trường JSONB** — nằm trong `thiet_bi.thuoc_tinh`, khai qua bảng `he_thong_truong`, áp dụng theo **phạm vi** (toàn cục / lĩnh vực / nhóm / hệ thống).
> - 🔑 khóa chính · 🔗 khóa ngoại (FK)

---

## 1. Cây phân cấp nghiệp vụ (quan hệ thật, có khóa ngoại)

```
Phân loại (dm_phan_loai: Nhóm 1/2/3, Công cụ dụng cụ…)
└── Nhóm hệ thống (dm_nhom_he_thong: VHF/VCCS/AWOS…)
    └── Hệ thống (dm_he_thong)
        └── Tài sản (thiet_bi)
            └── Thành phần tài sản (thiet_bi.thanh_phan)
```

> ⚠️ Thay đổi cấu trúc (2026-07-11): nhóm hệ thống **không còn suy từ từ khóa
> trong tên** — đã có bảng thật `dm_nhom_he_thong` liên kết bằng khóa ngoại.
> `dm_linh_vuc` là **lớp cũ (legacy)**, không dùng trong luồng phân cấp mới;
> giữ lại chỉ để tương thích dữ liệu lịch sử.

Chuỗi quan hệ khóa ngoại:

```
dm_phan_loai ──< dm_nhom_he_thong ──< dm_he_thong ──< thiet_bi
                                          │
dm_don_vi ────────────────────────────────┘  (don_vi_id)
dm_linh_vuc (legacy) ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─┘  (linh_vuc_id, không bắt buộc)
```

- `dm_nhom_he_thong.phan_loai_id` 🔗 `dm_phan_loai`
- `dm_he_thong.phan_loai_id` 🔗 `dm_phan_loai`, `dm_he_thong.nhom_he_thong_id` 🔗 `dm_nhom_he_thong`
- `thiet_bi.he_thong_id` 🔗 `dm_he_thong` (kế thừa `phan_loai_id` + `nhom_he_thong_id` từ hệ thống)

### Kế thừa tự động theo Model (model)

Khi gán `thiet_bi.model_id`, trigger `trg_thiet_bi_inherit_model` **tự đồng bộ**:
`loai_thiet_bi_id`, `nha_san_xuat_id`, và `field_set_id` từ `dm_model`.
→ Nhập Model (`dm_model`) trước; khi import tài sản chỉ cần tham chiếu
mẫu, các trường trên tự điền và không nên nhập tay để tránh xung đột.


---

## 2. Bảng `thiet_bi` — Sổ lý lịch tài sản

### 2.1 🟦 Cột vật lý (ALTER TABLE) — áp dụng cho MỌI tài sản

```
thiet_bi
├── id                      uuid    🔑
├── ma_thiet_bi            text    (mã định danh duy nhất, BẤT BIẾN, dạng TB-000123 số tuần tự tự sinh; NOT NULL, UNIQUE; không mã hoá đơn vị/vị trí/hệ thống)
├── ma_tai_san_bravo       text    🟦 MỚI — mã tài sản Bravo (cố định, mọi TB)
├── ten_thiet_bi          text    (NOT NULL)
├── ma_serial             text
├── model                 text
├── p_n                   text
├── nam_san_xuat          integer
├── nam_dua_vao_khai_thac integer
│
├── ── Quan hệ phân cấp (FK) ──
├── he_thong_id           uuid 🔗 dm_he_thong
├── phan_loai_id          uuid 🔗 dm_phan_loai   🟦 MỚI (kế thừa từ hệ thống)
├── nhom_he_thong_id      uuid 🔗 dm_nhom_he_thong (kế thừa từ hệ thống)
├── linh_vuc_id           uuid 🔗 dm_linh_vuc  (legacy, không bắt buộc)
├── model_id              uuid 🔗 dm_model      (gán → trigger kế thừa)
├── field_set_id          uuid 🔗 field_set     🟦 MỚI (kế thừa từ model)
├── loai_thiet_bi_id      uuid 🔗 dm_loai_thiet_bi
├── trang_thai_id         uuid 🔗 dm_trang_thai_thiet_bi
├── vi_tri_id             uuid 🔗 dm_vi_tri
├── nha_san_xuat_id       uuid 🔗 dm_nha_san_xuat
├── nha_cung_cap_id       uuid 🔗 dm_nha_cung_cap
├── don_vi_id / don_vi_quan_ly_id  uuid 🔗 dm_don_vi
├── danh_gia_nien_han_id  uuid 🔗 dm_danh_gia_nien_han
│
├── ── Thông tin mô tả (text tự do) ──
├── nha_san_xuat, nha_cung_cap, vi_tri, thanh_phan, phan_loai,
│   noi_quan_ly, ghi_chu, file_tai_lieu, hinh_anh, qr_code
├── ngay_mua (date), han_bao_hanh (date)
│
├── ── Trường vòng đời / khai thác (đã thăng cấp thành cột vật lý) ──
├── giay_phep_khai_thac, giay_phep_tan_so   text
├── so_nam_su_dung        integer
├── ty_le_tuoi_tho        numeric
├── vat_tu_du_phong, thong_ke_hong_hoc      text
├── de_xuat_phuong_an, de_xuat_tiep_tuc, de_xuat_khac  text
├── thoi_diem_dieu_chuyen, noi_chuyen_di, noi_chuyen_den, ly_do_dieu_chuyen
├── thoi_diem_cham_dut, quyet_dinh_cham_dut, noi_cat_giu
├── do_tin_cay, nguon_du_lieu
│
├── ── Cấp phát & kiểm kê (RPC T2.1 / kiểm kê định kỳ) ──
├── nguoi_giu             text     🟦 người đang giữ tài sản
├── don_vi_giu_id         uuid 🔗 dm_don_vi (đơn vị đang giữ)
├── ngay_cap_phat         date     🟦 ngày cấp phát gần nhất
├── trang_thai_cap_phat   text     🟦 (dang_giu / da_thu_hoi …)
├── ngay_kiem_ke_ke_tiep  date     🟦 hạn kiểm kê kế tiếp (chu kỳ)
├── model_id              uuid 🔗 dm_model (liên kết model)
│
├── ── Hệ thống / tìm kiếm ──
├── search_text (text), search_tsv (tsvector)
├── created_by, created_at, updated_at
│
└── thuoc_tinh            jsonb 🟨  ← TẤT CẢ trường khai động nằm ở đây
```

> Ghi chú đồng bộ: khối **Cấp phát & kiểm kê** và `model_id` là cột vật lý mới
> nhất (tính năng cấp phát/thu hồi và kiểm kê định kỳ). Ghi bằng RPC
> `cap_phat_thiet_bi` / `ghi_kiem_ke`, không sửa trực tiếp để giữ nhật ký.

### 2.2 🟨 Trường JSONB (`thuoc_tinh`) — khai động qua giao diện

- Khai báo trong bảng **`he_thong_truong`** (`ap_dung_lop = 'thiet_bi'`).
- Lưu giá trị trong `thiet_bi.thuoc_tinh->>'<field_key>'`.
- Được **validate** bằng trigger `validate_thuoc_tinh()` (chặn khóa lạ).
- Độ ưu tiên hiển thị: **Hệ thống > Nhóm > Lĩnh vực > Toàn cục**
  (hàm `resolve_field_definitions`).

Ví dụ truy vấn:
```sql
SELECT ma_thiet_bi, thuoc_tinh->>'x_cong_suat' AS cong_suat
FROM thiet_bi
WHERE thuoc_tinh ? 'x_cong_suat';
```

> ⚠️ Lưu ý lịch sử dữ liệu: một số `field_key` đã đăng ký trong
> `he_thong_truong` với `pham_vi = 'toan_cuc'` (ví dụ `phan_loai`,
> `giay_phep_khai_thac`, `ty_le_tuoi_tho`, `thanh_phan`…) hiện **đã có cột vật lý
> tương ứng** trong `thiet_bi`. Đây là các trường phổ quát đã "thăng cấp" thành
> cột vật lý; dữ liệu mới nên ghi vào cột vật lý, còn `thuoc_tinh` chỉ dùng cho
> trường thật sự riêng theo phạm vi hẹp (nên đặt tiền tố `x_` để tránh trùng).

---

## 3. Bảng `dm_he_thong` — Sổ lý lịch hệ thống

### 3.1 🟦 Cột vật lý

```
dm_he_thong
├── id                    uuid 🔑
├── ma                    text
├── ten                   text
├── ma_tai_san_bravo      text 🟦 MỚI — mã tài sản Bravo (cố định, mọi hệ thống)
├── mo_ta, thu_tu, active
├── ── Quan hệ (FK) ──
├── phan_loai_id          uuid 🔗 dm_phan_loai   🟦 MỚI (Nhóm 1/2/3)
├── nhom_he_thong_id      uuid 🔗 dm_nhom_he_thong
├── linh_vuc_id           uuid 🔗 dm_linh_vuc  (legacy)
├── don_vi_id             uuid 🔗 dm_don_vi
├── ── Thông tin giấy phép khai thác (theo GP) ──
├── ten_he_thong_theo_gp, nam_sx_theo_gp, gp_so, gp_ngay_cap, gp_han,
│   kieu_thiet_bi_gp, so_san_xuat_gp, noi_san_xuat_gp, muc_dich_gp,
│   pham_vi_hoat_dong_gp, ma_dia_chi_kt_gp, dia_diem_dat_gp,
│   thoi_gian_hoat_dong_gp, gp_cu_bai_bo, thanh_phan_theo_gp
└── created_at, updated_at
```

### 3.2 🟨 Trường JSONB cấp hệ thống

- Khai trong `he_thong_truong` với `ap_dung_lop = 'he_thong'`.
- Trigger `he_thong_truong_validate()` chặn khóa trùng cột lõi của `dm_he_thong`.
- Tên hiển thị hệ thống được thống nhất qua hàm `resolve_he_thong_ten()`
  (ưu tiên override trong `cay_node_edit`, fallback về `dm_he_thong.ten`).

---

## 4. Cơ chế khai động & kiểm soát

| Thành phần | Vai trò |
|---|---|
| `he_thong_truong` | Đăng ký định nghĩa trường JSONB (nhãn, kiểu, phạm vi, lớp áp dụng) |
| `thiet_bi.thuoc_tinh` (jsonb) | Nơi lưu giá trị các trường JSONB của tài sản |
| `validate_thuoc_tinh()` | Trigger chặn khóa chưa khai báo trong phạm vi áp dụng |
| `he_thong_truong_validate()` | Trigger chặn `field_key` trùng cột vật lý |
| `resolve_field_definitions(id)` | Gộp trường theo ưu tiên HT > Nhóm > Lĩnh vực > Toàn cục |
| `resolve_he_thong_ten(id)` | Thống nhất tên hệ thống (override → gốc) |
| `promote_generated_column()` | Thăng cấp trường JSONB ổn định thành cột vật lý |
| `cay_thay_doi` / `cay_node_edit` | Nhật ký thay đổi + override tổ chức cây (có rollback) |

---

## 4b. Quy trình Nhập/Xuất hàng loạt (CSV) — chống sai sót & trùng lặp

Màn hình **Admin › Nhập/Xuất hàng loạt** (`/_app/admin/nhap-lieu`) dùng chung cấu
hình `src/lib/mirats/import-config.ts` và server function `runBulkImport`
(`src/lib/mirats/import-export.functions.ts`). Chỉ Admin thực hiện được.

### Nguyên tắc lõi
- **Upsert theo khóa tự nhiên (`mã`)**: trùng mã → cập nhật, chưa có → tạo mới.
  Khóa từng đối tượng: `thiet_bi.ma_thiet_bi`, `dm_he_thong.ma`, `dm_model.ma`,
  `giay_phep_khai_thac.gp_so`, danh mục nền `dm_*.ma`.
- **Cột để trống = giữ nguyên** giá trị cũ. Chỉ cột có mặt trong file mới được ghi.
- **Tham chiếu tra theo `mã` hoặc `tên`** (bỏ dấu, không phân biệt hoa/thường).
  Một số danh mục nền `create:true` sẽ **tự tạo** khi thiếu; `dm_model` **không**
  tự tạo từ tên — phải nhập Mẫu trước.
- **Chống trùng danh mục**: nếu tên/mã khớp "gần đúng" (bỏ dấu + bỏ khoảng
  trắng/ký tự đặc biệt) với bản ghi sẵn có, hệ thống **dùng lại** bản ghi đó và
  hiện cảnh báo thay vì tạo bản trùng.
- **Serial**: `thiet_bi.ma_serial` không bắt buộc nhưng **không được trùng** —
  cảnh báo khi trùng trong file hoặc với CSDL.
- **Xuất round-trip an toàn**: "Xuất dữ liệu hiện có" giải mọi cột `*_id` về `mã`
  và xuất kèm cột `x_*` (từ `thuoc_tinh`) → sửa file rồi nhập lại không mất liên kết.

### Thứ tự nhập chuẩn (phụ thuộc trên → dưới)
1. Danh mục nền: `dm_phan_loai` → `dm_nhom_he_thong` → `dm_nha_san_xuat` →
   `dm_loai_thiet_bi` → `dm_nha_cung_cap` → `dm_don_vi` → `dm_vi_tri`
   (danh mục phân cấp: nhập **cấp cha** trước, cột `cap_cha` khớp theo mã/tên).
2. `dm_model` (kế thừa NSX/Chủng loại).
3. `dm_he_thong` (gắn `phan_loai` + `nhom_he_thong`).
4. `thiet_bi` (gắn `he_thong` → tự kế thừa phân lớp; chọn `model` hoặc khai tay
   NSX/loại; cột `x_*` ghi vào `thuoc_tinh`).

### Luôn Xem trước trước khi Ghi
Chế độ `commit=false` chỉ mô phỏng: đếm tạo/cập nhật/lỗi, liệt kê danh mục sẽ tạo
và cảnh báo (thiếu hệ thống, serial trùng, khớp gần đúng). Chỉ khi không còn lỗi
chặn mới bật nút **Ghi vào CSDL**.

---



## 5. Nguyên tắc chọn cột vật lý hay JSONB

- **Cột vật lý (🟦)** khi trường: áp dụng cho **mọi** dòng, ổn định lâu dài,
  cần index/khóa ngoại, hoặc tham gia báo cáo tổng hợp.
  → Ví dụ: `ma_tai_san_bravo`, `he_thong_id`, `nam_san_xuat`.
- **Trường JSONB (🟨)** khi trường: **riêng theo phạm vi hẹp** (một hệ thống/
  nhóm/lĩnh vực), do admin tự khai qua giao diện, chưa ổn định.
  → Đặt tiền tố `x_` để tránh trùng cột lõi; khi ổn định có thể `promote`.

---

## 6. Mở rộng "quản lý tài sản thông minh" (3 bảng mới)

Ba bảng bổ sung giúp theo dõi vòng đời & bảo dưỡng chủ động:

### 6.1 `bao_tri_chinh_sach` — Chính sách bảo dưỡng theo model
Khai **chu kỳ bảo dưỡng theo chủng loại** (không phải từng tài sản) → khai 1 lần, áp cho mọi tài sản cùng model.

```
bao_tri_chinh_sach
├── id                    uuid 🔑
├── loai_thiet_bi_id      uuid 🔗 dm_loai_thiet_bi (NULL = mọi loại)
├── ten                   text
├── chu_ky_ngay           integer   (chu kỳ theo lịch)
├── chu_ky_gio_chay       numeric   (chu kỳ theo giờ vận hành)
├── canh_bao_truoc_ngay   integer  (mặc định 7)
└── active                boolean
```
Quyền: mọi user hoạt động **xem**; admin/phòng kỹ thuật **sửa**.

### 6.2 `thiet_bi_do_dac` — Đo đạc / telemetry (time-series)
Lưu chỉ số theo thời gian của từng tài sản → cơ sở cho bảo dưỡng dự đoán.

```
thiet_bi_do_dac
├── id            uuid 🔑
├── thiet_bi_id   uuid 🔗 thiet_bi
├── thoi_diem     timestamptz
├── chi_so        text   (gio_chay, nhiet_do, dien_ap…)
├── gia_tri       numeric
├── don_vi_do     text
└── nguon         text   (thu_cong / cam_bien / import)
```
Index `(thiet_bi_id, thoi_diem DESC)` cho truy vấn nhanh.
Quyền xem theo phạm vi đơn vị (`can_view_thiet_bi`); ghi bởi admin/phòng KT.

### 6.3 `thiet_bi_vong_doi` — Nhật ký chuyển trạng thái (state machine)
Ghi mỗi lần tài sản đổi `trang_thai_id` (đang dùng → sửa chữa → niêm cất → thanh lý).

```
thiet_bi_vong_doi
├── id                 uuid 🔑
├── thiet_bi_id        uuid 🔗 thiet_bi
├── tu_trang_thai_id   uuid 🔗 dm_trang_thai_thiet_bi
├── den_trang_thai_id  uuid 🔗 dm_trang_thai_thiet_bi
├── thoi_diem          timestamptz
└── ly_do              text
```
**Tự động ghi** qua trigger `log_thiet_bi_vong_doi()` (AFTER UPDATE OF trang_thai_id trên `thiet_bi`).

> Giao diện: tab **Đo đạc** và **Vòng đời** trong Sổ lý lịch tài sản;
> trang **Quản trị hệ thống → Chính sách bảo dưỡng** để khai chu kỳ theo model.

---

## 7. Danh mục toàn bộ bảng (đồng bộ tự động từ schema)

> Cập nhật lúc 2026-07-12 · Tổng **68 bảng** + **11 view** (xem mục 7.12). Bổ sung chuỗi ITIL (`tickets`/`su_co`/`van_de`), phiếu công việc bảo dưỡng (`cong_viec_bao_tri`), kho & vật tư (`kho`/`vat_tu`/`kho_giao_dich`), và sơ đồ đấu nối (`thiet_bi_ket_noi`). Đây là danh mục đầy đủ tương ứng bộ mẫu nhập liệu CSV kèm theo.

### 7.1 Danh mục (dm_*)

| Bảng | Cột |
|---|---|
| `dm_danh_gia_nien_han` | `id`, `ma`, `ten`, `mo_ta`, `thu_tu`, `active`, `created_at`, `updated_at` |
| `dm_don_vi` | `id`, `ma`, `ten`, `mo_ta`, `thu_tu`, `active`, `created_at`, `updated_at` |
| `dm_he_thong` | `id`, `ma`, `ten`, `mo_ta`, `thu_tu`, `active`, `created_at`, `updated_at`, `phan_loai_id`, `nhom_he_thong_id`, `linh_vuc_id`, `don_vi_id`, `ten_he_thong_theo_gp`, `nam_sx_theo_gp`, `gp_so`, `gp_ngay_cap`, `gp_han`, `kieu_thiet_bi_gp`, `so_san_xuat_gp`, `noi_san_xuat_gp`, `muc_dich_gp`, `pham_vi_hoat_dong_gp`, `ma_dia_chi_kt_gp`, `dia_diem_dat_gp`, `thoi_gian_hoat_dong_gp`, `gp_cu_bai_bo`, `thanh_phan_theo_gp`, `ma_tai_san_bravo` |
| `dm_linh_vuc` *(legacy)* | `id`, `ma`, `ten`, `mo_ta`, `thu_tu`, `active`, `created_at`, `updated_at` |
| `dm_phan_loai` *(mới — Nhóm 1/2/3)* | `id`, `ma`, `ten`, `mo_ta`, `thu_tu`, `active`, `created_at`, `updated_at` |
| `dm_loai_giay_phep` | `id`, `ma`, `ten`, `mo_ta`, `thu_tu`, `active`, `created_at`, `updated_at` |
| `dm_loai_thiet_bi` | `id`, `ma`, `ten`, `mo_ta`, `thu_tu`, `active`, `created_at`, `updated_at` |
| `dm_model` | `id`, `ma`, `ten`, `p_n`, `nha_san_xuat_id`, `loai_thiet_bi_id`, `field_set_id`, `hinh_anh`, `mo_ta`, `thu_tu`, `active`, `created_at`, `updated_at` |
| `dm_nha_cung_cap` | `id`, `ma`, `ten`, `mo_ta`, `thu_tu`, `active`, `created_at`, `updated_at` |
| `dm_nha_san_xuat` | `id`, `ma`, `ten`, `mo_ta`, `thu_tu`, `active`, `created_at`, `updated_at` |
| `dm_nhom_he_thong` | `id`, `ma`, `ten`, `mo_ta`, `thu_tu`, `active`, `created_at`, `updated_at`, `phan_loai_id` |
| `dm_noi_cap` | `id`, `ma`, `ten`, `mo_ta`, `thu_tu`, `active`, `created_at`, `updated_at` |
| `dm_trang_thai_thiet_bi` | `id`, `ma`, `ten`, `mo_ta`, `thu_tu`, `active`, `created_at`, `updated_at` |
| `dm_vi_tri` | `id`, `ma`, `ten`, `mo_ta`, `thu_tu`, `active`, `created_at`, `updated_at` |

### 7.2 Tài sản & vòng đời

| Bảng | Cột |
|---|---|
| `ban_giao` | `id`, `ma_ban_giao`, `thiet_bi`, `loai_ban_giao`, `nguoi_giao`, `nguoi_nhan`, `don_vi_nhan`, `ngay_nhan`, `ngay_tra`, `tinh_trang_khi_nhan`, `tinh_trang_khi_tra`, `file_bien_ban`, `trang_thai`, `ghi_chu`, `created_by`, `created_at`, `updated_at`, `thiet_bi_id`, `chu_ky_url`, `da_chap_nhan`, `thoi_diem_chap_nhan` |
| `giay_phep` | `id`, `ma_giay_phep`, `thiet_bi_id`, `loai_giay_phep_id`, `so_giay_phep`, `ngay_cap`, `ngay_het_han`, `noi_cap_id`, `file_giay_phep`, `ghi_chu`, `created_by`, `created_at`, `updated_at`, `search_text`, `search_tsv` |
| `giay_phep_khai_thac` | `id`, `he_thong_id`, `don_vi`, `tram`, `he_thong_folder`, `gp_so`, `gp_ngay`, `gp_han`, `gp_cu`, `ten_he_thong_theo_gp`, `nam_sx_gp`, `he_thong_csdl`, `trang_thai_doi_chieu`, `kieu_thiet_bi`, `so_san_xuat`, `noi_san_xuat`, `muc_dich`, `pham_vi`, `ma_dia_chi`, `dia_diem`, `thoi_gian`, `thanh_phan_theo_gp`, `created_at`, `updated_at` |
| `he_thong_truong` | `id`, `he_thong_id`, `field_key`, `nhan`, `kieu`, `tuy_chon`, `thu_tu`, `created_by`, `created_at`, `updated_at`, `pham_vi`, `ap_dung_id`, `bat_buoc`, `ap_dung_lop`, `hoat_dong`, `mac_dinh`, `rang_buoc`, `mo_ta`, `help_text`, `nhom_field` |
| `kiem_ke` | `id`, `thiet_bi_id`, `nguoi_kiem`, `thoi_diem`, `tinh_trang`, `vi_tri_gps`, `anh_url`, `ghi_chu`, `created_by`, `created_at` |
| `thiet_bi` | `id`, `ma_thiet_bi`, `ten_thiet_bi`, `loai_thiet_bi_id`, `ma_serial`, `model`, `nha_san_xuat`, `ngay_mua`, `he_thong_id`, `phan_loai_id`, `nhom_he_thong_id`, `nha_cung_cap`, `han_bao_hanh`, `trang_thai_id`, `don_vi_quan_ly_id`, `vi_tri`, `ghi_chu`, `file_tai_lieu`, `hinh_anh`, `qr_code`, `created_by`, `created_at`, `updated_at`, `nha_san_xuat_id`, `nha_cung_cap_id`, `vi_tri_id`, `search_text`, `search_tsv`, `thanh_phan`, `p_n`, `nam_san_xuat`, `nam_dua_vao_khai_thac`, `linh_vuc_id`, `don_vi_id`, `danh_gia_nien_han_id`, `phan_loai`, `noi_quan_ly`, `giay_phep_khai_thac`, `giay_phep_tan_so`, `so_nam_su_dung`, `ty_le_tuoi_tho`, `vat_tu_du_phong`, `thong_ke_hong_hoc`, `de_xuat_phuong_an`, `de_xuat_tiep_tuc`, `de_xuat_khac`, `thoi_diem_dieu_chuyen`, `noi_chuyen_di`, `noi_chuyen_den`, `ly_do_dieu_chuyen`, `thoi_diem_cham_dut`, `quyet_dinh_cham_dut`, `noi_cat_giu`, `do_tin_cay`, `nguon_du_lieu`, `thuoc_tinh`, `ma_tai_san_bravo`, `nguoi_giu`, `don_vi_giu_id`, `ngay_cap_phat`, `trang_thai_cap_phat`, `ngay_kiem_ke_ke_tiep`, `model_id`, `field_set_id` |
| `thiet_bi_cap_phat` | `id`, `thiet_bi_id`, `hanh_dong`, `nguoi_giu`, `don_vi_giu_id`, `ghi_chu`, `thoi_diem`, `thuc_hien_boi`, `created_at` |
| `thiet_bi_do_dac` | `id`, `thiet_bi_id`, `thoi_diem`, `chi_so`, `gia_tri`, `don_vi_do`, `nguon`, `ghi_chu`, `created_by`, `created_at` |
| `thiet_bi_tep_dinh_kem` | `id`, `thiet_bi_id`, `loai`, `bucket`, `file_path`, `file_name`, `mime_type`, `kich_thuoc`, `mo_ta`, `uploaded_by`, `created_at`, `updated_at` |
| `thiet_bi_vong_doi` | `id`, `thiet_bi_id`, `tu_trang_thai_id`, `den_trang_thai_id`, `thoi_diem`, `ly_do`, `nguoi_thuc_hien`, `created_at` |
| `thiet_bi_ket_noi` *(topology)* | `id`, `tu_thiet_bi_id`, `den_thiet_bi_id`, `tu_cong`, `den_cong`, `loai`, `ten_mach`, `mo_ta`, `don_vi_id_snapshot`, `created_by`, `created_at`, `updated_at` |

### 7.3 Vận hành (sự cố / bảo dưỡng / hỏng hóc)

| Bảng | Cột |
|---|---|
| `bao_tri` | `id`, `ma_bao_tri`, `thiet_bi`, `he_thong`, `don_vi`, `loai_bao_tri`, `ke_hoach`, `ngay_bat_dau`, `ngay_hoan_thanh`, `mo_ta_cong_viec`, `ket_qua`, `chi_phi`, `nguoi_thuc_hien`, `don_vi_thuc_hien`, `trang_thai`, `file_bien_ban`, `created_by`, `created_at`, `updated_at`, `thiet_bi_id`, `form_submission_id` |
| `bao_tri_chinh_sach` | `id`, `loai_thiet_bi_id`, `ten`, `mo_ta`, `chu_ky_ngay`, `chu_ky_gio_chay`, `canh_bao_truoc_ngay`, `active`, `created_by`, `created_at`, `updated_at` |
| `cong_viec_bao_tri` *(work order)* | `id`, `ma_cong_viec`, `thiet_bi_id`, `he_thong_id`, `chinh_sach_id`, `loai`, `uu_tien`, `trang_thai`, `ngay_den_han`, `ngay_bat_dau`, `ngay_hoan_thanh`, `nguoi_phu_trach`, `bao_tri_id`, `mo_ta`, `ghi_chu`, `don_vi_id_snapshot`, `created_by`, `created_at`, `updated_at`, `van_de_id`, `su_co_id`, `can_phe_duyet`, `trang_thai_phe_duyet`, `nguoi_phe_duyet`, `phe_duyet_at`, `ke_hoach_rollback` |
| `hong_hoc` | `id`, `ma_hong_hoc`, `thiet_bi_hong`, `su_co`, `ngay_hong`, `bo_phan_hong`, `mo_ta_hong_hoc`, `phuong_an`, `thiet_bi_thay_the`, `vat_tu_su_dung`, `chi_phi`, `nguoi_thuc_hien`, `don_vi_thuc_hien`, `ket_qua`, `ngay_hoan_thanh`, `trang_thai`, `file_dinh_kem`, `created_by`, `created_at`, `updated_at`, `thiet_bi_hong_id`, `thiet_bi_thay_the_id` |
| `su_co` | `id`, `ma_su_co`, `thiet_bi`, `he_thong`, `don_vi`, `ngay_phat_hien`, `nguoi_bao_cao`, `muc_do`, `anh_huong_dhb`, `hien_tuong`, `nguyen_nhan`, `bien_phap_xu_ly`, `thoi_diem_khac_phuc`, `thoi_gian_gian_doan`, `nguoi_xu_ly`, `trang_thai`, `lien_ket_hong_hoc`, `file_dinh_kem`, `created_by`, `created_at`, `updated_at`, `bao_cao_ban_dau`, `ma_nhom_bc`, `thiet_bi_id`, `he_thong_id`, `don_vi_id_snapshot`, `van_de_id`, `ticket_id` |
| `van_de` *(RCA — Problem)* | `id`, `ma_van_de`, `tieu_de`, `mo_ta`, `nguyen_nhan_goc`, `bien_phap_khac_phuc`, `trang_thai`, `muc_do`, `thiet_bi_id`, `he_thong_id`, `don_vi_id_snapshot`, `created_by`, `created_at`, `updated_at` |

### 7.4 Biểu mẫu (form_*)

| Bảng | Cột |
|---|---|
| `form_field` | `id`, `template_id`, `key`, `label`, `kind`, `required`, `options`, `help_text`, `placeholder`, `default_value`, `position`, `created_at`, `updated_at` |
| `form_submission` | `id`, `template_id`, `template_code`, `template_version`, `don_vi_id`, `created_by`, `status`, `data`, `thiet_bi_id`, `ky_bao_cao`, `tieu_de`, `submitted_at`, `reviewed_by`, `reviewed_at`, `review_note`, `signed_by`, `signed_at`, `pdf_path`, `created_at`, `updated_at`, `search_text`, `search_tsv`, `he_thong_id` |
| `form_submission_thiet_bi` | `submission_id`, `thiet_bi_id`, `note`, `created_at` |
| `form_template` | `id`, `code`, `ten`, `mo_ta`, `thiet_bi_mode`, `active`, `version`, `require_signature`, `created_by`, `created_at`, `updated_at`, `nhom` |
| `form_template_he_thong` | `id`, `template_id`, `he_thong_id`, `created_at` |

### 7.5 Dự án (du_an_*)

| Bảng | Cột |
|---|---|
| `du_an` | `id`, `ma`, `ten`, `mo_ta`, `don_vi_id`, `nguoi_tao_id`, `quan_ly_id`, `ngay_bat_dau`, `ngay_ket_thuc_du_kien`, `trang_thai`, `tien_do`, `created_at`, `updated_at` |
| `du_an_cong_viec` | `id`, `du_an_id`, `moc_id`, `ten`, `mo_ta`, `nguoi_xu_ly_chinh`, `ngay_bat_dau`, `ngay_ket_thuc_du_kien`, `ngay_hoan_thanh_thuc_te`, `trang_thai`, `tien_do`, `ket_qua`, `created_by`, `created_at`, `updated_at` |
| `du_an_cong_viec_phoi_hop` | `cong_viec_id`, `user_id`, `added_at`, `added_by` |
| `du_an_moc` | `id`, `du_an_id`, `ten`, `mo_ta`, `thu_tu`, `ngay_bat_dau`, `ngay_ket_thuc_du_kien`, `trang_thai`, `tien_do`, `created_by`, `created_at`, `updated_at` |

### 7.6 Sơ đồ & cây

| Bảng | Cột |
|---|---|
| `cay_node_edit` | `id`, `kind`, `ma`, `don_vi_ma`, `ten`, `du_lieu`, `created_by`, `created_at`, `updated_at` |
| `cay_thay_doi` | `id`, `loai`, `he_thong_id`, `mo_ta`, `payload`, `snapshot_cu`, `trang_thai`, `da_ap_dung`, `da_hoan_tac`, `nguoi_tao`, `nguoi_duyet`, `duyet_luc`, `created_at`, `updated_at` |
| `field_set` | `id`, `ten`, `mo_ta`, `created_by`, `created_at`, `updated_at` |
| `field_set_item` | `id`, `field_set_id`, `field_key`, `thu_tu`, `created_at`, `updated_at` |
| `so_do_he_thong` | `id`, `don_vi_id`, `ten`, `mo_ta`, `du_lieu`, `created_by`, `created_at`, `updated_at`, `don_vi_ma`, `he_thong_ma`, `he_thong_ten` |
| `so_do_tep_dinh_kem` | `id`, `so_do_id`, `ten_tep`, `duong_dan`, `loai`, `kich_thuoc`, `created_by`, `created_at` |
| `so_do_thu_vien_hinh` | `id`, `ten`, `nhom`, `duong_dan`, `created_by`, `created_at` |

### 7.7 Trao đổi / thông báo / ticket

| Bảng | Cột |
|---|---|
| `conversation_participant` | `conversation_id`, `user_id`, `last_read_at`, `joined_at` |
| `conversations` | `id`, `kind`, `ten`, `created_by`, `last_message_at`, `created_at` |
| `messages` | `id`, `conversation_id`, `sender_id`, `noi_dung`, `file_path`, `file_name`, `file_size`, `file_mime`, `created_at` |
| `notifications` | `id`, `user_id`, `loai`, `tieu_de`, `noi_dung`, `link`, `ref_type`, `ref_id`, `read_at`, `created_at` |
| `ticket_comment` | `id`, `ticket_id`, `user_id`, `noi_dung`, `created_at` |
| `tickets` | `id`, `loai`, `tieu_de`, `mo_ta`, `trang_thai`, `uu_tien`, `created_by`, `assigned_to`, `don_vi`, `ket_qua`, `created_at`, `updated_at`, `closed_at`, `thiet_bi_id`, `he_thong_id`, `su_co_id`, `sla_han`, `first_response_at` |

### 7.8 AI

| Bảng | Cột |
|---|---|
| `ai_config` | `id`, `enabled`, `provider`, `model`, `base_url`, `api_key_secret_name`, `system_prompt`, `max_tokens`, `beta_label`, `updated_by`, `created_at`, `updated_at` |
| `ai_conversation` | `id`, `user_id`, `tieu_de`, `created_at`, `updated_at` |
| `ai_message` | `id`, `conversation_id`, `role`, `content`, `tokens`, `created_at` |

### 7.9 Vị trí & media

| Bảng | Cột |
|---|---|
| `vi_tri_media` | `id`, `vi_tri_ma`, `don_vi`, `loai`, `ten_tep`, `duong_dan`, `mo_ta`, `kich_thuoc`, `content_type`, `created_by`, `created_at`, `vi_do`, `kinh_do`, `do_chinh_xac`, `chup_luc` |

### 7.10 Hệ thống / quản trị / bảo mật

| Bảng | Cột |
|---|---|
| `app_cai_dat` | `khoa`, `gia_tri`, `updated_at`, `updated_by` |
| `audit_log` | `id`, `user_id`, `action`, `entity`, `entity_id`, `detail`, `created_at` |
| `backup_lich_su` | `id`, `loai`, `trang_thai`, `so_bang`, `so_dong`, `dung_luong`, `file_path`, `dich`, `dong_bo`, `ghi_chu`, `tao_boi`, `tao_boi_ten`, `created_at`, `updated_at` |
| `bang_cot_tuy_chinh` | `id`, `user_id`, `bang_key`, `cau_hinh`, `created_at`, `updated_at` |
| `profiles` | `id`, `email`, `ho_ten`, `don_vi`, `active`, `created_at`, `updated_at`, `avatar_url`, `tour_hoan_thanh` |
| `user_roles` | `id`, `user_id`, `role`, `created_at` |
| `webauthn_credentials` | `id`, `user_id`, `credential_id`, `public_key`, `counter`, `transports`, `device_type`, `backed_up`, `device_name`, `created_at`, `last_used_at` |

### 7.11 Kho & vật tư

| Bảng | Cột |
|---|---|
| `kho` | `id`, `ma_kho`, `ten`, `vi_tri_id`, `don_vi_id`, `ghi_chu`, `kich_hoat`, `created_by`, `created_at`, `updated_at` |
| `vat_tu` | `id`, `ma_vat_tu`, `ten`, `loai`, `don_vi_tinh`, `don_gia`, `muc_ton_toi_thieu`, `model_id`, `nha_cung_cap_id`, `don_vi_id`, `ghi_chu`, `kich_hoat`, `created_by`, `created_at`, `updated_at` |
| `kho_giao_dich` *(sổ cái bất biến)* | `id`, `so_ct`, `nhom_ct`, `vat_tu_id`, `kho_id`, `loai`, `so_luong`, `hieu_ung`, `don_gia`, `ngay`, `lien_ket_cong_viec_id`, `lien_ket_su_co_id`, `lien_ket_hong_hoc_id`, `don_vi_id`, `nguoi_thuc_hien`, `ghi_chu`, `created_at` |

### 7.12 View (read-model, read-only)

| View | Mục đích |
|---|---|
| `v_giay_phep` | Hợp nhất giấy phép tài sản + hệ thống (T14); parse ngày hết hạn tiếng Việt, loại giấy phép bị bãi bỏ. |
| `v_kpi_bao_tri` | KPI phiếu công việc theo đơn vị (tổng/hoàn thành/đang mở/quá hạn/đúng hạn) (T12). |
| `v_van_de` | Read-model vấn đề (RCA) kèm liên kết sự cố/phiếu công việc (T16). |
| `v_thiet_bi_ket_noi` | Sơ đồ đấu nối đã giải tên tài sản/cổng (T15). |
| `v_ton_kho` / `v_ton_kho_canh_bao` | Tồn kho hiện tại & cảnh báo dưới mức tối thiểu (T13). |
| `v_doi_soat_du_lieu` / `v_doi_soat_tong_hop` | Báo cáo đối soát mâu thuẫn dữ liệu (T07). |
| `v_thiet_bi_nguon_chuan_conflict` | Bản ghi text lệch FK / chưa liên kết FK (T06). |
| `v_canh_bao_nien_han` / `v_sap_het_han` | Cảnh báo niên hạn & giấy phép sắp hết hạn. |

---


## T06 — Nguồn chuẩn dữ liệu (FK / text / JSONB)

**Nguyên tắc quyền dữ liệu (data authority):** *khoá ngoại (FK) là nguồn chuẩn duy nhất*. Cột chữ (text) chỉ là **bản sao/dự phòng đọc** (snapshot), không cạnh tranh quyền với FK. JSONB `thuoc_tinh` chỉ dành cho **key mở rộng**, không ghi đè cột lõi.

### Bảng quyết định nguồn chuẩn (`thiet_bi`)

| Trường hiển thị | Nguồn chuẩn (write/read) | Cột text legacy (fallback) | Cơ chế đồng bộ |
|---|---|---|---|
| Model | `model_id` → `dm_model.ten` | `model` | trigger `thiet_bi_sync_ref_text` |
| Nhà sản xuất | `nha_san_xuat_id` → `dm_nha_san_xuat.ten` | `nha_san_xuat` | trigger sync + kế thừa từ model |
| Nhà cung cấp | `nha_cung_cap_id` → `dm_nha_cung_cap.ten` | `nha_cung_cap` | trigger `thiet_bi_sync_ref_text` |
| Vị trí | `vi_tri_id` → `dm_vi_tri.ten` | `vi_tri` | trigger `thiet_bi_sync_ref_text` (đã bổ sung) |
| Chủng loại | `loai_thiet_bi_id` | — | kế thừa từ `model` qua `thiet_bi_inherit_model` |
| Phân loại | `phan_loai_id` / `he_thong_id` fallback | `phan_loai` | suy từ hệ thống |

Khi gán `model_id`: trigger `thiet_bi_inherit_model` tự kế thừa `loai_thiet_bi_id`, `nha_san_xuat_id`, `field_set_id`, `p_n`. Khi đổi bất kỳ FK nào: trigger `thiet_bi_sync_ref_text` cập nhật lại cột text tương ứng. Trigger **chỉ chạy khi ghi/đổi**, không backfill dữ liệu cũ (bảo toàn snapshot lịch sử).

### Contract đối soát (read-only, không UPDATE/DELETE)

View `public.v_thiet_bi_nguon_chuan_conflict` liệt kê mọi bản ghi có text lệch FK, chưa liên kết FK, hoặc không kế thừa đúng loại/NSX từ model. Dùng để đối soát trước mọi migration backfill.

Baseline ngày 2026-07-12 (816 tài sản): 597 bản ghi cần duyệt — `nsx_text_lech_fk`=204, `model_text_lech_fk`=80, `vitri_text_lech_fk`=72, `vitri_chua_lien_ket`=416, `loai_khong_ke_thua_model`=16, `nsx_khong_ke_thua_model`=2, `ncc_text_lech_fk`=0. (Tất cả là snapshot legacy — FK vẫn là nguồn chuẩn; chưa bắt buộc xoá cột legacy.)

## T07 — Báo cáo đối soát dữ liệu (read-only)

Bộ view chỉ đọc, KHÔNG UPDATE/DELETE, KHÔNG tự chọn giá trị thắng:
- `v_doi_soat_du_lieu` — liệt kê từng bản ghi mâu thuẫn (loai_conflict, bang, id, ma, chi_tiet).
- `v_doi_soat_tong_hop` — đếm theo loại conflict.

Baseline 2026-07-12 (910 bản ghi cần duyệt):
| loai_conflict | so_ban_ghi | ý nghĩa |
|---|---|---|
| LOCATION_UNLINKED | 416 | có vị trí (text) nhưng chưa liên kết `vi_tri_id` |
| MFR_TEXT | 326 | text `nha_san_xuat` lệch với `nha_san_xuat_id` (FK thắng) |
| MODEL_TEXT | 80 | text `model` lệch với `model_id` (FK thắng) |
| LOCATION_TEXT | 72 | text `vi_tri` lệch với `vi_tri_id` (FK thắng) |
| SYSTEM_PHAN_LOAI | 8 | phân loại hệ thống lệch với nhóm cha |
| HIERARCHY_PHAN_LOAI | 8 | phân chủng loại lệch với hệ thống cha |

Bằng chứng: `exports/T07_doi_soat_du_lieu.csv`, `exports/T07_tong_hop.csv`.

## T08 — Thống nhất cây phân cấp (Move path)

Phân cấp chuẩn duy nhất: **Phân loại → Nhóm hệ thống → Hệ thống → Tài sản**
(`dm_phan_loai → dm_nhom_he_thong → dm_he_thong → thiet_bi`). Lớp
`dm_linh_vuc` là dữ liệu legacy trực giao — **không** còn nằm trong phân cấp
render/move; giá trị `linh_vuc_id` cũ được giữ nguyên (read fallback), không xoá.

Render (`db-taxonomy.ts`) theo thứ tự ưu tiên FK-first:
- Nhóm hiển thị: `nhom_he_thong_id` (FK) → override `manual_nh_key` (cay_node_edit) → `deriveNhom(tên)`.
- Phân loại: `phan_loai_id` (FK) → phân loại của hệ thống cha → phân loại của nhóm cha.

Cơ chế Move (RPC `_cay_apply`, undo `cay_hoan_tac`):
- Payload `to_nhom_id` = **id Phân loại đích** (không phải nhóm). Ghi vào `phan_loai_id`.
- `to_nh_key` = mã nhóm; nếu khớp nhóm THẬT trong phân loại đích → gán `nhom_he_thong_id`,
  nếu chỉ là nhóm suy ra → `nhom_he_thong_id = NULL` + ghi override để hiển thị đúng.
- **Không** còn ghi `linh_vuc_id`; **không** còn đọc `to_lv_id` (trước đây gây lỗi
  `invalid input syntax for type uuid` do id ảo `__lv__:` và lỗi FK do ghi nhầm
  phan_loai_id vào nhom_he_thong_id).
- Snapshot hoàn tác lưu đủ `phan_loai_id` + `nhom_he_thong_id` (+ `linh_vuc_id`) để khôi phục chính xác.

Kiểm chứng 2026-07-12: move_system "Hệ thống ghi âm" → phân loại + nhóm AMHS áp dụng
thành công (4 tài sản theo cùng), không lỗi FK, `linh_vuc_id` giữ nguyên; đã khôi phục baseline.

## T09 — Invariant phân cấp ở tầng cơ sở dữ liệu (trigger)

Từ T08, phân cấp chuẩn được thống nhất ở tầng ứng dụng. T09 khoá bất biến này
**ngay trong CSDL** để không path nào (UI, RPC `_cay_apply`, import, direct
update) có thể tạo tổ hợp khoá ngoại mâu thuẫn. Các cột phân cấp phi-chuẩn-hoá
(`phan_loai_id`, `nhom_he_thong_id`, `linh_vuc_id`) **luôn được dẫn xuất từ cha**,
không bao giờ ghi tay giá trị mâu thuẫn.

Trigger (BEFORE — ép giá trị đúng):
- `trg_he_thong_sync_phan_loai` (`dm_he_thong`): khi lưu Hệ thống, `phan_loai_id`
  lấy theo Nhóm hệ thống cha (nếu nhóm đã có phân loại).
- `trg_thiet_bi_sync_hierarchy` (`thiet_bi`): khi lưu Tài sản có `he_thong_id`,
  `phan_loai_id` / `nhom_he_thong_id` / `linh_vuc_id` lấy theo Hệ thống cha.

Trigger (AFTER — lan truyền xuống con):
- `trg_nhom_cascade_phan_loai` (`dm_nhom_he_thong`): đổi phân loại của Nhóm →
  cập nhật các Hệ thống con.
- `trg_he_thong_cascade_thiet_bi` (`dm_he_thong`): đổi phân cấp của Hệ thống →
  cập nhật các Tài sản con.

Hàm trigger `SECURITY DEFINER SET search_path=public`, đã REVOKE EXECUTE khỏi
`anon`/`authenticated`/`PUBLIC` (không gọi trực tiếp qua API được).

Kiểm chứng 2026-07-12:
- Trước: 8 hệ thống + 515 tài sản mâu thuẫn (8 phân loại, 507 lĩnh vực).
- Backfill (sau khi T07 được duyệt): nhóm NULL phân loại được suy từ hệ thống con
  nhất quán → hệ thống dẫn theo nhóm → tài sản dẫn theo hệ thống.
- Sau: `device_conflicts = 0`, `system_conflicts = 0`.
- Test bất biến: cố UPDATE tài sản sang phân loại sai → trigger ép trả về đúng
  giá trị của hệ thống cha (không thể tạo mâu thuẫn).

## T10 — Ngừng khai thác (retirement) & xoá vĩnh viễn tài sản

Trước T10, nghiệp vụ chỉ có **hard-delete** tài sản. Xoá cứng làm mất lịch sử:
`thiet_bi_vong_doi`, `ban_giao`, `kiem_ke`, `thiet_bi_do_dac` bị CASCADE; `su_co`,
`bao_tri`, `hong_hoc` bị SET NULL (mất liên kết về tài sản). T10 thay vòng đời
kết thúc bằng **ngừng khai thác** — giữ nguyên toàn bộ hồ sơ lý lịch.

Danh mục trạng thái:
- `dm_trang_thai_thiet_bi.la_ngung_khai_thac` (boolean) đánh dấu trạng thái vòng đời cuối.
- Thêm 2 trạng thái: `NGUNG_KHAI_THAC` (Ngừng khai thác), `THANH_LY` (Thanh lý).

RPC (SECURITY DEFINER, tự kiểm tra vai trò, REVOKE khỏi anon/PUBLIC):
- `ngung_khai_thac_thiet_bi(_mas text[], _ly_do text, _thanh_ly boolean)` — chỉ
  Admin/Phòng KT. Ghi chuyển trạng thái vào `thiet_bi_vong_doi`, cập nhật
  `trang_thai_id` + `trang_thai`, ghi `audit_log` (action `ngung_khai_thac`).
  **Không xoá dữ liệu.**
- `phuc_hoi_thiet_bi(_mas text[], _ly_do text)` — chỉ Admin/Phòng KT. Đưa tài sản
  về `DANG_KHAI_THAC`, ghi vòng đời + `audit_log` (action `phuc_hoi`).
- `purge_thiet_bi(_mas text[])` — **chỉ Admin**. Xoá vĩnh viễn chỉ cho bản ghi nhập
  nhầm **chưa phát sinh** quan hệ nào (su_co, bao_tri, hong_hoc, ban_giao, kiem_ke,
  giay_phep, form_submission, form_submission_thiet_bi, thiet_bi_do_dac). Bản ghi đã
  có lịch sử bị bỏ qua và trả về trong `bo_qua`; ghi `audit_log` (action `purge`).

UI: trang chi tiết tài sản (`/thiet-bi/$maThietBi`) có `ThietBiLifecycleActions`
— nút **Ngừng khai thác** (kèm tuỳ chọn Thanh lý + lý do), **Phục hồi khai thác**
(khi đang ngừng), và **Xoá vĩnh viễn** (chỉ Admin). Tài sản đã ngừng khai thác
vẫn xem được đầy đủ sổ lý lịch (DONE của T10).

## T11 — Snapshot lịch sử & RLS theo đơn vị

**VERIFY-FIRST → CONFIRMED_GAP.** RLS xem lịch sử (`su_co`, `bao_tri`, `hong_hoc`,
`ban_giao`) trước T11 scope qua `can_view_thiet_bi(thiet_bi_id)` — đọc **đơn vị
hiện tại** của tài sản (`thiet_bi.don_vi_quan_ly_id`). Hệ quả: khi tài sản được
chuyển đơn vị / ngừng khai thác / xoá (T10) thì phạm vi xem **trôi** sang đơn vị
mới hoặc biến mất khi FK NULL — đơn vị đã xử lý sự cố mất chính hồ sơ của mình.

Snapshot bất biến:
- Thêm cột `don_vi_id_snapshot uuid` cho cả 4 bảng lịch sử.
- Helper `_snapshot_don_vi_from_thiet_bi(_tb_id, _ht_id)`: suy đơn vị sở hữu từ
  tài sản (`don_vi_quan_ly_id` → `don_vi_id` → `don_vi_giu_id`), fallback qua hệ
  thống. `SECURITY DEFINER`, REVOKE khỏi anon/authenticated/PUBLIC.
- Trigger `trg_fill_don_vi_snapshot` (BEFORE INSERT OR UPDATE trên cả 4 bảng):
  lúc tạo tự điền snapshot; **khi đã có giá trị thì đóng băng** — mọi cập nhật từ
  client bị ép về giá trị cũ (client không sửa được).
- Backfill bản ghi cũ theo đơn vị hiện tại của tài sản (chỉ khi xác định được).

RLS SELECT (thêm nhánh fallback, giữ nguyên current-asset):
```
is_active_user(uid) AND (
  can_manage_equipment(uid)
  OR (thiet_bi_id/thiet_bi_hong_id IS NOT NULL AND can_view_thiet_bi(..., uid))
  OR (don_vi_id_snapshot IS NOT NULL AND don_vi_id_snapshot = get_user_don_vi_id(uid))
)
```

Ma trận test:
1. Tài sản thuộc đơn vị A → tạo sự cố ⇒ snapshot = A (đã kiểm chứng insert live).
2. Chuyển/ngừng khai thác/xoá tài sản: đơn vị A **vẫn xem** (nhánh snapshot).
3. Đơn vị B (tài sản chưa từng thuộc B) **không xem** — không mở quyền toàn workspace.
4. Đổi master data (đổi đơn vị tài sản) không làm đổi snapshot (bất biến).

---

## T12 — Chính sách bảo dưỡng (PM) → Phiếu công việc (Work Order) → KPI

Chuỗi: `bao_tri_chinh_sach` (chu kỳ theo chủng loại) → sinh `cong_viec_bao_tri`
(phiếu công việc) → hoàn thành → cập nhật chu kỳ trên `thiet_bi` → KPI.

Thêm cột `thiet_bi`: `ngay_bao_tri_gan_nhat`, `ngay_bao_tri_ke_tiep` (date).

Bảng `cong_viec_bao_tri` (work order):
- `ma_cong_viec` tự sinh `WO-000001` (sequence + trigger `trg_cvbt_ma`).
- `loai` PM (định kỳ) | CM (khắc phục); `uu_tien` THAP|TRUNG_BINH|CAO|KHAN;
  `trang_thai` MO|DANG_LAM|HOAN_THANH|HUY.
- `ngay_den_han`, `ngay_bat_dau`, `ngay_hoan_thanh`, `nguoi_phu_trach`.
- FK `chinh_sach_id → bao_tri_chinh_sach`, `bao_tri_id → bao_tri`,
  `thiet_bi_id → thiet_bi`, `he_thong_id → dm_he_thong`.
- `don_vi_id_snapshot` khoá phạm vi theo đơn vị (tái dùng `trg_fill_don_vi_snapshot`, T11).

RLS: `cvbt_select` (quản lý tài sản / xem theo tài sản / theo đơn vị snapshot),
`cvbt_write` (chỉ `can_manage_equipment`).

RPC (SECURITY DEFINER, chỉ `can_manage_equipment`):
- `tao_cong_viec_bao_tri_dinh_ky()` → sinh phiếu PM cho tài sản đang khai thác
  (`thoi_diem_cham_dut IS NULL`) có `ngay_bao_tri_ke_tiep <= today + canh_bao_truoc_ngay`,
  bỏ qua tài sản đã có phiếu MO/DANG_LAM cùng chính sách. Trả `so_phieu_tao`.
- `hoan_thanh_cong_viec_bao_tri(_id, _bao_tri_id)` → đóng phiếu, set
  `ngay_bao_tri_gan_nhat = today`, `ngay_bao_tri_ke_tiep = today + chu_ky_ngay`.

View `v_kpi_bao_tri` (security_invoker) theo đơn vị: tổng, hoàn thành, đang mở,
quá hạn (mở & quá `ngay_den_han`), hoàn thành đúng hạn, `ty_le_dung_han` (%).

UI: `/bao-tri/cong-viec` — tab Phiếu công việc (lọc, bắt đầu/hoàn thành, nút
"Sinh phiếu định kỳ") + tab KPI theo đơn vị.

---

## T13 — Kho & vật tư (Stock Ledger)

Mô hình sổ cái bất biến (immutable ledger): mọi thay đổi tồn kho là một dòng
`kho_giao_dich`, không sửa/xoá — tồn kho suy ra từ tổng `hieu_ung`.

Bảng:
- `kho` — danh mục kho (gắn `vi_tri_id`, `don_vi_id`).
- `vat_tu` — danh mục vật tư (`loai`: SPARE dự phòng | CONSUMABLE tiêu hao), có
  `muc_ton_toi_thieu`, liên kết `model_id`, `nha_cung_cap_id`.
- `kho_giao_dich` — sổ cái: `loai` NHAP|XUAT|CHUYEN|KIEM_KE, `hieu_ung` (±số lượng
  áp vào kho), liên kết chứng từ công việc/sự cố/hỏng hóc.

RPC (SECURITY DEFINER, chỉ `can_manage_equipment`): `kho_nhap`, `kho_xuat`,
`kho_chuyen`, `kho_kiem_ke` — sinh `so_ct`, ghi dòng ledger, không UPDATE tồn.

View: `v_ton_kho` (tồn hiện tại theo kho × vật tư), `v_ton_kho_canh_bao`
(tồn ≤ `muc_ton_toi_thieu`).

UI: `/vat-tu` — KPI, danh mục vật tư/kho, lịch sử giao dịch.

---

## T14 — Hợp nhất giấy phép (v_giay_phep)

View đọc `v_giay_phep` gộp hai nguồn: giấy phép tài sản (`giay_phep`) và giấy
phép khai thác hệ thống (`dm_he_thong.*_gp` / `giay_phep_khai_thac`). Parse ngày
tiếng Việt để tính hạn, loại bỏ giấy phép cũ đã bị bãi bỏ (`gp_cu_bai_bo`) tránh
đếm trùng. Widget "sắp hết hạn" ở trang chủ đọc từ view này.

UI: `/giay-phep` đọc `v_giay_phep` (frontend `db-licenses.ts`).

---

## T15 — Sơ đồ đấu nối (Topology)

Bảng `thiet_bi_ket_noi`: cạnh nối giữa hai tài sản (`tu_thiet_bi_id` →
`den_thiet_bi_id`, kèm `tu_cong`/`den_cong`, `loai`, `ten_mach`). Khoá phạm vi
đơn vị qua `don_vi_id_snapshot` (T11).

RPC `topology_import_tu_so_do(...)` đồng bộ cạnh nối từ sơ đồ FigJam vào bảng.
View `v_thiet_bi_ket_noi` giải tên tài sản/cổng để hiển thị.

UI: `/topology` — KPI + quản lý kết nối.

---

## T16 — Chuỗi ITIL: Ticket → Sự cố → Vấn đề → Thay đổi

Chuỗi quy trình: `tickets` (yêu cầu, có SLA) → nâng cấp thành `su_co` (Incident)
→ phân tích nguyên nhân gốc `van_de` (Problem/RCA) → sinh `cong_viec_bao_tri`
loại thay đổi (Change).

- `tickets`: thêm `thiet_bi_id`, `he_thong_id`, `su_co_id`, `sla_han`,
  `first_response_at` — tính & theo dõi SLA phản hồi.
- `su_co`: thêm `van_de_id`, `ticket_id` — liên kết ngược lên ticket & vấn đề.
- `van_de` (mới): `ma_van_de`, `nguyen_nhan_goc`, `bien_phap_khac_phuc`,
  `trang_thai`, `muc_do`; khoá phạm vi qua `don_vi_id_snapshot`.
- `cong_viec_bao_tri`: thêm `van_de_id`, `su_co_id`, `can_phe_duyet`,
  `trang_thai_phe_duyet`, `nguoi_phe_duyet`, `phe_duyet_at`, `ke_hoach_rollback`
  — phiếu thay đổi có phê duyệt & kế hoạch hoàn tác.

View `v_van_de` gộp vấn đề kèm liên kết sự cố/phiếu công việc.

UI: `/van-de` — quản lý RCA, liên kết chéo sang Sự cố & Phiếu công việc.
