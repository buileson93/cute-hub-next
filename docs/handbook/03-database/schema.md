# 03 — Database: Schema tổng quan

**113 bảng** trong schema `public`, tất cả đều **RLS enabled**. DB Postgres 17 trên Lovable Cloud.

## Nhóm bảng theo miền

### Danh mục (Master data — N1)
`dm_dac_tinh`, `dm_danh_gia_nien_han`, `dm_don_vi`, `dm_he_thong`, `dm_loai_giay_phep`, `dm_loai_lien_ket`, `dm_loai_thiet_bi`, `dm_model`, `dm_model_dac_tinh`, `dm_nha_cung_cap`, `dm_nha_san_xuat`, `dm_nhom_he_thong`, `dm_noi_cap`, `dm_phan_loai`, `dm_to_chuc`, `dm_trang_thai_thiet_bi`, `dm_vi_tri`, `dinh_nghia_truong`, `he_thong_truong`, `nhan_vien`.

### Tài sản & hệ thống (Assets)
`thiet_bi` (69 cột — core), `thiet_bi_cap_phat`, `thiet_bi_do_dac`, `thiet_bi_ket_noi`, `thiet_bi_khe_linh_kien`, `thiet_bi_tep_dinh_kem`, `thiet_bi_vong_doi`, `he_thong_thanh_phan`, `gan_chuc_nang` (mount tài sản↔thành phần, **KHÔNG unique 1-1**), `gan_linh_kien`, `chung_chi_thiet_bi`, `model_tai_lieu`, `lien_ket_he_thong`, `lien_ket_khe`, `so_do_he_thong`, `so_do_tep_dinh_kem`, `so_do_thu_vien_hinh`, `vi_tri_media`, `cay_node_edit`, `cay_thay_doi`.

### Vận hành (Operations)
- Sự cố: `su_co` (44 cột), `su_co_lich_su` (N6 FSM).
- Hỏng hóc: `hong_hoc` (40 cột).
- Bảo trì: `bao_tri`, `bao_tri_chinh_sach`, `pm_cong_viec`, `cong_viec_bao_tri`.
- Bàn giao: `ban_giao`.
- Kiểm kê / kiểm định: `kiem_ke`, `giay_phep`, `giay_phep_khai_thac`.
- Kho / vật tư: `kho`, `kho_giao_dich`, `vat_tu`.
- Vấn đề: `van_de`.
- Cảnh báo hết hạn (N5): `canh_bao_het_han_log`.

### Forms (Form Designer 2.0)
`form_template`, `form_template_version`, `form_template_he_thong`, `form_template_include`, `form_section`, `form_field`, `form_check_item`, `field_set`, `field_set_item`, `form_submission`, `form_submission_item_result`, `form_submission_signature`, `form_submission_thiet_bi`, `form_sign_otp`, `system_signing_key`.

### RBAC & user
`profiles`, `user_roles`, `role_permission`, `user_scope`, `access_request`, `webauthn_credentials`, `auth_event_log`, `user_layout_prefs`, `user_pinned`, `user_recent`.

### Audit, backup, quản trị
`audit_log`, `backup_lich_su`, `change_request`, `feature_usage_log`, `app_cai_dat`, `bang_cot_tuy_chinh`.

### AI, chat, notification
`ai_config`, `ai_conversation`, `ai_message`, `anomaly_alert`, `conversations`, `conversation_participant`, `messages`, `notifications`, `search_index`.

### Ticket & dự án
`tickets`, `ticket_comment`, `du_an`, `du_an_moc`, `du_an_cong_viec`, `du_an_cong_viec_phoi_hop`.

### Telegram
`telegram_subscriber`, `telegram_da_gui`, `thong_bao`, `thong_bao_cau_hinh`, `thong_bao_email_queue`.

### Nhập liệu (Import — N10)
`import_batch`, `import_item`, `import_alias`.

### Ghi chú, báo cáo, tạm
`node_note`, `bao_cao_annotation`, `backup_lich_su`, `_dbg_tmp`.

## Sơ đồ quan hệ chính (rút gọn)

```
dm_nhom_he_thong ─┐
dm_phan_loai ─────┼─► dm_he_thong ─┐
dm_don_vi ────────┘  (nguồn đơn vị) │
                                     ▼
                          he_thong_thanh_phan ◄──── cay_node_edit (edit trực tiếp)
                                     ▲
                        gan_chuc_nang│ (1 tài sản ↔ N thành phần)
                                     │
                 dm_vi_tri ◄── thiet_bi ──► dm_model ──► dm_nha_san_xuat
                                │            │
                                ▼            └► dm_loai_thiet_bi ──► dm_phan_loai
                          su_co / hong_hoc / bao_tri / ban_giao / kiem_ke
```

## Quan trọng

- **Đơn vị**: source of truth ở `dm_he_thong.don_vi_id`. Bảng `thiet_bi.don_vi_id` **kế thừa** từ thành phần đang lắp qua trigger sync.
- **Vị trí**: thành phần lấy vị trí từ tài sản đang lắp (kế thừa ngược).
- **RLS**: 100% bảng bật RLS. Xem `rls-matrix.md`.
- **GRANT**: mọi migration mới phải kèm GRANT — xem `../04-quy-uoc/grant-discipline.md`.

Chi tiết từng bảng (cột, FK, policy): `bang-chi-tiet.md`.
Danh sách RPC: `rpc-functions.md`.
Trigger: `triggers.md`.
