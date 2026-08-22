# MIRATS — Roadmap Nâng cấp N1..N12 (P0 Brainstorming)

> **Trạng thái**: BẢN NHÁP — chờ phê duyệt. Áp dụng Superpowers: brainstorming → writing-plans → TDD → verification-before-completion. KHÔNG viết code sản phẩm cho tới khi được duyệt.

---

## 1. Ảnh chụp kiến trúc thực tế

### 1.1 Vận hành — `src/routes/_app.he-thong.*.tsx`

| Route                          | LOC  | Vai trò                                                                                                                                                              |
| ------------------------------ | ---- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `_app.he-thong.cay.tsx`        | 5876 | Trung tâm 3-view: **Tree** (cây phân cấp), **Table** (`ThanhPhanTable` — đơn/theo tài sản), **MindMap**. Chia sẻ `Edit Mode` toàn cục, sheet chi tiết, bulk actions. |
| `_app.he-thong.$id.tsx`        | 358  | Chi tiết 1 hệ thống (tab tổng quan, thành phần, tài sản, sự cố).                                                                                                     |
| `_app.he-thong.lien-ket.tsx`   | 504  | Liên kết giữa hệ thống & khe cắm (`lien_ket_he_thong`, `lien_ket_khe`).                                                                                              |
| `_app.he-thong.thanh-phan.tsx` | 25   | Redirect → `cay` (đã hợp nhất).                                                                                                                                      |
| `_app.he-thong.thung-rac.tsx`  | 346  | Thùng rác: restore / hard-delete có kiểm tra dependency.                                                                                                             |

**Bảng SSoT**: `dm_nhom_he_thong`, `dm_he_thong`, `he_thong_thanh_phan`, `thiet_bi`, `gan_chuc_nang`, `gan_linh_kien`, `dm_vi_tri`, `dm_don_vi`, `dm_phan_loai`. **Metadata trình bày**: `cay_node_edit` (đã bị chặn ghi tên nghiệp vụ — xem `cay_node_edit_no_business_name.sql`).

**RPC**: `lap_tai_san_vao_thanh_phan`, `thao_tai_san_khoi_thanh_phan`, `_validate_vi_tri_tuong_thich`, `dm_xoa_an_toan`, `cay_soft_delete_*`, `cay_restore_*`.

### 1.2 Sổ lý lịch — `_app.thiet-bi.*.tsx` + `db-operations.ts` + `change-log.ts`

| Route                          | LOC      | Vai trò                                                                    |
| ------------------------------ | -------- | -------------------------------------------------------------------------- |
| `_app.thiet-bi.tsx`            | (layout) | Khung tab (Tổng quan/Bảo trì/Sự cố/Chứng chỉ/…).                           |
| `_app.thiet-bi.index.tsx`      | 577      | Danh sách tài sản (đang lắp / trong kho / vòng đời).                       |
| `_app.thiet-bi.$maThietBi.tsx` | 809      | Chi tiết 1 tài sản: lịch sử tháo lắp, sự cố, bảo trì, chứng chỉ, tài liệu. |

**Lib**: `db-operations.ts` (CRUD tài sản + wrapper RPC), `change-log.ts` (ghi audit đồng bộ với `audit_log`), `so-ly-lich.ts` (tổng hợp timeline cross-layer), `record-timeline.ts`, `record-snapshot.ts`.

**Bảng**: `thiet_bi`, `thiet_bi_vong_doi`, `thiet_bi_cap_phat`, `thiet_bi_ket_noi`, `thiet_bi_do_dac`, `thiet_bi_khe_linh_kien`, `thiet_bi_tep_dinh_kem`, `chung_chi_thiet_bi`, `bao_tri`, `cong_viec_bao_tri`, `su_co`, `hong_hoc`, `van_de`, `ban_giao`, `kiem_ke`, `audit_log`.

### 1.3 Danh mục — `_app.danh-muc.*.tsx`

| Route           | LOC  | Bảng SSoT                                         |
| --------------- | ---- | ------------------------------------------------- |
| `don-vi`        | 28   | `dm_don_vi`                                       |
| `vi-tri`        | 55   | `dm_vi_tri`                                       |
| `loai-thiet-bi` | 60   | `dm_loai_thiet_bi`                                |
| `nha-san-xuat`  | 30   | `dm_nha_san_xuat`                                 |
| `nha-cung-cap`  | 40   | `dm_nha_cung_cap`                                 |
| `dac-tinh`      | 402  | `dm_dac_tinh`, `dm_model_dac_tinh`                |
| `he-thong`      | 214  | `dm_nhom_he_thong`, `dm_he_thong`, `dm_phan_loai` |
| `model`         | 1487 | `dm_model` + cascade sang `thiet_bi` (trigger)    |
| `thiet-bi`      | 966  | Bảng tổng hợp `thiet_bi` (cross-catalog view)     |

**Primitive dùng chung**: `rename-entity.ts::{renameEntity, updateEntityRow}`, `CatalogTable.tsx`, `ReferenceCell.tsx`, `use-cell-editor.ts`. **FK guard**: RPC `dm_xoa_an_toan` + `danh_muc_fk_guard.sql`.

---

## 2. Bất biến hiện có & test đối chứng

| Bất biến                                                             | Test / SQL                                                                                           |
| -------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------- |
| Taxonomy hierarchy (đơn vị → nhóm → hệ thống → thành phần → tài sản) | `taxonomy-invariant.test.ts`, `supabase/tests/taxonomy_invariant.sql`                                |
| RLS chéo đơn vị                                                      | `supabase/tests/rls_cross_unit.sql`, `rls_hoan_thien.sql`, `quyen.test.ts`, `quan-tri-roles.test.ts` |
| Xoá cây an toàn (không xoá cứng có history)                          | `cay-delete.test.ts`, `cay-no-direct-device-delete.test.ts`                                          |
| 1 tài sản có thể lắp nhiều thành phần                                | `he-thong-thanh-phan.test.ts`, `gan_chuc_nang_invariants.sql`                                        |
| `cay_node_edit.ten` chỉ cho draft                                    | `cay_node_edit_no_business_name.sql`, `so-ly-lich-name-sync.test.ts`                                 |
| Trường kế thừa Model là read-only                                    | `inherited-readonly.test.ts`, `model-inherit.test.ts`                                                |
| Reference luôn Combobox                                              | `inline-edit.test.ts`, `field-form.test.ts`                                                          |
| Sổ lý lịch giới hạn quyền sửa theo layer                             | `so-ly-lich-readonly.test.ts`                                                                        |
| Rename cross-entity                                                  | `rename-entity.test.ts`                                                                              |
| Bulk edit + undo                                                     | `bulk-actions.test.ts`, `rollback-preview.test.ts`                                                   |
| Danh mục FK guard                                                    | `danh-muc-refs.test.ts`, `danh_muc_fk_guard.sql`                                                     |
| RPC lắp/tháo idempotent + vị trí hợp lệ                              | `gan_chuc_nang_invariants.sql`, `rpc_hardening.sql`                                                  |
| Nav contract (không breaking)                                        | `nav-contract.test.ts`, `nav-config.test.ts`, `route-smoke.test.ts`                                  |
| Audit ghi log mọi thay đổi                                           | `record-snapshot.test.ts`, `record-timeline.test.ts`, `ghi-payload.test.ts`                          |

---

## 3. Roadmap N1..N12

Quy ước mỗi hạng mục: **Mục tiêu · File chạm · Bảng/RPC mới · Rủi ro · DoD (test)**. Không được vi phạm ràng buộc: SSoT `dm_*`/`thiet_bi`; không hard-delete có lịch sử; reference = Combobox; kế thừa Model read-only; audit_log cho mọi mutation; chỉ `admin`/`phong_kt` được edit; RLS là chốt cuối; không đổi `nav-contract.ts` khi chưa có test đặc tả.

### N1 — Chuẩn hoá vòng đời tài sản (lifecycle state machine)

- **Mục tiêu**: Định nghĩa FSM cho `thiet_bi.trang_thai` (kho → sẵn sàng → đang lắp → bảo trì → hỏng → thanh lý) + guard chuyển trạng thái.
- **File**: `src/lib/mirats/lifecycle.ts`, `db-operations.ts`, `trang-thai.ts`; route `_app.thiet-bi.$maThietBi.tsx`.
- **Bảng/RPC**: mở rộng `thiet_bi_vong_doi`; RPC mới `chuyen_trang_thai_thiet_bi(p_id, p_to, p_reason)`.
- **Rủi ro**: dữ liệu cũ không match FSM → cần migration đối chiếu.
- **DoD**: mở rộng `lifecycle.test.ts` + SQL test mới `trang_thai_fsm.sql`; audit_log entry cho mỗi transition.

### N2 — Kiểm kê định kỳ (workflow đóng-mở kỳ)

- **Mục tiêu**: Kỳ kiểm kê có trạng thái (mở/đang thực hiện/đóng), snapshot lệch, đối chiếu QR.
- **File**: `src/lib/mirats/kiem-ke.ts`, `kiem-ke-anh.test.ts` mở rộng; UI trong `_app.thiet-bi.*`.
- **Bảng**: `kiem_ke` + bảng phụ `kiem_ke_dong_kỳ` (mới); trigger snapshot vị trí.
- **Rủi ro**: xung đột với thao tác tháo/lắp trong lúc kiểm kê.
- **DoD**: `kiem-ke.test.ts` bổ sung kịch bản đóng kỳ; SQL test `kiem_ke_snapshot.sql`.

### N3 — Bảo trì phòng ngừa (PM) theo mẫu

- **Mục tiêu**: Sinh `cong_viec_bao_tri` tự động từ chu kỳ (`bao_tri_chinh_sach`) theo model/hệ thống.
- **File**: `cong-viec-bao-tri.ts`, `bao-tri-form.ts`; route `_app.he-thong.$id.tsx`.
- **RPC**: `sinh_cong_viec_pm(p_scope)`; schedule qua pg_cron → server route `/api/public/cron/pm`.
- **Rủi ro**: sinh trùng; timezone.
- **DoD**: `cong-viec-bao-tri` (mới) + SQL test `cong_viec_bao_tri_idempotent.sql` mở rộng.

### N4 — Cảnh báo hết hạn hợp nhất (giấy phép, kiểm định, chứng chỉ)

- **Mục tiêu**: Một pipeline duy nhất tổng hợp mọi expiry → `notifications` + Telegram.
- **File**: `canh-bao-het-han.ts`, `han-canh-bao.ts`; server route cron.
- **Bảng**: dùng lại `canh_bao_het_han_log`, `telegram_da_gui`.
- **Rủi ro**: gửi trùng khi đổi ngưỡng.
- **DoD**: `canh-bao-het-han.test.ts`, `han-canh-bao.test.ts`, `han-canh-bao-inventory.test.ts` mở rộng.

### N5 — Quản lý giấy phép khai thác end-to-end

- **Mục tiêu**: Gắn `giay_phep_khai_thac` với hệ thống/tài sản, chặn vận hành khi hết hạn.
- **File**: `db-licenses.ts`; route `_app.he-thong.$id.tsx`, `_app.thiet-bi.$maThietBi.tsx`.
- **Bảng**: `giay_phep`, `giay_phep_khai_thac`, `dm_loai_giay_phep`.
- **Rủi ro**: chặn thao tác gây UX xấu → cần cảnh báo mềm.
- **DoD**: SQL `topology_expiry_invariants.sql` mở rộng; test unit `db-licenses` (mới).

### N6 — Sự cố → Vấn đề (RCA) → Công việc — chuỗi liên kết

- **Mục tiêu**: Từ `su_co` mở `van_de` (RCA), sinh `du_an_cong_viec` khắc phục, khép vòng đo KPI (MTTR/MTBF).
- **File**: `su-co-state.ts`, `van-de-state.ts`, `cong-viec-state.ts`, `pl04-metrics.ts`, `reliability.ts`.
- **Bảng/RPC**: RPC `su_co_promote_van_de`, `van_de_close_gate` (SQL đã có).
- **Rủi ro**: workflow chồng chéo với PM.
- **DoD**: mở rộng `su-co-state.test.ts`, `van-de-state.test.ts`, `pl04-metrics.test.ts`, `reliability.test.ts`.

### N7 — Bàn giao ca / bàn giao thiết bị số hoá

- **Mục tiêu**: `ban_giao` có ký số (đã có `form-signer`), cross-link tới `thiet_bi_cap_phat`, `su_co`.
- **File**: `ban-giao-validate.ts`, `form-signer.ts`; route `_app.thiet-bi.$maThietBi.tsx` (tab bàn giao).
- **DoD**: `ban-giao-validate.test.ts` + `form-signer.test.ts` bổ sung.

### N8 — Kho & vật tư tiêu hao

- **Mục tiêu**: Xuất/nhập kho gắn với công việc bảo trì; cảnh báo tồn thấp.
- **File**: `kho.ts`, `kho-tieu-hao.ts`.
- **Bảng**: `kho`, `kho_giao_dich`, `vat_tu`.
- **DoD**: mở rộng `kho.test.ts`, `kho-tieu-hao.test.ts`, SQL `kho_cap_phat_invariants.sql`.

### N9 — Import staging chống lỗi (2-phase)

- **Mục tiêu**: Nạp Excel/CSV vào `import_batch`/`import_item`, preview + rollback, alias tự học.
- **File**: `import-*` (đã có nhiều), `_app.danh-muc.model.tsx` (dòng import).
- **Bảng**: `import_batch`, `import_item`, `import_alias`.
- **DoD**: `import-*.test.ts` (đã có 7 file), thêm E2E `import-unification` cho tài sản.

### N10 — Nhân sự, phân quyền hạt mịn theo phạm vi (`user_scope`)

- **Mục tiêu**: Giới hạn thao tác theo `dm_don_vi`/`dm_he_thong` cho các vai trò không phải admin.
- **File**: `quyen.ts`, `scope.tsx`, RLS SQL.
- **Bảng**: `user_scope`, `user_roles`, `role_permission`.
- **Rủi ro**: Đụng RLS hiện tại → cần regression suite đầy đủ.
- **DoD**: mở rộng `rls_cross_unit.sql`, `quan-tri-roles.test.ts`, `quyen.test.ts`.

### N11 — Báo cáo & Dashboard KPI (PL-04 + độ tin cậy)

- **Mục tiêu**: Gộp KPI (MTTR, MTBF, tỉ lệ PM đúng hạn, backlog) vào 1 dashboard.
- **File**: `bao-cao/`, `pl04-metrics.ts`, `reliability.ts`, `metrics.ts`; route mới `_app.bao-cao.*.tsx` (chỉ khi được duyệt — cần cập nhật `nav-contract` **kèm test**).
- **DoD**: `bao-cao.test.ts`, `metrics.test.ts`, `pl04-metrics.test.ts` mở rộng; snapshot Golden.

### N12 — AI trợ lý (RAG trên `search_index` + `ask-ai`)

- **Mục tiêu**: Hỏi đáp trên dữ liệu MIRATS qua Lovable AI Gateway; điền form thông minh.
- **File**: `ask-ai.ts`, `search/`, `ai_config`, `ai_conversation`, `ai_message`.
- **Bảng**: `ai_config` (SSoT tại `public_ai_config`), `search_index`.
- **Rủi ro**: rò rỉ dữ liệu qua model → cần scrub PII; RLS trên `ai_message`.
- **DoD**: test unit `ask-ai` (mới), SQL `ai_run_select_security.sql` mở rộng, prompt-injection fixture.

---

## 4. Câu hỏi làm rõ (chờ trả lời trước khi lên PLAN chi tiết)

1. **Thứ tự ưu tiên**: N1..N12 làm tuần tự hay chọn 3-4 hạng mục ưu tiên cho sprint đầu? Có deadline cho hạng mục nào không?
2. **N1 (lifecycle FSM)**: các trạng thái hiện tại của `thiet_bi` có cần thêm/bớt không, hay chốt theo `trang-thai.ts` đang có? Có cho phép "quay lui" trạng thái không (ví dụ hỏng → sẵn sàng)?
3. **N3 (PM)**: chu kỳ bảo trì tính theo lịch (calendar-based) hay theo counter (giờ chạy/số km/số cycle)? Có dữ liệu counter chưa?
4. **N4/N5 (cảnh báo & giấy phép)**: ngưỡng cảnh báo (30/60/90 ngày?) và kênh gửi (Telegram bắt buộc? Email? In-app?) — có SLA nghiệp vụ cụ thể không?
5. **N10 (scope hạt mịn)**: sau khi bật `user_scope`, các user hiện có mặc định được cấp phạm vi nào? Có cần công cụ admin để cấp phạm vi hàng loạt không?
6. **N11 (báo cáo)**: có được phép thêm route `/bao-cao` (kèm cập nhật `nav-contract` + test đặc tả) hay giữ nguyên nav và nhúng vào Overview?
7. **N12 (AI)**: model mặc định (google/gemini-2.5-flash?) và giới hạn ngân sách/quota theo user? Cho phép training/embedding tự động trên `search_index` không?
8. **Ràng buộc migration**: cho phép migration schema breaking (thêm cột NOT NULL, đổi enum) miễn có backfill, hay chỉ additive?
9. **Ngôn ngữ UI**: giữ 100% tiếng Việt, hay bổ sung i18n en/vi?
10. **Compact mode & mobile**: các tính năng mới có bắt buộc hỗ trợ mobile ngay từ đầu, hay desktop-first?

---

**Dừng tại đây — chờ phê duyệt Roadmap + trả lời câu hỏi để chuyển sang P1 (writing-plans cho hạng mục N-đầu tiên).**
