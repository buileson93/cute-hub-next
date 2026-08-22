# N10 — Nhập hàng loạt an toàn + Xuất báo cáo (SPEC)

Trạng thái: DRAFT — chờ duyệt trước khi TDD.
Ngữ cảnh: repo đã có nền tảng `import-engine.ts`, `import-config.ts`, `import_batch`, `import_item`, `import_alias`, và trang `_app.nhap-lieu.tsx` + `_app.admin.nhap-lieu.tsx`. N10 củng cố quy tắc (schema, ánh xạ, lỗi/cảnh báo, xác nhận, undo) và bổ sung xuất Excel/PDF.

## 1. Phạm vi & loại dữ liệu hỗ trợ

Mỗi loại nhập tương ứng một **schema** cố định trong `import-config.ts`:

| Mã schema                                                                                              | Bảng đích            | Ghi chú                                       |
| ------------------------------------------------------------------------------------------------------ | -------------------- | --------------------------------------------- |
| `thiet_bi`                                                                                             | `thiet_bi`           | Có ánh xạ Model/Đơn vị/Vị trí/Loại/Trạng thái |
| `dm_model`                                                                                             | `dm_model`           | Kèm `nha_san_xuat_ten`, `loai_thiet_bi_ma`    |
| `dm_don_vi` / `dm_vi_tri` / `dm_he_thong` / `dm_loai_thiet_bi` / `dm_nha_san_xuat` / `dm_nha_cung_cap` | tương ứng            | Có scope cha (đơn vị/nhóm)                    |
| `chung_chi_thiet_bi`                                                                                   | `chung_chi_thiet_bi` | Cần tra `thiet_bi` qua `ma`                   |
| `ton_kho_dau_ky`                                                                                       | `kho_giao_dich`      | Import số dư đầu kỳ                           |
| `vat_tu`                                                                                               | `vat_tu`             | Danh mục vật tư                               |
| `bao_tri_lich_su` (mới)                                                                                | `bao_tri`            | Bảo trì đã thực hiện trước khi lên hệ thống   |

Định dạng file: **`.xlsx`** (mặc định) và **`.csv`** (UTF-8, phân tách `,`, quote `"`). Kích thước tối đa 20MB / ≤ 50 000 dòng/lô. File > ngưỡng ⇒ yêu cầu chia lô, không stream ngầm.

## 2. Ánh xạ cột (Column mapping)

Mỗi schema khai báo danh sách trường: `{ key, label, required, type, alias[], enum?, ref? }`. UI mapping:

1. Đọc header hàng 1; hiển thị bảng "Cột file → Trường hệ thống".
2. Auto-map ưu tiên: (1) khớp `key` chính xác → (2) khớp bất kỳ `alias[]` (đã chuẩn hoá bỏ dấu/lowercase, hàm `normalizeName` từ N1) → (3) fuzzy (Levenshtein ≥ 0.86).
3. User có thể override; lưu **preset mapping** theo `schema` và `file_signature` (hash 8 header đầu) để lần sau tự chọn.
4. Cột không map ⇒ bị bỏ qua (không lỗi), nhưng cột **bắt buộc chưa map** ⇒ chặn Preview.

## 3. Kiểu dữ liệu & Coercion

- `text`: trim, giới hạn 500 (mặc định) / theo schema.
- `int`, `numeric`: chấp nhận dấu `.` hoặc `,` (VN); loại bỏ khoảng trắng; empty ⇒ `null` nếu cột không required.
- `date`: chấp nhận `YYYY-MM-DD`, `DD/MM/YYYY`, `DD-MM-YYYY`; TZ Asia/Ho_Chi_Minh; empty ⇒ `null`.
- `bool`: `true|false|1|0|có|không|x` (case-insensitive).
- `enum`: giá trị phải ∈ danh sách; case-insensitive match nhưng lưu giá trị canonical.
- `uuid`: kiểm tra định dạng.

Chuẩn hoá tên (`normalizeName`) chỉ dùng cho **so khớp** (alias, ref), không dùng cho **giá trị lưu**.

## 4. Tham chiếu danh mục (`ref`)

Trường `ref` khai báo bảng danh mục + cột khoá:

```ts
ref: { table: 'dm_model', by: 'ten', scope?: { col: 'nha_san_xuat_id', from: 'nha_san_xuat_ten' } }
```

Quy tắc:

- Chỉ map **tên → id** khi khớp trong `dm_*` sau chuẩn hoá (`normalizeName`).
- Không tạo bản ghi danh mục mới **trong luồng import** (chống rác). Người dùng phải:
  1. Sửa file cho khớp, hoặc
  2. Tạo alias qua `import_alias` (bảng đã có) — 1 lần bấm "Tạo alias 'X' → dm_model 'Y'".
- Nếu tra nhiều kết quả (ambiguous), báo lỗi kèm gợi ý (top 3) — không đoán.
- Có scope cha thì phải lọc trong scope (ví dụ Model X thuộc nhà sản xuất Y).

## 5. Loại lỗi / cảnh báo

Mỗi dòng tạo ra một `ImportItemResult` với danh sách issue:

| Mã                           | Mức                                                 | Ví dụ                                      |
| ---------------------------- | --------------------------------------------------- | ------------------------------------------ |
| `MISSING_REQUIRED`           | error                                               | Trường bắt buộc trống                      |
| `TYPE_MISMATCH`              | error                                               | "abc" ở cột số                             |
| `ENUM_INVALID`               | error                                               | Trạng thái "xyz" không có trong enum       |
| `REF_NOT_FOUND`              | error                                               | Model "SU-27B/M2" không có trong danh mục  |
| `REF_AMBIGUOUS`              | error                                               | Khớp 2+ bản ghi                            |
| `DUPLICATE_IN_FILE`          | error                                               | Cùng `ma` xuất hiện nhiều dòng trong file  |
| `DUPLICATE_IN_DB`            | warning (mặc định) hoặc error (nếu `unique_strict`) | `ma` đã có trong DB                        |
| `SCOPE_MISMATCH`             | error                                               | Model không thuộc nhà sản xuất đã chỉ định |
| `RANGE_INVALID`              | error                                               | `ngay_het_han < ngay_cap`                  |
| `LENGTH_EXCEEDED`            | warning                                             | Vượt max length → sẽ cắt khi ghi           |
| `INHERITED_OVERRIDE_IGNORED` | warning                                             | Trường kế thừa từ Model bị bỏ qua          |
| `ALIAS_APPLIED`              | info                                                | Áp dụng alias `X → Y`                      |

Rule: **có ≥ 1 error trên dòng** ⇒ dòng đó bị loại; **có ≥ 1 error trong file & user không tick "bỏ qua dòng lỗi"** ⇒ chặn ghi cả lô.

## 6. Luồng an toàn (safe apply)

```
Upload → Parse & Map cột → Validate (bảng preview) → Xác nhận → Apply theo lô → Kết quả + Undo
```

1. **Upload** vào bảng `import_batch` (`trang_thai='parsing'`).
2. **Parse** ghi từng dòng thô vào `import_item` (`raw jsonb`, `line_no`).
3. **Validate** chạy `validateImport(rows, schema)` → cập nhật `import_item.issues jsonb[]`, tổng hợp `import_batch.stats` (`total`, `errors`, `warnings`, `ready`).
4. **Preview UI**: bảng có filter theo mức (all/error/warning/ok), sửa nhanh tại chỗ cho lỗi đơn giản (edit cell → re-validate dòng đó), tạo alias inline.
5. **Xác nhận** cần vai trò `admin` hoặc `phong_kt`; nút "Ghi vào hệ thống" hiển thị tóm tắt `X ghi mới / Y cập nhật / Z bỏ qua`.
6. **Apply** trong transaction bằng RPC `import_apply_batch(p_batch_id uuid)`:
   - Ghi/cập nhật bản ghi đích theo `on_conflict` khai báo (mặc định `ma`).
   - Ghi `audit_log` mỗi thay đổi với `nguon='import'`, `batch_id`.
   - Cập nhật `import_batch.trang_thai='applied'`, ghi `applied_at`, `applied_by`.
7. **Undo cả lô**: RPC `import_undo_batch(p_batch_id uuid)` trong 24h (cấu hình `import.undo_window_h`, mặc định 24). Undo dùng `audit_log` để rollback từng bản ghi:
   - `insert` ⇒ soft delete (không xoá cứng nếu đã có FK phụ thuộc; báo lỗi "không thể undo dòng N do có <n> tham chiếu, cần Change Request").
   - `update` ⇒ khôi phục `gia_tri_cu`.
     Sau undo ⇒ `import_batch.trang_thai='undone'`, ghi `undone_at`, `undone_by`.

Không có "auto-apply". Luôn cần bước xác nhận rõ ràng.

## 7. Phân quyền

- Upload/Preview: `phong_kt`, `admin`.
- Apply/Undo: `admin`, hoặc `phong_kt` **trong phạm vi đơn vị** (RLS chốt cuối; RPC dùng `SECURITY INVOKER`).
- Xem lịch sử lô: mọi vai trò được xem lô thuộc đơn vị mình; admin xem tất cả.

## 8. Xuất báo cáo

### 8.1 Xuất Excel (theo bảng đang lọc)

- Nút "Xuất Excel" trên mọi `StandardTable`.
- Payload = **bộ lọc + sắp xếp + cột đang hiển thị** (không xuất cột ẩn).
- Chạy phía server (`export_table` server fn) để không giới hạn bởi bộ nhớ browser; giới hạn 100 000 dòng/lô. > ngưỡng ⇒ báo chia lô.
- Định dạng: `.xlsx`, sheet đầu = dữ liệu, sheet 2 = metadata (bộ lọc, người xuất, thời điểm).
- File lưu ở Storage bucket `exports/` (private), TTL 7 ngày; trả link tải có ký.

### 8.2 Xuất PDF báo cáo (tài sản / lý lịch)

Loại báo cáo (giai đoạn N10):

1. **Lý lịch thiết bị** — 1 tài sản, gồm thông tin cơ bản, lịch sử lắp/tháo, sự cố, bảo trì, chứng chỉ, chữ ký/QR.
2. **Danh sách tài sản theo đơn vị/hệ thống** — bảng kèm tổng hợp và biểu đồ trạng thái.
3. **Tổng quan độ tin cậy (N9)** — MTBF/MTTR/Availability theo scope + top kém tin cậy.

Kỹ thuật: render server-side dùng thư viện PDF hiện có trong repo hoặc `@react-pdf/renderer` (thêm nếu chưa có; xác nhận ở câu hỏi #6). Trang: A4, có header (logo VATM), footer (số trang, người xuất, thời điểm), tiếng Việt đầy đủ dấu (font Unicode).

### 8.3 Template import

Nút "Tải template" cạnh nút "Nhập" mỗi trang: sinh `.xlsx` với header đúng schema + hàng ví dụ + sheet "Hướng dẫn".

## 9. Test kế hoạch (BƯỚC 2)

`src/lib/mirats/__tests__/import-validate.test.ts` bao phủ:

1. `validateImport` phát hiện đủ 10 mã lỗi ở §5 với fixture cố định.
2. `mapReferences` map tên → id đúng khi có alias, báo `REF_AMBIGUOUS` khi 2 khớp, `REF_NOT_FOUND` khi không có.
3. `SCOPE_MISMATCH`: Model X thuộc NSX A, dòng chỉ định NSX B ⇒ error.
4. `DUPLICATE_IN_FILE`: 2 dòng cùng `ma` → cả 2 đánh dấu, không phải chỉ dòng thứ 2.
5. Coercion: các dạng ngày/số VN chuyển đúng; empty → null cho cột optional.
6. `INHERITED_OVERRIDE_IGNORED`: nếu file gửi trường kế thừa Model, sinh warning và **không** ghi field đó.
7. Line no báo cáo khớp Excel (header ở dòng 1 ⇒ dữ liệu bắt đầu dòng 2).

Giữ nguyên test hiện có (`import-mappers.test.ts`, v.v.). Test mới không đụng DB — validate là pure function trên fixture.

## 10. Bất biến & ràng buộc

- **Không tạo danh mục mới trong luồng import** (chỉ qua alias hoặc trang Danh mục).
- **Không xoá cứng** khi undo; dùng soft delete + `dm_xoa_an_toan`.
- **Reference luôn Combobox** khi sửa inline trong preview (không cho tự do gõ id).
- **Trường kế thừa Model**: read-only ⇒ luôn bỏ qua giá trị trong file cho các cột này.
- **Audit log** cho mỗi thay đổi ghi bởi apply/undo (`nguon`, `batch_id`, `line_no`).
- **RLS** áp dụng cả trong RPC apply/undo (`SECURITY INVOKER`).
- **Không tự sinh migration** trong N10 nếu không cần cột mới; đánh giá lại khi TDD.

## 11. Câu hỏi làm rõ

1. **Ngưỡng file**: 50 000 dòng/lô có phù hợp không? Có project nào cần lớn hơn?
2. **Undo window**: 24h đủ? Có muốn admin có thể undo vô thời hạn?
3. **`DUPLICATE_IN_DB`**: mặc định là warning (cập nhật) hay error (yêu cầu người dùng chủ đích)?
4. **Alias**: cho `phong_kt` tạo alias, hay chỉ admin?
5. **Xuất Excel**: chạy server hay để browser với giới hạn 20 000 dòng? (đề xuất server)
6. **PDF library**: dùng `@react-pdf/renderer` (mới) hay công cụ hiện có trong repo? Có ràng buộc font Unicode nào không?
7. **Bucket `exports/`**: đặt TTL 7 ngày hay giữ mãi (để trace)?
8. **Import `bao_tri_lich_su`** có cần thiết ở giai đoạn N10 hay để sau?
9. **Preset mapping**: lưu theo user hay theo đơn vị (dùng chung)?

Chờ duyệt spec + trả lời câu hỏi trước khi sang BƯỚC 2 (test + code + UI + export).
