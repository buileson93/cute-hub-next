# QA Test Plan — Toàn bộ MIRATS (PLAN)

Trạng thái: **DRAFT — chờ duyệt trước BƯỚC 2**
Ràng buộc: BƯỚC 2 chỉ thêm hạ tầng test, **không đổi logic sản phẩm**; mọi test hiện có phải xanh.

Hiện trạng: 94 test file trong `src/lib/mirats/__tests__/`, 23 file SQL trong `supabase/tests/`. Chưa có e2e Playwright, chưa có fixtures dùng chung, chưa có ngưỡng coverage.

---

## 1. Kim tự tháp test

| Tầng | Công cụ | Phạm vi | Tỉ lệ ước tính | Chạy trên |
| --- | --- | --- | --- | --- |
| **Unit** | Vitest (jsdom) | Pure logic trong `src/lib/mirats/*`, transforms, validators, `buildGraph`, `normalizeName`, formula MTBF/MTTR, N1–N13 SPEC logic | **~70%** | mọi PR, <30s |
| **Integration (logic + Supabase mock)** | Vitest + `msw` / mocked `supabase` client | Hooks TanStack Query, mutation flows, resolver kế thừa Model, cascade filters bảng | **~15%** | mọi PR |
| **DB / RLS (pgTAP)** | `supabase/tests/*.sql` chạy qua `supabase db test` | Bất biến DB: RLS chéo đơn vị, FK guard, RPC transaction, unique/GRANT | **~8%** | mọi PR (job riêng) |
| **Route-smoke** | Vitest + React Testing Library | Mount 3 view (Vận hành/Sổ lý lịch/Danh mục) + các route N1–N13, không hồi quy navigation, `nav-contract.ts` | **~5%** | mọi PR |
| **E2E** | Playwright (headless Chromium) | Kịch bản người dùng: đăng nhập, lắp/tháo tài sản, báo sự cố N6, hoàn thành PM N4, cảnh báo N5, QR N7, Import N10 | **~2%** | nightly + trước release |

Không kiểm mọi node UI ở E2E — nguyên tắc "logic dày ở đáy, UI mỏng ở đỉnh".

---

## 2. Fixtures/seed dùng chung

Tạo mới: `src/lib/mirats/__tests__/fixtures/` (TS thuần) và `supabase/tests/_fixtures.sql` (SQL cho pgTAP).

**Nội dung tối thiểu** (mỗi bộ dữ liệu là hằng số đóng gói):

- 2 đơn vị: `DV_A`, `DV_B` (để kiểm RLS chéo — user thuộc A không thấy dữ liệu B).
- 3 user: `admin`, `phong_kt@A`, `phong_kt@B` (map qua `user_roles` + `user_scope`).
- 3 phân loại × 4 nhóm × 6 hệ thống (2 mỗi nhóm) × 12 thành phần × 24 tài sản, chia đều 2 đơn vị.
- 4 model, 3 NSX, 2 NCC (danh mục cấp hệ thống, không phân đơn vị).
- 5 sự cố (mỗi trạng thái N6 khác nhau), 3 công việc PM (đến hạn / quá hạn / đã xong), 2 giấy phép sắp hết hạn.
- 20 dòng `audit_log` phân bố qua các bảng để test `HistoryPanel` N3.

**API fixtures**:

```ts
// src/lib/mirats/__tests__/fixtures/index.ts
export const makeGraphFixture = () => { /* nodes/edges cho N13 */ };
export const makeUnitScopeFixture = () => { /* DV_A + DV_B với đầy đủ nhánh */ };
export const makeIncidentTimelineFixture = () => { /* N6 states */ };
export const makeImportBatchFixture = () => { /* N10 preview rows */ };
```

**Trên DB (pgTAP)**:

```sql
-- supabase/tests/_fixtures.sql — dùng qua \i trong test khác
BEGIN;
SELECT tests.setup_two_units_with_data();
-- helpers: tests.as_user('phong_kt@A'), tests.as_admin()
ROLLBACK; -- test tự đóng gói
```

Fixtures là **read-only trong test** — mỗi test wrap trong transaction để rollback.

---

## 3. Ngưỡng coverage & quy ước

**Ngưỡng đề xuất cho `src/lib/mirats/*`** (đo bằng `vitest --coverage` / `v8`):

| Metric | Ngưỡng ban đầu | Mục tiêu 3 tháng |
| --- | --- | --- |
| Statements | ≥ 75% | ≥ 85% |
| Branches | ≥ 70% | ≥ 80% |
| Functions | ≥ 80% | ≥ 90% |
| Lines | ≥ 75% | ≥ 85% |

Ngưỡng cấu hình trong `vitest.config.ts` — CI fail nếu tụt.

Loại trừ: `*.gen.ts`, `types.ts`, tệp `client.server.ts`/`auth-*.ts` (auto-gen).

**Quy ước đặt tên**:

- File: `kebab-case.test.ts` cho logic; `.test.tsx` cho component.
- `describe("<module>", ...)` một cấp, `it("should <hành vi>", ...)`.
- pgTAP: `<đối tượng>_<hành vi>.sql`, mỗi file `SELECT plan(n); ... SELECT * FROM finish();`.
- Route-smoke: `<route>.smoke.test.tsx` chỉ mount + kiểm text mốc, không đụng data mutation.
- E2E: `e2e/<flow>.spec.ts`, dùng fixture DV_A và tài khoản `phong_kt@A`.

---

## 4. Chạy trên CI

Scripts cần thêm vào `package.json`:

```json
{
  "test": "vitest run",
  "test:watch": "vitest",
  "test:coverage": "vitest run --coverage",
  "typecheck": "tsgo --noEmit",
  "lint": "eslint .",
  "pgtap": "supabase db test",
  "e2e": "playwright test",
  "test:all": "npm run typecheck && npm run lint && npm run test:coverage && npm run pgtap"
}
```

**Pipeline CI** (chặn merge nếu bất kỳ job fail):

```
lint       ─┐
typecheck  ─┼─► unit+integration (Vitest + coverage) ─► route-smoke ─► pgTAP (matrix) ─► e2e (nightly-only)
            │
            └─► security scan (weekly)
```

- Cache `node_modules` + `.vite` giữa job.
- Coverage upload artifact; PR comment diff so với `main`.
- E2E chỉ chạy nightly + tag `run-e2e` để tiết kiệm.

---

## 5. Ánh xạ theo hạng mục N1–N13

| Module | Unit | Integration | pgTAP | Route-smoke | E2E |
| --- | :-: | :-: | :-: | :-: | :-: |
| N1 Danh mục quality | ✓ (normalize, levenshtein) | ✓ (merge dry-run) | ✓ (unique partial idx) | – | – |
| N2 Change request | ✓ (state machine) | ✓ (approve/reject) | ✓ (RLS admin-only) | ✓ | ✓ (approve flow) |
| N3 History panel | ✓ (grouping ≤3s, restore whitelist) | ✓ | – | ✓ | – |
| N4 PM | ✓ (next-due formula) | ✓ | ✓ (cron idempotent) | ✓ | ✓ (complete task) |
| N5 Cảnh báo | ✓ (threshold 30/15/7) | ✓ | ✓ (v_sap_het_han) | ✓ | – |
| N6 Sự cố workflow | ✓ (FSM matrix) | ✓ (downtime calc) | ✓ (state transition) | ✓ | ✓ (bao_cao → nghiem_thu) |
| N7 QR | ✓ (deep-link parser) | – | – | ✓ | ✓ (scan → landing) |
| N8 Dashboard | ✓ (kpi aggregation) | ✓ | ✓ (RPC security invoker) | ✓ | – |
| N9 Reliability | ✓ (MTBF/MTTR/avail) | ✓ | – | ✓ | – |
| N10 Import/Export | ✓ (validators, mapping) | ✓ (undo) | ✓ (transaction rollback) | ✓ | ✓ (import xlsx) |
| N11 Mobile offline | ✓ (outbox, idempotency) | ✓ (flush order) | ✓ (client_uuid unique) | – | ✓ (offline flow) |
| N12 Performance | ✓ (buildIndex) | – | – | ✓ | perf script |
| N13 Graph view | ✓ (buildGraph, filter) | – | – | ✓ | – |

---

## 6. Câu hỏi làm rõ

1. **pgTAP runner** hiện có chạy được bằng `supabase db test` local + CI chưa, hay cần dựng job riêng trên container Postgres?
2. **E2E Playwright**: chấp nhận thêm dep + browser cache trên CI? Nếu không, tạm bỏ tầng E2E, chuyển kịch bản xuống integration.
3. Ngưỡng coverage khởi điểm **75%** có phù hợp hay muốn thấp hơn (60%) để tránh chặn nhiều PR trong 2 tuần đầu?
4. Fixtures: chấp nhận thêm 2 user seed `phong_kt@A/B` trong `auth.users` trên môi trường test (không dùng cho dev/prod)?
5. Có cần thêm **contract test cho `nav-contract.ts`** (snapshot) để cảnh báo mọi thay đổi nav — mọi PR đổi nav phải update snapshot có chủ ý?
6. Coverage tool: `v8` (native, nhanh) hay `istanbul` (chi tiết hơn)? Mặc định đề xuất `v8`.
7. E2E chạy trên preview URL production-like (`project--<id>-dev.lovable.app`) hay chỉ local `http://localhost:8080`?

Chờ bạn duyệt PLAN + trả lời câu hỏi trước khi sang BƯỚC 2.
