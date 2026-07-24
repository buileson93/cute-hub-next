# N4 — Preventive Maintenance (PM)

> **Trạng thái**: SPEC — chờ phê duyệt. Không code cho tới khi duyệt. Kế thừa N1/N2/N3 và bảng `bao_tri_chinh_sach`, `bao_tri`, `cong_viec_bao_tri` hiện có.

## 0. Bối cảnh hiện tại (không phá)

Repo đã có:
- `bao_tri_chinh_sach` (chính sách/mẫu bảo trì) — cột: `chu_ky_ngay`, `chu_ky_gio_chay`, `loai_thiet_bi_id`, `he_thong_id`, `thiet_bi_id`, `model_id`.
- `bao_tri` (Sổ lý lịch bảo trì đã hoàn thành).
- `cong_viec_bao_tri` (công việc thi công).
- Route: `/bao-tri/cong-viec`, `/bao-tri/moi`, `/admin/bao-tri-chinh-sach`.
- Lib: `cong-viec-state.ts`, `bao-tri-form.ts`, `bao-tri-consistency.ts`, `bao-tri-kpi.ts`.

Spec này **không** tạo bảng song song `pm_ke_hoach` mới nếu có thể dùng `bao_tri_chinh_sach`. Ta chỉ thêm bảng **`pm_cong_viec`** (hàng đợi công việc PM đến hạn) và mở rộng nhẹ `bao_tri_chinh_sach` (thêm `chu_ky_loai`, `chu_ky_gia_tri` chuẩn hoá + `noi_dung`, `nguoi_phu_trach_id`, `lan_gan_nhat_at`). Nếu bạn muốn tách bảng riêng `pm_ke_hoach`, xem §11 (Alternative).

## 1. Mô hình chu kỳ

Hai loại (mutually exclusive per policy):

- **`time`** — theo lịch. `chu_ky_gia_tri` = số ngày (int > 0). Ví dụ 30/90/180/365.
- **`metric`** — theo chỉ số vận hành. `chu_ky_gia_tri` = ngưỡng tăng thêm (numeric > 0) trên counter `gio_chay` (số giờ chạy) hoặc `so_lan` (số lần khởi động). Chỉ số nguồn nằm ở `thiet_bi_do_dac` (bảng đã có) hoặc `thiet_bi.thuoc_tinh.gio_chay`.

Trường mở rộng cho `bao_tri_chinh_sach`:
- `chu_ky_loai` `time|metric` NOT NULL DEFAULT `time`.
- `chu_ky_gia_tri` numeric NOT NULL (giữ lại `chu_ky_ngay`/`chu_ky_gio_chay` cũ để migrate, sau đó deprecate).
- `metric_field` text NULL — tên chỉ số nếu `chu_ky_loai='metric'` (`gio_chay|so_lan|km`).
- `noi_dung` text NOT NULL — mô tả công việc PM (checklist rút gọn).
- `nguoi_phu_trach_id` uuid NULL REFERENCES `nhan_vien(id)` — mặc định assignee.
- `lan_gan_nhat_at` timestamptz NULL — set khi hoàn thành công việc PM gần nhất.
- `lan_gan_nhat_metric` numeric NULL — snapshot counter tại lần hoàn thành.
- `active` bool NOT NULL DEFAULT true — pause/resume không xoá.
- `advance_days` int NOT NULL DEFAULT 7 — sinh trước hạn N ngày để lịch được nhìn thấy.

## 2. Đối tượng áp dụng (scope của 1 chính sách)

Đúng 1 trong 4 scope (đã có sẵn cột):

- `thiet_bi_id`: 1 tài sản cụ thể.
- `model_id`: mọi tài sản có `model_id` này.
- `loai_thiet_bi_id`: mọi tài sản cùng loại.
- `he_thong_id`: cấp hệ thống (không lan xuống tài sản trừ khi có flag `apply_to_children`).

Ưu tiên khi 1 tài sản khớp nhiều policy: `thiet_bi > model > loai > he_thong`; dùng cột `priority` int tie-break.

## 3. Luật tính kỳ hạn kế tiếp — `nextDueDate(policy, lastDone?)`

Trả về `Date | null`.

- Không có `lastDone` (chưa từng làm PM):
  - `time`: `han = lastDone ?? policy.created_at + chu_ky_gia_tri days`. Nếu tài sản có `ngay_dua_vao_khai_thac`, dùng ngày đó thay cho `created_at`.
  - `metric`: `han` phụ thuộc counter — set `han = now + advance_days` khi counter hiện tại ≥ `chu_ky_gia_tri`; nếu chưa đủ thì null (chờ counter).
- Có `lastDone`:
  - `time`: `han = lastDone + chu_ky_gia_tri days`.
  - `metric`: `han = ngay counter hiện tại đạt lan_gan_nhat_metric + chu_ky_gia_tri` (ước lượng bằng rate giờ chạy/ngày trung bình 30 ngày gần nhất, hoặc null nếu không đủ dữ liệu — dùng flag `estimated`).
- Bỏ qua `chu_ky_gia_tri <= 0`.
- Idempotent + pure.

**Trạng thái công việc** — `pm_cong_viec.trang_thai` enum: `sap_den_han` (trong `advance_days`) · `den_han` (đúng/ vượt `han` ≤ 3 ngày) · `qua_han` (`> 3` ngày) · `dang_thuc_hien` (khi user pick up) · `hoan_thanh` · `bo_qua` (skip có lý do, ghi `bao_tri` với action=`bo_qua_pm`).

## 4. Bảng `pm_cong_viec`

```sql
CREATE TABLE public.pm_cong_viec (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  chinh_sach_id uuid NOT NULL REFERENCES bao_tri_chinh_sach(id) ON DELETE CASCADE,
  doi_tuong_type text NOT NULL CHECK (doi_tuong_type IN ('thiet_bi','he_thong')),
  doi_tuong_id  uuid NOT NULL,                    -- id trong thiet_bi hoặc dm_he_thong
  don_vi_id     uuid NOT NULL REFERENCES dm_don_vi(id),
  han           date NOT NULL,
  ky_hieu_han   text NOT NULL,                    -- mã kỳ hạn deterministic để chống trùng
  trang_thai    text NOT NULL DEFAULT 'sap_den_han',
  nguoi_phu_trach_id uuid REFERENCES nhan_vien(id),
  ghi_chu       text,
  bao_tri_id    uuid REFERENCES bao_tri(id),      -- link tới bản ghi Sổ lý lịch khi hoàn thành
  hoan_thanh_at timestamptz,
  bo_qua_ly_do  text,
  estimated     boolean NOT NULL DEFAULT false,   -- true khi hạn được ước lượng từ metric
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now(),
  UNIQUE (chinh_sach_id, doi_tuong_id, ky_hieu_han)
);
```

`ky_hieu_han` = `format('%s-%s', chu_ky_loai, YYYYMMDD han)` cho `time`; cho `metric` dùng `format('m-%s-%s', metric_field, floor(threshold))`. Giúp `INSERT ... ON CONFLICT DO NOTHING` idempotent khi cron chạy nhiều lần.

**RLS**:
- SELECT: cùng `don_vi_id` với scope của user (`user_scope`) HOẶC `has_role admin|phong_kt`.
- INSERT: chỉ qua RPC `pm_sinh_cong_viec` (SECURITY DEFINER) — user thường không insert trực tiếp.
- UPDATE: `admin|phong_kt` HOẶC `nguoi_phu_trach_id = auth.uid()` và chỉ đổi `trang_thai` giữa các state hợp lệ.
- DELETE: không cho phép.

**GRANT**: `SELECT, UPDATE ON pm_cong_viec TO authenticated; ALL TO service_role`.

## 5. Sinh công việc — `pm_sinh_cong_viec(as_of date DEFAULT current_date)`

RPC SECURITY DEFINER:
1. Với mỗi `bao_tri_chinh_sach WHERE active`:
   - Resolve danh sách target theo scope + priority.
   - Với mỗi target: gọi `next_due_date(policy, last_done)` để tính `han`.
   - Nếu `han <= as_of + advance_days` → `INSERT INTO pm_cong_viec (...) ON CONFLICT DO NOTHING`.
2. Cập nhật `trang_thai` cho các row hiện có:
   - `han BETWEEN as_of AND as_of + advance_days` → `sap_den_han` (nếu đang draft).
   - `han BETWEEN as_of - 3 AND as_of` → `den_han`.
   - `han < as_of - 3` → `qua_han`.
3. Trả `{ created: n, updated: m }`.

**Chạy khi nào**:
- Cron `pg_cron` gọi TanStack route `/api/public/hooks/pm-generate` mỗi ngày 06:00. Route xác thực `apikey` (anon key), gọi RPC.
- Ngoài ra, khi vào trang `/bao-tri/cong-viec` sẽ trigger `pm_sinh_cong_viec(current_date)` (throttle 5 phút qua cache) để user không phải chờ cron.

## 6. Hoàn thành công việc — `completeTask(taskId, payload)`

**KHÔNG** tạo nguồn dữ liệu song song. `bao_tri` là Sổ lý lịch chính; `pm_cong_viec` chỉ là hàng đợi.

Chữ ký:
```ts
completeTask(taskId, {
  thuc_hien_at: string;        // ISO date
  nguoi_thuc_hien_id: string;
  ket_qua: string;
  van_de_phat_hien?: string;
  vat_tu_thay_the?: Array<{ vat_tu_id: string; so_luong: number }>;
  attachments?: string[];
}) → Promise<{ bao_tri_id, next_pm_id }>
```

RPC `pm_hoan_thanh_cong_viec` (SECURITY DEFINER):
1. Kiểm tra `pm_cong_viec` tồn tại, `trang_thai ∈ (sap_den_han, den_han, qua_han, dang_thuc_hien)`.
2. Kiểm caller có quyền edit trên đối tượng (RLS `bao_tri`).
3. INSERT vào `bao_tri` với `chinh_sach_id`, `pm_cong_viec_id`, mọi payload. Trigger `audit_row_change` ghi audit.
4. UPDATE `pm_cong_viec`: `trang_thai='hoan_thanh'`, `bao_tri_id`, `hoan_thanh_at=now()`.
5. UPDATE `bao_tri_chinh_sach.lan_gan_nhat_at = payload.thuc_hien_at`, `lan_gan_nhat_metric = metric hiện tại`.
6. Tính `next_due` và INSERT `pm_cong_viec` kế tiếp (ON CONFLICT DO NOTHING).
7. Trả về `bao_tri_id` + `next_pm_id`.

**Skip / Bỏ qua** — `pm_bo_qua_cong_viec(taskId, ly_do)`: ghi `bao_tri` với `loai='bo_qua_pm'` + `ghi_chu=ly_do`; trạng thái `pm_cong_viec='bo_qua'`; vẫn cập nhật `lan_gan_nhat_at` để tránh sinh lại ngay. Cần role `admin|phong_kt` (không cho ktv skip).

## 7. UI

- `/bao-tri/ke-hoach` (rebranding `/admin/bao-tri-chinh-sach` hoặc thêm route mới; **cần cập nhật `nav-contract` KÈM test**):
  - CRUD chính sách; form chọn scope + chu_ky_loai + gia_tri + metric_field + noi_dung + nguoi_phu_trach.
  - Preview: liệt kê target sau khi resolve, cho tick tài sản loại trừ.
  - Nút "Sinh công việc ngay" (gọi `pm_sinh_cong_viec`).
- `/bao-tri/cong-viec` (đã có, mở rộng):
  - Tabs / filter chip: **Đến hạn tuần này** (`han` trong 7 ngày, trạng thái `sap_den_han|den_han`), **Quá hạn** (`qua_han`), **Đã hoàn thành**, **Tất cả**.
  - Cột: đối tượng · nội dung · chu kỳ · hạn · trạng thái · phụ trách · badge estimated.
  - Row action: **Hoàn thành** (mở form ghi kết quả → gọi `pm_hoan_thanh_cong_viec`), **Bỏ qua** (chỉ admin/phong_kt), **Xem chính sách**, **Xem lịch sử** (link tab lịch sử của tài sản với filter chinh_sach_id).
- Widget dashboard: đếm quá hạn theo đơn vị, đưa vào Overview.

## 8. Test — DoD

**Unit** `src/lib/mirats/__tests__/pm-schedule.test.ts`:
- `nextDueDate` time: chưa có lastDone → dùng `ngay_dua_vao_khai_thac` hoặc created_at + N; có lastDone → +N; edge: N=0/âm/null.
- `nextDueDate` metric: không đủ dữ liệu counter → null + `estimated=true`; đủ → hạn hợp lý.
- `generateDueTasks(policies, targets, as_of)`: trả danh sách task với `ky_hieu_han` deterministic; gọi 2 lần cùng input → set task giống hệt (idempotent).
- Status transition rules (sap_den_han → den_han → qua_han) đúng theo `as_of`.
- `completeTask` (mock supabase):
  - Insert `bao_tri` với đúng field.
  - Update `pm_cong_viec` state=hoan_thanh + link bao_tri_id.
  - Update policy.lan_gan_nhat_at.
  - Sinh task kế tiếp; nếu policy inactive → không sinh.
- `skipTask`: caller role `ktv` → error; admin/phong_kt → ok, ghi bao_tri loại `bo_qua_pm`.
- Priority resolution: 1 tài sản khớp 3 policy → chọn scope hẹp nhất.

**pgTAP** `supabase/tests/pm_no_duplicate.sql`:
1. Seed 1 policy chu_ky_ngay=30, 1 tài sản, run `pm_sinh_cong_viec` 3 lần cùng ngày → chỉ 1 row `pm_cong_viec`.
2. Complete task → policy `lan_gan_nhat_at` update; task mới có `han = lan_gan_nhat + 30`.
3. `bao_tri` có 1 dòng mới, `audit_log` có 2 dòng (insert bao_tri + update pm_cong_viec).
4. RLS: user đơn vị A không thấy task của đơn vị B.
5. Skip task bởi `ktv` → RLS/RPC error.

**Regression** phải xanh: `bao-tri-consistency`, `bao-tri-form`, `bao-tri-kpi`, `cong-viec-hoan-thanh`, `chu-ky`, `duyet-ky`, `taxonomy-invariant`, `rls_cross_unit`, `nav-contract`, `nav-config`, `route-smoke`.

## 9. Rủi ro & giảm thiểu

| Rủi ro | Giảm thiểu |
|---|---|
| Trùng lặp với `cong_viec_bao_tri` hiện có | `pm_cong_viec` là hàng đợi PM; `cong_viec_bao_tri` là công việc thi công user tự tạo — có thể link `cong_viec_bao_tri.pm_cong_viec_id` nếu cần, không merge |
| Counter `gio_chay` không được cập nhật đều → hạn metric drift | Flag `estimated=true` + hiện badge trong UI; cho phép user gõ counter tay khi hoàn thành |
| Nhiều policy chồng chéo | Resolver priority + test; UI cảnh báo trước khi lưu policy nếu overlap |
| Cron fail → không sinh task | Trigger fallback khi vào `/bao-tri/cong-viec` (throttle) |
| Migrate `chu_ky_ngay` cũ | Migration backfill: `chu_ky_ngay → chu_ky_loai='time', chu_ky_gia_tri=chu_ky_ngay`; giữ cột cũ 1 release để rollback |
| Skip PM để né chỉ số | Chỉ admin/phong_kt skip; ghi audit + report tuần |
| RLS `pm_cong_viec` chặn assignee ngoài đơn vị | Cho phép read khi `nguoi_phu_trach_id = auth.uid()` bất kể đơn vị |

## 10. Câu hỏi làm rõ

1. **Đồng ý mở rộng `bao_tri_chinh_sach`** (thêm `chu_ky_loai`/`chu_ky_gia_tri`/`noi_dung`…) thay vì tạo bảng mới `pm_ke_hoach`? Ưu điểm: không phá dữ liệu + trang admin hiện có tiếp tục dùng.
2. **`advance_days` mặc định 7 ngày** ổn không? Muốn config theo policy hay per-user preference?
3. **Ngưỡng quá hạn 3 ngày** trước khi chuyển `qua_han` — giữ hay muốn 1 ngày?
4. **`bo_qua_pm`** có gọi qua CR (N2 change-request) không, hay chấp nhận admin/phong_kt trực tiếp?
5. **Nguồn counter metric**: dùng `thiet_bi_do_dac` hay `thiet_bi.thuoc_tinh.gio_chay`? Có cần thiết bị đo bên ngoài đẩy vào không?
6. **Nav**: thêm route `/bao-tri/ke-hoach` (kèm cập nhật `nav-contract` + test) hay giữ nguyên `/admin/bao-tri-chinh-sach`?
7. **Auto-assign nguoi_phu_trach**: nếu policy có sẵn thì dùng; nếu không, có cần auto-assign theo phân công đơn vị/ca không?
8. **Thông báo**: có gửi Telegram/in-app khi có task `qua_han` không (tái dùng pipeline N4 roadmap cảnh báo)?

---

**Dừng — chờ duyệt spec + trả lời câu hỏi trước khi sang BƯỚC 2 (TDD).**

## 11. Alternative — tách hẳn `pm_ke_hoach`

Nếu bạn muốn bảng riêng theo yêu cầu gốc:
- `pm_ke_hoach(id, doi_tuong_type, doi_tuong_id, chu_ky_loai, chu_ky_gia_tri, noi_dung, nguoi_phu_trach_id, lan_gan_nhat_at)`.
- `bao_tri_chinh_sach` chuyển vai trò → template/mẫu tái dùng.
- Cần migration copy dữ liệu hiện có sang `pm_ke_hoach`.
Chi phí lớn hơn, nhưng tách rõ concern. Chờ quyết định ở câu hỏi §10.1.
