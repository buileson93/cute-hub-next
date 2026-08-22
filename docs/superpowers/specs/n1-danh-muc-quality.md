# N1 — Chất lượng & Chống trùng Danh mục `dm_*`

> **Trạng thái**: SPEC — chờ phê duyệt. Không code cho tới khi được duyệt. Kế thừa SSoT tại `docs/superpowers/specs/mirats-edit-ssot-design.md`.

## 1. Phạm vi

Áp dụng cho các bảng danh mục:

| Bảng                     | Khoá nghiệp vụ đề xuất           | Ghi chú                |
| ------------------------ | -------------------------------- | ---------------------- |
| `dm_don_vi`              | `ma` (unique, viết hoa)          | Tổ chức/đơn vị quản lý |
| `dm_vi_tri`              | `(don_vi_id, ma)`                | Vị trí thuộc đơn vị    |
| `dm_loai_thiet_bi`       | `ma`                             | Loại tài sản           |
| `dm_nha_san_xuat`        | `normalizeName(ten)`             | Không có mã bắt buộc   |
| `dm_nha_cung_cap`        | `normalizeName(ten)`             | Không có mã bắt buộc   |
| `dm_model`               | `(nha_san_xuat_id, part_number)` | P/N là khoá phụ chính  |
| `dm_nhom_he_thong`       | `(don_vi_id, ma)`                | Nhóm hệ thống          |
| `dm_he_thong`            | `(nhom_he_thong_id, ma)`         | Hệ thống               |
| `dm_phan_loai`           | `ma`                             | Phân loại chung        |
| `dm_dac_tinh`            | `ma`                             | Đặc tính kỹ thuật      |
| `dm_noi_cap`             | `normalizeName(ten)`             | Nơi cấp giấy phép      |
| `dm_loai_giay_phep`      | `ma`                             | Loại giấy phép         |
| `dm_loai_lien_ket`       | `ma`                             | Loại liên kết hệ thống |
| `dm_trang_thai_thiet_bi` | `ma`                             | Trạng thái tài sản     |
| `dm_danh_gia_nien_han`   | `ma`                             | Đánh giá niên hạn      |
| `dm_to_chuc`             | `normalizeName(ten)`             | Đối tác                |

## 2. Chuẩn hoá tên — `normalizeName(input: string): string`

Thứ tự thao tác (idempotent):

1. `String(input ?? "")`.
2. Unicode NFD → strip `\p{Diacritic}` (bỏ dấu tiếng Việt).
3. Thay `đ`/`Đ` → `d` (NFD không tách chữ đ).
4. `toLowerCase()` (sau khi bỏ dấu để đơn giản).
5. Thay mọi `[^a-z0-9]+` (bao gồm khoảng trắng, gạch, dấu chấm, ngoặc) → `" "`.
6. `trim()` + gộp khoảng trắng liên tiếp → 1 space.

Ví dụ:

- `" Hệ  thống VHF (118.8 MHz) "` → `"he thong vhf 118 8 mhz"`.
- `"Đài Kiểm Soát"` → `"dai kiem soat"`.
- `"AWOS-II"` → `"awos ii"`.

**Không** tự động cắt stop-words; giữ số nguyên vẹn để không hợp nhất "VHF 118" với "VHF 119".

## 3. Ngưỡng "trùng gần đúng"

Hàm `findNearDuplicates(list, name, opts?) → Array<{ id, ten, score, reason }>` xét theo thứ tự dừng sớm:

| Reason             | Điều kiện                                                           | Score  |
| ------------------ | ------------------------------------------------------------------- | ------ |
| `exact-normalized` | `normalizeName(a) === normalizeName(b)`                             | `1.00` |
| `contains`         | một bên chứa bên kia sau normalize, độ dài min ≥ 4                  | `0.95` |
| `levenshtein`      | `1 - dist / max(len)` ≥ `threshold` (mặc định `0.86`) và `dist ≤ 3` | tỉ lệ  |

Trả về top **N=5** sắp xếp score giảm dần. Bỏ qua bản ghi `active = false` trừ khi `opts.includeInactive = true`. Với `dm_model`, chỉ so trong cùng `nha_san_xuat_id` (khi có).

**UX**: cảnh báo mềm — hiển thị danh sách nghi trùng và nút `Vẫn tạo mới` (ghi lý do vào `audit_log.metadata.override_reason`). Không chặn cứng.

## 4. Trường bắt buộc theo bảng — `validateRequired(record, schema)`

Schema dạng `{ field: { required: boolean; label: string; type?: 'string'|'uuid'|'number' } }`. Chỉ bắt tối thiểu, để RLS/DB constraint làm chốt cuối.

| Bảng                     | Trường bắt buộc                              |
| ------------------------ | -------------------------------------------- |
| `dm_don_vi`              | `ma`, `ten`                                  |
| `dm_vi_tri`              | `ma`, `ten`, `don_vi_id`                     |
| `dm_loai_thiet_bi`       | `ma`, `ten`                                  |
| `dm_nha_san_xuat`        | `ten`                                        |
| `dm_nha_cung_cap`        | `ten`                                        |
| `dm_model`               | `ten`, `nha_san_xuat_id`, `loai_thiet_bi_id` |
| `dm_nhom_he_thong`       | `ma`, `ten`, `don_vi_id`                     |
| `dm_he_thong`            | `ma`, `ten`, `nhom_he_thong_id`, `don_vi_id` |
| `dm_phan_loai`           | `ma`, `ten`                                  |
| `dm_dac_tinh`            | `ma`, `ten`                                  |
| `dm_noi_cap`             | `ten`                                        |
| `dm_loai_giay_phep`      | `ma`, `ten`                                  |
| `dm_loai_lien_ket`       | `ma`, `ten`                                  |
| `dm_trang_thai_thiet_bi` | `ma`, `ten`                                  |
| `dm_danh_gia_nien_han`   | `ma`, `ten`                                  |
| `dm_to_chuc`             | `ten`                                        |

`validateRequired` trả `{ ok: boolean; missing: Array<{ field, label }> }`. Form chặn Submit khi `ok=false`.

## 5. Luật gộp bản ghi trùng (Merge)

**Chữ ký**: `mergeDanhMuc(entity, keepId, dropId, actor) → MergeReport`.

**Điều kiện tiên quyết**:

- `entity` thuộc whitelist danh mục (§1); `keepId ≠ dropId`; cả hai `active` được phép.
- Chỉ `admin` / `phong_kt` (kiểm tra qua RLS + `has_role`).
- Cùng phạm vi cha khi có: `dm_vi_tri` cùng `don_vi_id`; `dm_he_thong` cùng `nhom_he_thong_id`; `dm_model` cùng `nha_san_xuat_id`. Nếu khác — cảnh báo và yêu cầu xác nhận.

**Thao tác (transaction)**:

1. Với mỗi bảng tham chiếu (danh sách khai báo trong `MERGE_REF_MAP`), `UPDATE ref_table SET fk = keepId WHERE fk = dropId`.
2. `UPDATE dm_entity SET active = false, merged_into = keepId, deactivated_at = now() WHERE id = dropId`.
3. Ghi `audit_log` (action = `merge_danh_muc`, entity, keepId, dropId, số dòng cập nhật mỗi bảng, actor, `undo_token`).
4. Không hard-delete. Không cascade sang bảng lịch sử.

**Undo** (trong 24h, cùng actor hoặc admin):

1. Với snapshot dòng đã đổi trong bước 1 (lưu vào `audit_log.metadata.reassigned_rows`), `UPDATE` ngược `fk = dropId`.
2. `UPDATE dm_entity SET active = true, merged_into = NULL, deactivated_at = NULL WHERE id = dropId`.
3. Ghi audit `undo_merge_danh_muc`.

**Cột schema cần thêm** (migration N1-schema, triển khai sau khi spec duyệt):

- `merged_into UUID NULL REFERENCES dm_<entity>(id)`
- `deactivated_at TIMESTAMPTZ NULL`
- Index partial `WHERE active = true` trên khoá nghiệp vụ để chống trùng ở tầng DB (không unique cứng để tránh phá dữ liệu cũ).

## 6. Bảng tham chiếu (MERGE_REF_MAP — trích lược)

| Entity             | Bảng tham chiếu · cột FK                                                                                                     |
| ------------------ | ---------------------------------------------------------------------------------------------------------------------------- |
| `dm_don_vi`        | `dm_vi_tri.don_vi_id`, `dm_he_thong.don_vi_id`, `dm_nhom_he_thong.don_vi_id`, `nhan_vien.don_vi_id`, `user_scope.don_vi_id`  |
| `dm_vi_tri`        | `thiet_bi.vi_tri_id`, `he_thong_thanh_phan.vi_tri_id`                                                                        |
| `dm_loai_thiet_bi` | `thiet_bi.loai_thiet_bi_id`, `dm_model.loai_thiet_bi_id`                                                                     |
| `dm_nha_san_xuat`  | `dm_model.nha_san_xuat_id`, `thiet_bi.nha_san_xuat_id`                                                                       |
| `dm_nha_cung_cap`  | `thiet_bi.nha_cung_cap_id`                                                                                                   |
| `dm_model`         | `thiet_bi.model_id`, `dm_model_dac_tinh.model_id`, `model_tai_lieu.model_id`                                                 |
| `dm_nhom_he_thong` | `dm_he_thong.nhom_he_thong_id`                                                                                               |
| `dm_he_thong`      | `he_thong_thanh_phan.he_thong_id`, `lien_ket_he_thong.he_thong_a_id`, `.he_thong_b_id`, `form_template_he_thong.he_thong_id` |
| `dm_phan_loai`     | `dm_he_thong.phan_loai_id`, `dm_nhom_he_thong.phan_loai_id`                                                                  |
| `dm_dac_tinh`      | `dm_model_dac_tinh.dac_tinh_id`                                                                                              |

_Danh sách đầy đủ sẽ được sinh từ `information_schema.key_column_usage` trong quá trình cài đặt và commit vào `src/lib/mirats/danh-muc-quality.ts`._

## 7. Kiểm thử — Definition of Done

**Unit** (`src/lib/mirats/__tests__/danh-muc-quality.test.ts`):

- `normalizeName`: bỏ dấu, `đ→d`, ký tự đặc biệt, idempotent, chuỗi rỗng/null.
- `findNearDuplicates`: exact-normalized, contains, levenshtein trên/dưới ngưỡng, tôn trọng `active=false`, scope theo `nha_san_xuat_id`.
- `validateRequired`: đủ / thiếu / trường rỗng / uuid không hợp lệ.
- `MERGE_REF_MAP` khai báo phi rỗng cho mọi entity trong §1.

**Integration UI** (mở rộng `danh-muc-refs.test.ts` hoặc file mới): form catalog gọi cảnh báo & chặn thiếu required.

**pgTAP** (`supabase/tests/danh_muc_merge_no_orphan.sql`):

1. Seed 2 bản ghi `dm_nha_san_xuat` + 3 `dm_model` trỏ tới `dropId`.
2. Gọi `merge_danh_muc('dm_nha_san_xuat', keepId, dropId)`.
3. Assert: `SELECT count(*) FROM dm_model WHERE nha_san_xuat_id = dropId` = 0.
4. Assert: `SELECT active, merged_into FROM dm_nha_san_xuat WHERE id = dropId` → `(false, keepId)`.
5. Assert: `audit_log` có 1 dòng `merge_danh_muc`.
6. Undo: assert reversibility.

**Regression**: toàn bộ test hiện có xanh (`taxonomy-invariant`, `rls_cross_unit`, `danh-muc-refs`, `cay-delete`, `he-thong-thanh-phan`, `rename-entity`, `so-ly-lich-*`, `nav-contract`).

## 8. Rủi ro & giảm thiểu

| Rủi ro                                           | Giảm thiểu                                                                             |
| ------------------------------------------------ | -------------------------------------------------------------------------------------- |
| Bỏ dấu gây gộp nhầm (ví dụ `số 1` vs `so 1`)     | Chỉ dùng để tìm gần đúng; luôn hiện danh sách để user xác nhận, không auto-merge       |
| Merge cross-scope (khác đơn vị/nhóm)             | Cần confirmation kép + ghi lý do vào audit                                             |
| Undo sau nhiều thay đổi mới                      | Giới hạn 24h; nếu phát hiện dòng đã đổi tiếp thì cảnh báo và cho phép admin force      |
| Trigger cascade từ `dm_model` (đã có) chạy 2 lần | Merge dùng UPDATE ...WHERE fk=dropId; trigger propagate model cũ hoạt động bình thường |
| RLS chặn UPDATE ở một số bảng tham chiếu         | RPC `merge_danh_muc` chạy `SECURITY DEFINER` sau khi kiểm tra role                     |

## 9. Câu hỏi làm rõ

1. Ngưỡng Levenshtein mặc định **0.86** có phù hợp không, hay muốn chặt hơn (0.90) / lỏng hơn (0.80)?
2. `dm_nha_san_xuat` / `dm_nha_cung_cap` hiện KHÔNG có cột `ma` — có muốn thêm `ma` optional để chuẩn hoá không, hay tiếp tục dùng `ten` normalize?
3. Cho phép user thường (`kt_vien`) chạy Merge không, hay chỉ `admin`/`phong_kt` (mặc định trong spec)?
4. Cửa sổ Undo 24h ổn không, hay cần dài hơn (7 ngày)?
5. Có cần index unique **partial** (`WHERE active = true`) trên khoá nghiệp vụ để ép DB chống trùng ở tầng cuối, hay chỉ cảnh báo ở app-layer?
6. Có cần audit riêng cho hành động `Vẫn tạo mới` (override) hay ghi chung vào `audit_log.metadata`?

---

**Dừng — chờ duyệt spec + trả lời câu hỏi trước khi sang BƯỚC 2 (TDD).**
