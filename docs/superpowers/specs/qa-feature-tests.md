# QA Feature Tests — Ma trận Tính năng × Loại test × DoD (SPEC)

Trạng thái: **DRAFT — chờ duyệt trước BƯỚC 2 (TDD)**
Kế thừa `qa-test-plan.md`. Fixtures chung tại `src/lib/mirats/__tests__/fixtures/` và `supabase/tests/_fixtures.sql`.

Quy ước:

- **U** Unit (Vitest, logic thuần) — `src/lib/mirats/__tests__/*.test.ts`
- **I** Integration (Vitest + supabase client mock/local) — `*.integration.test.ts`
- **D** pgTAP DB — `supabase/tests/*.sql`
- **S** Route-smoke — `route-smoke.test.ts` (đã có)
- ✅ đã có test bảo vệ · ➕ cần bổ sung · ⚠️ có nhưng cần siết

DoD = "Definition of Done": test nào phải xanh thì hạng mục coi như đạt.

---

## 1. Danh mục (N1)

| Bất biến                                                                               |               U               |  I  |  D  | Test file (DoD)                                                                       |
| -------------------------------------------------------------------------------------- | :---------------------------: | :-: | :-: | ------------------------------------------------------------------------------------- |
| `normalizeName`: strip diacritic + lowercase + collapse spaces                         |              ➕               |  –  |  –  | `danh-muc-normalize.test.ts`                                                          |
| `findNearDuplicates(scope)`: exact + contains + Levenshtein ≥0.86                      |              ➕               |  –  |  –  | `danh-muc-dedupe.test.ts`                                                             |
| `validateRequired(bảng, row)`: đúng cột bắt buộc từng dm\_\*                           |              ➕               |  –  |  –  | `danh-muc-required.test.ts`                                                           |
| Merge không để mồ côi FK: mọi bảng tham chiếu chuyển sang id đích, bản gốc soft-delete |               –               | ➕  | ➕  | `danh-muc-merge.integration.test.ts` + `supabase/tests/danh_muc_merge_no_orphans.sql` |
| Reference luôn `*_id` (không lưu tên) — chặn insert khi thiếu id                       | ⚠️ (`danh-muc-refs.test.ts`)  |  –  | ➕  | mở rộng file cũ + `supabase/tests/danh_muc_refs_id_only.sql`                          |
| Alias mapping (import) không tạo FK ma                                                 | ✅ (`import-mappers.test.ts`) |  –  | ✅  | –                                                                                     |

---

## 2. Vận hành / Hệ thống (SSOT dm\_\*, cây 5 mức)

| Bất biến                                                                                                     |  U  |  I  |  D  | Test file (DoD)                                                                                                   |
| ------------------------------------------------------------------------------------------------------------ | :-: | :-: | :-: | ----------------------------------------------------------------------------------------------------------------- |
| Taxonomy cây phân cấp: parent-of type hợp lệ (Đơn vị→Nhóm→HT→TP→TS)                                          | ✅  |  –  |  –  | `taxonomy-invariant.test.ts`                                                                                      |
| Không thêm node lạc taxonomy                                                                                 | ✅  |  –  | ➕  | `cay-add-invariants.test.ts` + `supabase/tests/cay_add_taxonomy.sql`                                              |
| **Một-writer cho tên**: `renameEntity` là entry duy nhất; `cay_node_edit.ten` chỉ metadata, không dual-write | ✅  |  –  | ⚠️  | `rename-entity.test.ts`, `so-ly-lich-name-sync.test.ts`, siết `supabase/tests/cay_node_edit_no_business_name.sql` |
| Xoá an toàn: mềm, có undo, có audit; không hard-delete khi có lịch sử                                        | ✅  |  –  | ✅  | `cay-delete.test.ts` + `supabase/tests/danh_muc_fk_guard.sql`                                                     |
| Không xoá trực tiếp thiết bị qua cây                                                                         | ✅  |  –  |  –  | `cay-no-direct-device-delete.test.ts`                                                                             |
| Trường kế thừa từ `dm_model` là read-only ở UI + guard DB                                                    | ✅  |  –  | ➕  | `inherited-readonly.test.ts`, `model-inherit.test.ts` + `supabase/tests/thiet_bi_inherited_readonly.sql`          |
| Bulk edit: preview → confirm → audit_log → undo trong 24h                                                    | ⚠️  | ➕  | ➕  | `bulk-actions.test.ts`, `rollback-preview.test.ts` + `supabase/tests/bulk_edit_audit.sql`                         |
| 3 view (tree/table/mindmap) chia sẻ affordance sửa qua cùng function                                         | ➕  |  –  |  –  | `edit-affordance-consistency.test.ts`                                                                             |

---

## 3. Sổ lý lịch (thành phần, tài sản, sự cố, PM, cảnh báo)

| Bất biến                                                                                    |  U  |  I  |  D  | Test file (DoD)                                                                             |
| ------------------------------------------------------------------------------------------- | :-: | :-: | :-: | ------------------------------------------------------------------------------------------- |
| `he_thong_thanh_phan` lắp/tháo/thay thế **atomic**; 1 tài sản có thể ở nhiều thành phần     | ✅  |  –  | ✅  | `he-thong-thanh-phan.test.ts` + `supabase/tests/gan_chuc_nang_invariants.sql`               |
| `filterEligibleDevices` + `rankCandidates` cho combobox lắp                                 | ⚠️  |  –  |  –  | siết `he-thong-thanh-phan.test.ts`                                                          |
| Timeline & audit cho mọi thao tác component                                                 | ✅  |  –  |  –  | `record-timeline.test.ts`, `record-snapshot.test.ts`                                        |
| Sự cố N6 FSM: bao_cao→tiep_nhan→dang_xu_ly→cho_vat_tu→hoan_thanh→nghiem_thu; chặn nhảy cóc  | ⚠️  |  –  | ➕  | `su-co-state.test.ts` (mở rộng full matrix) + `supabase/tests/su_co_fsm.sql`                |
| Downtime: bắt đầu tại `dang_xu_ly`, kết thúc tại `hoan_thanh`; `wrench_time` trừ chờ vật tư | ➕  |  –  |  –  | `su-co-downtime.test.ts`                                                                    |
| N4 PM: sinh việc theo chu kỳ time/metric, idempotent                                        | ✅  |  –  | ✅  | `bao-tri-kpi.test.ts`, `chu-ky.test.ts` + `supabase/tests/cong_viec_bao_tri_idempotent.sql` |
| Hoàn thành PM → ghi `bao_tri` + kỳ tiếp theo trong 1 transaction                            | ✅  |  –  | ✅  | `cong-viec-hoan-thanh.test.tsx` + `supabase/tests/cong_viec_hoan_thanh_transaction.sql`     |
| N5 Cảnh báo ngưỡng 30/15/7 + overdue                                                        | ✅  |  –  |  –  | `canh-bao-het-han.test.ts`, `han-canh-bao.test.ts`, `expiring.test.ts`                      |
| Giấy phép khai thác không hết hạn khi chưa có `ngay_het_hieu_luc`                           | ⚠️  |  –  |  –  | mở rộng `expiring.test.ts`                                                                  |

---

## 4. Chéo tính năng

| Bất biến                                                                                          |  U  |  I  |  D  | Test file (DoD)                                                                                                                      |
| ------------------------------------------------------------------------------------------------- | :-: | :-: | :-: | ------------------------------------------------------------------------------------------------------------------------------------ |
| **RLS chéo đơn vị**: user DV_A không đọc/ghi được row DV_B ở mọi bảng đơn vị                      |  –  | ➕  | ✅  | `supabase/tests/rls_cross_unit.sql` + `rls-cross-unit.integration.test.ts` (dùng fixture 2 đơn vị)                                   |
| RLS trên `audit_log`, `su_co`, `bao_tri`, `he_thong_thanh_phan`, `giay_phep_khai_thac`, `kiem_ke` |  –  |  –  | ⚠️  | mở rộng `rls_cross_unit.sql` phủ đủ 20+ bảng                                                                                         |
| N2 Change-request: phong_kt **KHÔNG** tự approve; chặn self-approve                               | ➕  | ➕  | ➕  | `change-request-fsm.test.ts` + `supabase/tests/change_request_no_self_approve.sql`                                                   |
| Approve → apply atomic; rollback nếu apply lỗi                                                    | ➕  |  –  | ➕  | `supabase/tests/change_request_apply_atomic.sql`                                                                                     |
| N9 Reliability: MTBF/MTTR/Availability đúng công thức, biên (0 sự cố, sự cố đang mở)              | ➕  |  –  |  –  | `reliability.test.ts` (mở rộng)                                                                                                      |
| N10 Import: `validate` phát hiện 10 loại lỗi; `mapReferences` fuzzy → id; undo trong 24h          | ✅  | ⚠️  | ➕  | `import-core.test.ts`, `import-mappers.test.ts`, `import-staging.test.ts` + `supabase/tests/import_apply_rollback.sql` (đã có, siết) |
| N11 Offline: outbox idempotency qua `client_uuid`; retry không tạo bản ghi trùng                  | ➕  |  –  | ➕  | `offline-outbox.test.ts` + `supabase/tests/idempotency_client_uuid.sql`                                                              |
| N11: flush theo thứ tự khi mạng lại; conflict N6 state hiển thị resolver                          | ➕  |  –  |  –  | `offline-flush-order.test.ts`                                                                                                        |
| N13 Graph: `buildGraph`/`filterGraph`/`neighborsOf`; không cạnh mồ côi; không self-loop lạ        | ⚠️  |  –  |  –  | `graph-core.test.ts` (siết), `graph-cluster.test.ts`, `system-graph.test.ts`                                                         |
| N7 QR deep-link `/q/:ma` parser + guard auth                                                      | ⚠️  |  –  |  –  | `nhan-qr.test.ts` (mở rộng)                                                                                                          |
| N8 Dashboard RPC security invoker (không lộ dữ liệu đơn vị khác)                                  |  –  |  –  | ➕  | `supabase/tests/dashboard_rpc_rls.sql`                                                                                               |
| N12 Perf: `buildSearchIndex` + `filterByIndex` deterministic, sub-50ms cho 20k dòng               | ➕  |  –  |  –  | `perf-search-index.test.ts` (bench có ngưỡng)                                                                                        |
| N3 History panel: gom nhóm ≤3s cùng actor/entity/action                                           | ➕  |  –  |  –  | `history-panel-grouping.test.ts`                                                                                                     |
| N3 Restore: chỉ áp field trong whitelist an toàn                                                  | ➕  |  –  | ➕  | `history-restore-whitelist.test.ts` + `supabase/tests/history_restore_guard.sql`                                                     |

---

## 5. Contract & hạ tầng

| Bất biến                                                      |  U  | Test file (DoD)                              |
| ------------------------------------------------------------- | :-: | -------------------------------------------- |
| `nav-contract.ts` snapshot: mọi đổi menu phải update snapshot | ✅  | `nav-contract.test.ts`, `nav-config.test.ts` |
| `no-demo-in-production`: không seed demo lọt vào bundle prod  | ✅  | `no-demo-in-production.test.ts`              |
| Route smoke: mọi route mount không throw                      | ✅  | `route-smoke.test.ts`                        |
| Format helpers (ngày, số, tiền) ổn định                       | ✅  | `format.test.ts`, `mau-sac.test.ts`          |

---

## 6. DoD tổng cho từng module

| Module     | DoD test bắt buộc xanh                                                                                                                                  |
| ---------- | ------------------------------------------------------------------------------------------------------------------------------------------------------- |
| N1         | `danh-muc-normalize/dedupe/required/merge` + `danh_muc_merge_no_orphans.sql`                                                                            |
| N2         | `change-request-fsm` + `change_request_no_self_approve.sql` + `change_request_apply_atomic.sql`                                                         |
| N3         | `history-panel-grouping` + `history-restore-whitelist` + `history_restore_guard.sql`                                                                    |
| N4         | `bao-tri-kpi`, `chu-ky`, `cong-viec-hoan-thanh` + `cong_viec_bao_tri_idempotent.sql`                                                                    |
| N5         | `canh-bao-het-han`, `han-canh-bao`, `expiring`                                                                                                          |
| N6         | `su-co-state` (full FSM), `su-co-downtime` + `su_co_fsm.sql`                                                                                            |
| N7         | `nhan-qr` mở rộng                                                                                                                                       |
| N8         | `dashboard_rpc_rls.sql`                                                                                                                                 |
| N9         | `reliability` (biên)                                                                                                                                    |
| N10        | `import-core/mappers/staging` + `import_apply_rollback.sql`                                                                                             |
| N11        | `offline-outbox`, `offline-flush-order` + `idempotency_client_uuid.sql`                                                                                 |
| N12        | `perf-search-index` (có bench ngưỡng)                                                                                                                   |
| N13        | `graph-core`, `graph-cluster`, `system-graph`                                                                                                           |
| Vận hành   | `taxonomy-invariant`, `rename-entity`, `cay-delete`, `cay-no-direct-device-delete`, `inherited-readonly`, `bulk-actions`, `edit-affordance-consistency` |
| Sổ lý lịch | `he-thong-thanh-phan`, `record-timeline`                                                                                                                |
| Chéo       | `rls_cross_unit.sql` phủ đủ bảng                                                                                                                        |

---

## 7. Rủi ro & lưu ý

- **Không sửa audit**: mọi test ghi audit đều wrap trong transaction rollback (pgTAP) hoặc mock (Vitest).
- **Không nới RLS**: `rls_cross_unit.sql` là gate cứng — thêm bảng đơn vị mới phải update file này (thêm entry trong roadmap review PR).
- Test đã có (94 file) phải giữ xanh; các bổ sung không ghi đè, chỉ mở rộng.
- Bench N12 chạy trên seed lớn (`scripts/perf-seed.ts`), tách skip mặc định trên CI PR, chạy nightly.

---

## 8. Câu hỏi làm rõ

1. **Bench N12** có được phép chạy trên CI PR (thêm ~30s) hay chỉ nightly?
2. **`edit-affordance-consistency.test.ts`**: check 3 view dùng cùng function `renameEntity/deleteEntity` bằng snapshot lời gọi — chấp nhận cách này hay muốn E2E thực?
3. **`rls_cross_unit.sql`** hiện đã phủ ~8 bảng — có được tăng lên **20+** bảng đơn vị trong lần này (thời gian pgTAP tăng ~2s)?
4. **N11 offline outbox** test: cần thư viện fake IndexedDB (`fake-indexeddb`, ~40KB dev-dep) — chấp nhận?
5. **`history-restore-whitelist`** DoD: chốt whitelist trong file cấu hình chung `src/lib/mirats/history-restore-config.ts` — có OK?
6. Có cần thêm **contract test cho enum trạng thái** (N6 states) để đổi enum là fail test, tránh silent break?
7. **Coverage gate**: bật ngay ở 75% (kèm PR này) hay warn-only trong 2 tuần đầu?

Chờ bạn duyệt SPEC + trả lời trước khi sang BƯỚC 2 (TDD RED→GREEN).
