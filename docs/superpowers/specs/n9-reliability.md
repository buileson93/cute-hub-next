# N9 — Reliability: MTBF, MTTR, Availability (SPEC)

Trạng thái: DRAFT — chờ duyệt trước khi TDD.
Phụ thuộc: **N6** (máy trạng thái sự cố + `downtime_start`/`downtime_end`).

## 1. Mục tiêu

Tính và hiển thị các chỉ số độ tin cậy cho từng **thiết bị**, **thành phần hệ thống**, **hệ thống** và **đơn vị**, trong một khoảng thời gian tuỳ chọn. Kết quả xuất hiện ở:

- Dashboard N8 (KPI + top thiết bị/hệ thống kém tin cậy).
- Panel Lý lịch của thiết bị/thành phần (tab "Độ tin cậy").

## 2. Định nghĩa nguồn dữ liệu (SSoT)

Downtime lấy **duy nhất** từ máy trạng thái N6 trên `su_co`:

- `downtime_start` = `at_dang_xu_ly` (thời điểm chuyển sang `dang_xu_ly`).
- `downtime_end` = `at_hoan_thanh` (thời điểm chuyển sang `hoan_thanh`).
- Nếu sự cố đã `huy` mà chưa từng vào `dang_xu_ly` ⇒ **không tính downtime**.
- Nếu `hoan_thanh` bị mở lại (theo N6) ⇒ đoạn downtime tiếp theo bắt đầu từ lần `dang_xu_ly` mới, tạo **đoạn thứ hai** — không nối liền.
- `wrench_time` = `downtime` − thời gian ở trạng thái `cho_vat_tu` (thông tin phụ, không dùng cho công thức chính; tính từ `su_co_lich_su`).

Không dùng `hong_hoc.thoi_gian_gian_doan` như nguồn chính; chỉ dùng làm fallback lịch sử cho các bản ghi trước khi N6 áp dụng, và **đánh dấu** `nguon = 'legacy'` để không trộn lẫn thống kê.

## 3. Phạm vi (scope)

Một phép tính reliability luôn có 4 tham số:

1. `scope`: `thiet_bi` | `thanh_phan` | `he_thong` | `don_vi`.
2. `scope_id` (uuid) — hoặc `null` khi tổng hợp toàn hệ (chỉ dùng cho dashboard admin).
3. `from`, `to` (`timestamptz`) — khoảng quan sát. Mặc định 90 ngày gần nhất, TZ `Asia/Ho_Chi_Minh`.
4. `only_operational` (bool, default true) — chỉ tính khi thiết bị ở trạng thái "được kỳ vọng chạy" (không tính khoảng đang niêm cất/ngừng khai thác chủ động).

Với `thanh_phan`/`he_thong`/`don_vi`, sự cố quy về scope thông qua thiết bị liên kết: quan hệ `su_co.thiet_bi_id → thiet_bi → gan_chuc_nang → he_thong_thanh_phan → dm_he_thong → dm_don_vi`. Một sự cố **chỉ đếm 1 lần** ở mỗi scope (khử trùng theo `su_co.id`).

## 4. Công thức

Trong khoảng `[from, to]`, với tập sự cố `S` đã quy về scope và **cắt xén** (clip) `downtime_start/end` vào `[from, to]`:

- `downtime_seconds` = Σ max(0, min(downtime_end, to) − max(downtime_start, from)) trên `S`.
- `failures` = số sự cố có `downtime_start` trong `[from, to]` (đếm theo sự kiện bắt đầu; tránh đếm trùng khi cắt ngang biên).
- `operational_seconds` = tổng thời gian scope được kỳ vọng chạy trong `[from, to]`:
  - `thiet_bi`: `(to − from) − thời gian ở trạng thái "ngừng khai thác/niêm cất" theo `thiet_bi_vong_doi``.
  - `thanh_phan`/`he_thong`: tổng `operational_seconds` của các thiết bị đang lắp (không nhân đôi khi 1 tài sản lắp ở nhiều thành phần — dùng `distinct thiet_bi_id`).
  - `don_vi`: tương tự, cộng theo thiết bị thuộc đơn vị.
- `uptime_seconds` = max(0, `operational_seconds` − `downtime_seconds`).

Chỉ số:

- **MTBF** (Mean Time Between Failures) = `uptime_seconds / max(failures, 1)` (giây → giờ khi hiển thị). Khi `failures = 0`, hiển thị `≥ uptime_hours` với chú thích, không chia cho 0.
- **MTTR** (Mean Time To Repair) = `downtime_seconds / max(failures_closed, 1)`, với `failures_closed` = số sự cố **đã `hoan_thanh` trong `[from, to]`**. Sự cố còn mở không đóng góp MTTR (nhưng vẫn cộng phần downtime đã trôi qua).
- **Availability** = `uptime_seconds / operational_seconds` (0..1, hiển thị %). Nếu `operational_seconds = 0` ⇒ `null` ("không áp dụng").

Đơn vị hiển thị: MTBF/MTTR bằng **giờ** (1 chữ số thập phân); availability bằng **%** (2 chữ số thập phân).

### Ví dụ (dùng cho test)

Trong 30 ngày (2 592 000s), thiết bị X có 3 sự cố:

- S1: start=day 2, end=day 2 + 4h ⇒ downtime 14 400s, đã đóng.
- S2: start=day 10, end=day 10 + 2h ⇒ 7 200s, đã đóng.
- S3: start=day 25, chưa đóng, tính tới `to`=day 30 ⇒ 5×86 400 = 432 000s, chưa đóng.

- `downtime_seconds` = 453 600.
- `failures` = 3; `failures_closed` = 2.
- `operational_seconds` = 2 592 000 (không có khoảng niêm cất).
- `uptime` = 2 138 400 ⇒ **MTBF** = 2 138 400 / 3 = 712 800s ≈ **198.0 giờ**.
- **MTTR** = (14 400 + 7 200) / 2 = 10 800s = **3.0 giờ** (S3 chưa đóng nên không vào tử số/mẫu số MTTR).
- **Availability** = 2 138 400 / 2 592 000 ≈ **82.50%**.

Các số này là **oracle** của test đơn vị.

## 5. Kiến trúc tính toán

Hai lớp, cùng công thức, khác vị trí chạy:

### 5.1 Client pure (`src/lib/mirats/reliability.ts`)

Hàm thuần, không I/O, nhận danh sách sự kiện đã chuẩn hoá:

```ts
type FailureEvent = {
  id: string;
  downtime_start: Date;
  downtime_end: Date | null; // null = còn mở
  closed_at: Date | null; // thời điểm hoan_thanh (== downtime_end nếu đã đóng)
};

export function computeReliability(
  events: FailureEvent[],
  window: { from: Date; to: Date },
  operationalSeconds: number,
): {
  mtbf_h: number | null;
  mttr_h: number | null;
  availability: number | null;
  downtime_s: number;
  failures: number;
  failures_closed: number;
};
```

Dùng cho test đơn vị và cho hiển thị khi đã có sẵn danh sách sự cố (panel lý lịch của 1 thiết bị).

### 5.2 RPC tổng hợp (DB)

Cho dashboard/multi-scope, thêm RPC `SECURITY INVOKER`:

- `reliability_by_scope(p_scope text, p_scope_ids uuid[], p_from timestamptz, p_to timestamptz)`
  returns table(`scope_id uuid, downtime_s bigint, failures int, failures_closed int, operational_s bigint, mtbf_h numeric, mttr_h numeric, availability numeric`).
- `reliability_top_worst(p_scope text, p_don_vi_ids uuid[], p_from, p_to, p_limit int default 5)` — bảng top thiết bị/hệ thống kém tin cậy (thấp availability, cao MTTR).

RPC dùng cùng công thức §4; test pgTAP so sánh với oracle §4 (ví dụ đã cho).

## 6. Hiển thị

- **Dashboard N8**: 3 KPI mới (MTBF, MTTR, Availability) ở scope = đơn vị đang lọc; card "Top 5 thiết bị kém tin cậy".
- **Panel Lý lịch** (thiết bị/thành phần): tab "Độ tin cậy" với 3 số + biểu đồ đường downtime theo tháng (12 tháng gần nhất) + bảng sự cố đóng góp.
- Cho phép đổi cửa sổ 30/90/365 ngày; giá trị đồng bộ với filter dashboard nếu điều hướng qua deep-link.

## 7. Test kế hoạch (BƯỚC 2)

- `src/lib/mirats/__tests__/reliability.test.ts`: 6 case tối thiểu
  1. Không có sự cố ⇒ availability=1, MTTR=null, MTBF=`operational` (hoặc `null` khi `operational=0`).
  2. Ví dụ §4 ⇒ khớp đến 2 chữ số thập phân.
  3. Sự cố vắt ngang biên `from`/`to` ⇒ chỉ tính phần bên trong.
  4. Sự cố còn mở tại `to` ⇒ đóng góp downtime, không đóng góp MTTR.
  5. Sự cố `huy` trước khi vào `dang_xu_ly` ⇒ 0 đóng góp.
  6. Reopen: 2 đoạn downtime tách biệt ⇒ `failures=2`.
- (Nếu repo có pgTAP) `supabase/tests/reliability.sql` seed & so oracle §4 cho RPC.
- Không sửa test hiện có; giữ nav-contract nguyên vẹn.

## 8. Câu hỏi làm rõ

1. **`only_operational`**: dùng `thiet_bi_vong_doi` làm nguồn khoảng "kỳ vọng chạy", hay đơn giản hoá = toàn bộ `[from, to]` ở giai đoạn N9 và refine sau?
2. `failures` đếm theo **`downtime_start` in window** (đang đề xuất) hay theo **`at_bao_cao` in window**?
3. Sự cố còn mở ở `to` có nên trừ khỏi `failures_closed` (đang đề xuất) và **cũng loại khỏi** `failures` khi tính MTBF, hay giữ trong MTBF?
4. Scope `don_vi` khi thiết bị lắp ở **nhiều thành phần thuộc nhiều đơn vị** trong cùng khoảng thời gian: quy về đơn vị đang lắp tại thời điểm sự cố (đề xuất) hay đơn vị hiện tại?
5. Cho phép loại trừ `muc_do = 'thap'` khỏi thống kê (một số nơi coi lỗi cosmetic không phải failure)?
6. Ngưỡng "đáng lo" hiển thị màu đỏ ở dashboard: MTTR > 8h? Availability < 98%? (đề xuất, cần xác nhận)
7. Hiển thị `wrench_time` như một cột phụ ở tab Độ tin cậy hay để dành cho báo cáo riêng?

Chờ duyệt spec + trả lời câu hỏi trước khi sang BƯỚC 2 (test + code).
