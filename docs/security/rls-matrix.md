# RLS Matrix — MIRATS 2.0 (Task 33)

Nguồn sự thật: `pg_policies` + `pg_class.relrowsecurity` (dump ngày cập nhật task 33).

## Tổng quan

- **95/95** bảng public đã `ENABLE ROW LEVEL SECURITY`.
- **0** policy cấp cho vai trò `anon` — Data API từ chối truy cập ẩn danh vào toàn bộ dữ liệu nội bộ.
- Mọi policy `authenticated` đi qua các security-definer helper:
  - `has_role(uid, app_role)` — kiểm tra vai trò (`admin`, `phong_kt`, `phu_trach_dv`, `ktv`, `khach`).
  - `can_manage_equipment(uid)` — `admin` hoặc `phong_kt`.
  - `get_user_don_vi_id(uid)` — đơn vị (unit) người dùng đang thuộc.
  - `is_conv_participant(conv_id, uid)` — thành viên cuộc hội thoại.
- Không có UPDATE policy nào để `USING` là `true`. Sáu UPDATE policy trước đây không khai báo `WITH CHECK` tường minh (Postgres mặc định lặp lại `USING`) đã được vá trong migration `rls_hoan_thien` để chặn "update-and-move-row".

## Ma trận thao tác theo cụm bảng × vai trò

Ký hiệu: `A`=admin, `PKT`=phong_kt, `PT`=phu_trach_dv (theo đơn vị), `KTV`=ktv (theo đơn vị), `U`=chủ dòng (`auth.uid()`), `—`=từ chối.

### Cụm tài sản & vận hành (đã kiểm định ở `rls_cross_unit.sql`)

| Bảng                                             | SELECT                                  | INSERT                | UPDATE                               | DELETE |
| ------------------------------------------------ | --------------------------------------- | --------------------- | ------------------------------------ | ------ |
| `thiet_bi`                                       | A/PKT: all; PT/KTV: theo đơn vị         | A/PKT                 | A/PKT                                | A      |
| `su_co`                                          | A/PKT: all; PT/KTV: theo đơn vị tài sản | A/PKT/PT/KTV (đơn vị) | A/PKT + người tạo                    | A/PKT  |
| `bao_tri`, `cong_viec_bao_tri`, `hong_hoc`       | như `su_co`                             | như `su_co`           | như `su_co`                          | A/PKT  |
| `ban_giao`, `kiem_ke`                            | như `su_co`                             | A/PKT/PT/KTV          | A/PKT                                | A      |
| `kho`, `kho_giao_dich`                           | như `su_co` (theo đơn vị kho)           | A/PKT                 | A/PKT                                | A      |
| `vat_tu`                                         | authenticated                           | A/PKT                 | A/PKT                                | A      |
| `thiet_bi_*` (media/kết nối/khe/vòng đời/đo đạc) | như `thiet_bi`                          | A/PKT                 | A/PKT + chủ dòng nếu có `created_by` | A/PKT  |

### Cụm danh mục (`dm_*`)

| Bảng                                                                                                                                                                                                                                                                                    | SELECT        | INSERT/UPDATE/DELETE |
| --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------- | -------------------- |
| `dm_don_vi`, `dm_he_thong`, `dm_linh_vuc`, `dm_loai_giay_phep`, `dm_loai_lien_ket`, `dm_loai_thiet_bi`, `dm_model`, `dm_nha_cung_cap`, `dm_nha_san_xuat`, `dm_nhom_he_thong`, `dm_noi_cap`, `dm_phan_loai`, `dm_to_chuc`, `dm_trang_thai_thiet_bi`, `dm_vi_tri`, `dm_danh_gia_nien_han` | authenticated | A/PKT                |

### Cụm form (mẫu bảo dưỡng)

| Bảng                                                                                                                                                                                          | SELECT                                  | Ghi                              |
| --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------- | -------------------------------- |
| `form_template`, `form_template_version`, `form_template_include`, `form_template_he_thong`, `form_section`, `form_field`, `form_check_item`, `field_set`, `field_set_item`, `model_tai_lieu` | authenticated                           | A/PKT                            |
| `form_submission`, `form_submission_item_result`, `form_submission_thiet_bi`                                                                                                                  | A/PKT: all; PT/KTV: theo đơn vị tài sản | A/PKT/PT/KTV (đơn vị) + chủ dòng |

### Cụm giấy phép & liên kết

| Bảng                                                                                                                                                | SELECT        | Ghi              |
| --------------------------------------------------------------------------------------------------------------------------------------------------- | ------------- | ---------------- |
| `giay_phep`, `giay_phep_khai_thac`, `he_thong_thanh_phan`, `he_thong_truong`, `lien_ket_he_thong`, `lien_ket_khe`, `gan_chuc_nang`, `gan_linh_kien` | authenticated | A/PKT            |
| `canh_bao_het_han_log`                                                                                                                              | A/PKT         | System (trigger) |

### Cụm dự án & phối hợp

| Bảng                                                                | SELECT                         | Ghi                 |
| ------------------------------------------------------------------- | ------------------------------ | ------------------- |
| `du_an`, `du_an_moc`, `du_an_cong_viec`, `du_an_cong_viec_phoi_hop` | A/PKT + participant            | Chủ dự án + A/PKT   |
| `tickets`, `ticket_comment`                                         | A/PKT + created_by/assigned_to | Chủ + A             |
| `conversations`, `conversation_participant`, `messages`             | participant                    | participant         |
| `notifications`                                                     | U                              | U (đánh dấu đã đọc) |

### Cụm sơ đồ & node

| Bảng                                                                                                                        | SELECT        | Ghi              |
| --------------------------------------------------------------------------------------------------------------------------- | ------------- | ---------------- |
| `so_do_he_thong`, `so_do_tep_dinh_kem`, `so_do_thu_vien_hinh`, `cay_node_edit`, `cay_thay_doi`, `node_note`, `vi_tri_media` | authenticated | A/PKT + chủ dòng |

### Cụm hệ thống / bảo mật / cấu hình

| Bảng                                                                  | SELECT            | Ghi                 |
| --------------------------------------------------------------------- | ----------------- | ------------------- |
| `profiles`                                                            | U + A/PKT         | U + A               |
| `user_roles`, `user_scope`, `role_permission`                         | authenticated     | A                   |
| `nhan_vien`                                                           | authenticated     | A/PKT               |
| `app_cai_dat`, `bang_cot_tuy_chinh`                                   | authenticated     | A + U               |
| `ai_config`, `ai_conversation`, `ai_message`                          | U                 | U                   |
| `access_request`                                                      | U + A             | U (tạo) + A (duyệt) |
| `audit_log`, `auth_event_log`, `feature_usage_log`, `telegram_da_gui` | A                 | System              |
| `backup_lich_su`                                                      | A                 | A                   |
| `import_batch`, `import_item`, `import_alias`                         | A/PKT + chủ batch | A/PKT + chủ batch   |
| `telegram_subscriber`                                                 | U + A             | U + A               |
| `webauthn_credentials`                                                | U                 | U                   |
| `anomaly_alert`, `bao_tri_chinh_sach`                                 | A/PKT             | A/PKT               |
| `van_de`                                                              | A/PKT + đơn vị    | A/PKT               |

## Nguyên tắc chuẩn hoá (áp dụng ở migration `rls_hoan_thien`)

1. **Deny by default**: mọi bảng public bật RLS, không có policy `TO anon` cho dữ liệu nội bộ.
2. **UPDATE luôn có `WITH CHECK` tường minh** — chặn user update một dòng thuộc phạm vi họ rồi "đẩy" khoá ngoại (unit, owner) sang phạm vi khác.
3. **SELECT rộng chỉ dành cho bảng danh mục / bảng cấu hình dùng chung** (`dm_*`, `form_*`, `nhan_vien`, `role_permission`, ...). Bảng nghiệp vụ luôn scope theo `get_user_don_vi_id` hoặc `has_role`.
4. **Write privileges chỉ dành cho `admin` / `phong_kt`** trên danh mục & cấu hình; **ktv chỉ ghi được record nghiệp vụ trong đơn vị** (`su_co`, `bao_tri`, `hong_hoc`, `ban_giao`, `kiem_ke`, `form_submission`).
5. **`ma_thiet_bi` immutable** — được cưỡng chế bằng trigger, không phụ thuộc RLS (Task 18).

## Kiểm định

- `supabase/tests/rls_cross_unit.sql` — 7 persona × các bảng scoped-by-unit.
- `supabase/tests/rls_hoan_thien.sql` (Task 33) — kiểm tra:
  - Mọi bảng public có `relrowsecurity = true`.
  - Không có policy `TO anon` trên bảng nội bộ.
  - Mọi UPDATE policy có `with_check IS NOT NULL`.
  - Không có policy có `qual = 'true'` trên các bảng nghiệp vụ scoped-by-unit.

Chạy: `psql -f supabase/tests/rls_hoan_thien.sql` — script raises exception nếu bất kỳ điều kiện nào fail.
