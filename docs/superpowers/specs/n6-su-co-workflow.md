# N6 — Vòng đời sự cố / hỏng hóc (State Machine) — SPEC-only

> Trạng thái: **DRAFT — chờ duyệt**. Không viết code sản phẩm cho tới khi được `OK`. Áp dụng Superpowers: brainstorming → writing-plans → TDD → verification.

## 1. Mục tiêu

Chuẩn hoá luồng xử lý sự cố (`su_co`) và hỏng hóc (`hong_hoc`) trong Sổ lý lịch bằng **một máy trạng thái duy nhất** với ma trận chuyển hợp lệ, dấu vết audit đầy đủ, và tính được **thời gian phản hồi / thời gian sửa / downtime** cho N9 (KPI).

**Không tạo bảng dữ liệu song song với Sổ lý lịch**: sự cố vẫn ghi vào `su_co`; hỏng hóc vào `hong_hoc`. Máy trạng thái chỉ bổ sung cột trạng thái chuẩn + bảng lịch sử chuyển trạng thái.

## 2. Sáu trạng thái chuẩn

Enum `su_co_trang_thai` (chuỗi ổn định, không đổi giá trị đã dùng):

| # | Mã | Nhãn | Ý nghĩa |
|---|---|---|---|
| 1 | `bao_cao`      | Đã báo cáo         | Người dùng vừa tạo báo cáo; chưa có ai tiếp nhận. |
| 2 | `tiep_nhan`    | Đã tiếp nhận       | Có `nguoi_tiep_nhan`; **mốc SLA phản hồi** kết thúc ở đây. |
| 3 | `dang_xu_ly`   | Đang xử lý         | Đội kỹ thuật bắt đầu can thiệp tại chỗ; **downtime bắt đầu**. |
| 4 | `cho_vat_tu`   | Chờ vật tư (tạm dừng) | Chờ linh kiện/giấy phép; **downtime vẫn tính**, nhưng "thời gian tay-nghề" tạm dừng. |
| 5 | `hoan_thanh`   | Hoàn thành xử lý   | Kỹ thuật kết thúc thao tác; **downtime kết thúc**; chờ nghiệm thu. |
| 6 | `nghiem_thu`   | Đã nghiệm thu      | Trưởng đơn vị / phong_kt xác nhận đóng hồ sơ. Trạng thái **kết thúc** (terminal). |

Trạng thái phụ (không nằm trong hành trình chính, xử lý riêng):
- `huy`: huỷ toàn bộ (báo nhầm). Chỉ chuyển từ `bao_cao` hoặc `tiep_nhan`. Terminal.
- `mo_lai`: **không** là trạng thái riêng — thực hiện bằng cách chuyển `nghiem_thu → dang_xu_ly` với ghi chú `mo_lai=true` trong `su_co_lich_su.meta`.

## 3. Ma trận chuyển hợp lệ

`canTransition(from, to)` chỉ trả `true` với các cặp sau:

```
bao_cao      → tiep_nhan, huy
tiep_nhan    → dang_xu_ly, huy
dang_xu_ly   → cho_vat_tu, hoan_thanh
cho_vat_tu   → dang_xu_ly, hoan_thanh
hoan_thanh   → nghiem_thu, dang_xu_ly   -- (mở lại nếu nghiệm thu không đạt trước khi ký)
nghiem_thu   → dang_xu_ly                -- (mở lại sau nghiệm thu; ghi meta.mo_lai=true)
huy          → (terminal, không đi tiếp)
```

**Chặn nhảy cóc tuyệt đối**:
- `bao_cao → dang_xu_ly` ❌ (phải qua `tiep_nhan`)
- `bao_cao → hoan_thanh` ❌
- `tiep_nhan → hoan_thanh` ❌ (phải qua `dang_xu_ly`)
- `cho_vat_tu → nghiem_thu` ❌ (phải qua `hoan_thanh`)
- Trở về cùng trạng thái ❌ (`from === to`).

Ràng buộc vai trò (RLS + guard app):
- `tiep_nhan`, `dang_xu_ly`, `cho_vat_tu`, `hoan_thanh`: `phong_kt` hoặc `admin`.
- `nghiem_thu`: `truong_don_vi` của `don_vi_id` sở hữu, hoặc `admin`. Không được self-approve (người tiếp nhận ≠ người nghiệm thu).
- `huy`: người báo cáo (trong 24h) hoặc `admin`.
- Mở lại sau `nghiem_thu`: chỉ `admin`.

## 4. Trường thời gian & người phụ trách trên `su_co` / `hong_hoc`

Thêm cột (nullable, backfill bằng `ngay_phat_hien` / `created_at` cho dữ liệu cũ):

| Cột | Kiểu | Ý nghĩa |
|---|---|---|
| `trang_thai`           | `text` (đã có) — chuẩn hoá về enum trên; migration đưa giá trị cũ về `bao_cao` nếu không map được | |
| `nguoi_bao_cao_id`     | `uuid` | user tạo báo cáo (`auth.uid()` tại thời điểm insert) |
| `nguoi_tiep_nhan_id`   | `uuid` | được set khi vào `tiep_nhan` |
| `nguoi_xu_ly_chinh_id` | `uuid` | được set/đổi khi vào `dang_xu_ly` |
| `nguoi_nghiem_thu_id`  | `uuid` | set khi vào `nghiem_thu` |
| `at_bao_cao`           | `timestamptz` | = `ngay_phat_hien` (đã có với `su_co`) hoặc `created_at` |
| `at_tiep_nhan`         | `timestamptz` | mốc bắt đầu SLA phản hồi |
| `at_bat_dau_xu_ly`     | `timestamptz` | **downtime_start** |
| `at_hoan_thanh`        | `timestamptz` | **downtime_end** = `thoi_diem_khac_phuc` (giữ cột cũ; đồng bộ ở trigger) |
| `at_nghiem_thu`        | `timestamptz` | đóng hồ sơ |
| `at_huy`               | `timestamptz` | nếu huỷ |
| `tong_thoi_gian_cho_vat_tu_phut` | `int` | cộng dồn thời gian ở `cho_vat_tu` (để tách "downtime" và "wrench-time") |

Ghi chú:
- `hong_hoc.trang_thai` hiện có — mapping giá trị cũ về enum mới trong migration.
- `su_co.thoi_gian_gian_doan` (đã có) tiếp tục lưu số phút downtime tính từ `at_bat_dau_xu_ly → at_hoan_thanh`; trigger cập nhật.

## 5. Bảng `su_co_lich_su` (nguồn duy nhất cho lịch sử trạng thái)

```
id                 uuid pk default gen_random_uuid()
doi_tuong_bang     text not null check (doi_tuong_bang in ('su_co','hong_hoc'))
doi_tuong_id       uuid not null                       -- id của bản ghi su_co/hong_hoc
buoc               int  not null                       -- 1..n cho object, unique cùng doi_tuong
tu_trang_thai      text                                -- null với dòng khởi tạo (bao_cao)
den_trang_thai     text not null
nguoi              uuid                                -- auth.uid() thực hiện
at                 timestamptz not null default now()
ghi_chu            text
meta               jsonb not null default '{}'::jsonb  -- {mo_lai:true, ly_do_huy:'...'}
unique (doi_tuong_bang, doi_tuong_id, buoc)
index  (doi_tuong_bang, doi_tuong_id, at desc)
```

RLS:
- `SELECT`: user có quyền xem đối tượng gốc (join theo `don_vi_id` snapshot / `user_scope`).
- `INSERT`: chỉ qua RPC `su_co_transition()` (security definer); không cho INSERT trực tiếp.
- `UPDATE`/`DELETE`: chặn (immutable audit trail).

## 6. Downtime — định nghĩa dùng cho N9

- **`downtime_start`** = `at_bat_dau_xu_ly` (lần đầu vào `dang_xu_ly`).
- **`downtime_end`** = `at_hoan_thanh` (lần đầu vào `hoan_thanh` cuối cùng; nếu mở lại thì kết thúc mới).
- **`downtime_phut`** = `downtime_end − downtime_start` (phút, đã trừ hay không trừ `cho_vat_tu` là tuỳ KPI: mặc định **KHÔNG trừ**; xuất thêm `wrench_time_phut = downtime_phut − tong_thoi_gian_cho_vat_tu_phut`).
- **`response_time_phut`** = `at_tiep_nhan − at_bao_cao` (SLA phản hồi).
- **`repair_time_phut`** = `at_hoan_thanh − at_tiep_nhan`.
- **`ack_time_phut`** = alias của `response_time_phut` (dùng cho N9 dashboard).

Nếu vòng đời có nhiều lần `dang_xu_ly` (do mở lại): `downtime_phut` cộng dồn từng đoạn `dang_xu_ly → hoan_thanh` (tính từ `su_co_lich_su`, KHÔNG lưu tổng vào cột riêng để tránh drift).

## 7. RPC `su_co_transition(...)`

```
su_co_transition(
  _bang        text,          -- 'su_co' | 'hong_hoc'
  _id          uuid,
  _den         text,          -- trạng thái đích
  _ghi_chu     text default null,
  _meta        jsonb default '{}'::jsonb
) returns su_co_lich_su
```

Ngữ nghĩa (transaction):
1. `SELECT ... FOR UPDATE` bản ghi đích.
2. Đọc `tu = trang_thai` hiện tại.
3. Kiểm tra `canTransition(tu, _den)` ở DB (function `su_co_check_transition`) — raise `invalid_transition` nếu sai.
4. Kiểm tra vai trò người gọi (`auth.uid()` + `has_role` / `user_scope`).
5. `UPDATE su_co/hong_hoc SET trang_thai = _den, <mốc thời gian tương ứng> = now(), <người tương ứng> = auth.uid()`.
6. `INSERT INTO su_co_lich_su` (`buoc = coalesce(max,0)+1`).
7. `INSERT INTO audit_log` (source `n6.su_co.transition`, payload gồm tu/den/id).
8. Trả về dòng lịch sử vừa tạo.

Guard bổ sung:
- `nghiem_thu`: chặn nếu `nguoi_nghiem_thu_id = nguoi_tiep_nhan_id` (không self-approve).
- `huy` từ `tiep_nhan`: cho phép cả trong 24h kể từ `at_bao_cao` (người báo cáo) hoặc admin bất cứ lúc nào.

## 8. API/code shape (BƯỚC 2)

```
src/lib/mirats/
  su-co-workflow.ts               # pure state machine
  su-co-workflow.functions.ts     # RPC caller (createServerFn với requireSupabaseAuth)
  __tests__/su-co-state-machine.test.ts
```

`su-co-workflow.ts` (pure):

```ts
export type SuCoTrangThai =
  | 'bao_cao' | 'tiep_nhan' | 'dang_xu_ly'
  | 'cho_vat_tu' | 'hoan_thanh' | 'nghiem_thu' | 'huy';

export const TRANSITIONS: Record<SuCoTrangThai, SuCoTrangThai[]>;

export function canTransition(from: SuCoTrangThai, to: SuCoTrangThai): boolean;

export interface LichSuBuoc {
  tu: SuCoTrangThai | null;
  den: SuCoTrangThai;
  at: string; // ISO
}

export interface TimeMetrics {
  response_time_phut: number | null;   // bao_cao → tiep_nhan
  repair_time_phut: number | null;     // tiep_nhan → hoan_thanh cuối
  downtime_phut: number | null;        // Σ (dang_xu_ly → hoan_thanh)
  wait_parts_phut: number;             // Σ cho_vat_tu
  wrench_time_phut: number | null;     // downtime - wait_parts
}

export function computeMetrics(lich_su: LichSuBuoc[]): TimeMetrics;
```

## 9. UI (BƯỚC 2)

Không tạo trang mới — nâng cấp các trang có sẵn:

- `_app.su-co.index.tsx`, `_app.hong-hoc.tsx`: thêm **bộ lọc trạng thái** + view **Kanban** (mặc định vẫn là bảng; toggle "Kanban / Bảng").
- Trang chi tiết (`_app.su-co.$maSuCo.tsx`, `_app.hong-hoc.$maHongHoc.tsx`):
  - Panel **Vòng đời**: timeline 6 bước với dấu tick / current / disabled.
  - Nút hành động chỉ hiện các trạng thái đích hợp lệ theo `canTransition` + kiểm tra vai trò.
  - Panel **Chỉ số thời gian** (response / repair / downtime / chờ vật tư / wrench-time).
- Không thêm đường sửa dữ liệu song song — mọi cập nhật đi qua RPC `su_co_transition`.

## 10. Test plan (RED)

`src/lib/mirats/__tests__/su-co-state-machine.test.ts`:

1. **`canTransition` — cho phép hợp lệ**: mọi cạnh trong bảng §3 trả `true`.
2. **`canTransition` — chặn nhảy cóc**: 12 case bao gồm `bao_cao→dang_xu_ly`, `bao_cao→hoan_thanh`, `tiep_nhan→hoan_thanh`, `cho_vat_tu→nghiem_thu`, `hoan_thanh→huy`, `huy→*`, và mọi `from===to`.
3. **`canTransition` — trạng thái không tồn tại** → `false`, không throw.
4. **`computeMetrics`**:
   - Chuỗi thẳng `bao_cao(t=0) → tiep_nhan(t=10) → dang_xu_ly(t=20) → hoan_thanh(t=80)`: response=10p, repair=70p, downtime=60p, wait_parts=0, wrench=60p.
   - Có `cho_vat_tu`: `... → dang_xu_ly(20) → cho_vat_tu(30) → dang_xu_ly(50) → hoan_thanh(80)`: downtime=60p (20→80), wait_parts=20p (30→50), wrench=40p.
   - Mở lại sau `nghiem_thu`: `... → hoan_thanh(80) → nghiem_thu(90) → dang_xu_ly(120) → hoan_thanh(150)`: downtime=60+30=90p; repair tính tới `hoan_thanh` cuối.
   - Chưa hoàn thành: `downtime_phut`, `repair_time_phut` = `null`.
5. **Idempotency**: `computeMetrics([])` trả tất cả `null`/`0` không throw.
6. **Regression**: chạy toàn bộ test hiện có (`canh-bao-het-han`, `expiring`, `kiem-dinh`, `nav-config`, `badges`, `metrics`, v.v.) — phải xanh.

pgTAP (BƯỚC 2, khả năng):
- `su_co_transition` chặn cặp nhảy cóc → SQLSTATE `P0001` `invalid_transition`.
- RLS `su_co_lich_su`: user ngoài `don_vi` không SELECT được; INSERT trực tiếp bị chặn.
- Self-approve `nghiem_thu` bị chặn.

## 11. Ràng buộc

- **Không đổi nguồn dữ liệu** Sổ lý lịch (`su_co`/`hong_hoc` vẫn là bảng chính).
- Chỉ **chuyển trạng thái hợp lệ** — kiểm tra ở cả TypeScript (UI) và Postgres (RPC) — không dựa vào 1 lớp.
- **Mọi chuyển ghi audit**: bảng `su_co_lich_su` + `audit_log`.
- **Không nav mới** trừ khi có test đặc tả; hành động vòng đời gắn vào trang chi tiết hiện có.
- Backward-compat: giá trị `trang_thai` cũ được map trong migration (`'moi' → 'bao_cao'`, `'dang_xu_ly'` giữ nguyên, `'hoan_thanh' → 'hoan_thanh'`, `'da_dong'/'nghiem_thu' → 'nghiem_thu'`); giá trị không map được → `'bao_cao'`.

## 12. Câu hỏi làm rõ (chờ trả lời trước khi sang BƯỚC 2)

1. **Vai trò nghiệm thu** là `truong_don_vi` của đơn vị sở hữu, hay `phong_kt` cấp trên cũng được? Có yêu cầu 4-eyes (khác người tiếp nhận) như đề xuất?
2. **Huỷ (`huy`)**: cho người báo cáo huỷ trong bao lâu (đề xuất 24h)? Sau đó chỉ admin?
3. **Mở lại sau nghiệm thu**: chỉ admin, hay `truong_don_vi` cũng được?
4. **Downtime**: mặc định **không** trừ thời gian chờ vật tư khỏi `downtime_phut` (chỉ tách ra ở `wrench_time`) — đúng ý không? Hay muốn `downtime_phut` = wrench-time?
5. **Áp dụng cho `hong_hoc`**: có gộp cùng máy trạng thái này (đề xuất) hay `hong_hoc` chỉ có 3 trạng thái đơn giản (moi/dang_xu_ly/hoan_thanh)?
6. **Kanban**: bắt buộc ở BƯỚC 2 hay optional (chỉ bảng + filter trạng thái)? (Đề xuất: toggle, mặc định bảng.)
7. **Backfill trạng thái**: có bản ghi `su_co` cũ nào cần map thủ công (giá trị lạ) không, hay chấp nhận rơi về `bao_cao`?

---

Chờ `OK` + trả lời câu hỏi để chuyển sang **BƯỚC 2 (Migration + TDD)**.
