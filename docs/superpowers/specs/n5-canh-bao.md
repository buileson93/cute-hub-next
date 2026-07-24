# N5 — Cảnh báo chủ động & Trung tâm thông báo (SPEC-only)

> Trạng thái: **DRAFT — chờ duyệt**. Không viết code sản phẩm cho tới khi được `OK` từ chủ dự án. Áp dụng Superpowers: brainstorming → writing-plans → TDD → verification.

## 1. Mục tiêu

Biến ba màn hiện có (Giấy phép, Kiểm định/Hiệu chuẩn, Sắp hết hạn) thành **hệ cảnh báo chủ động**:

- Sinh thông báo tại các **ngưỡng nhắc** trước khi hết hạn (mặc định **30 / 15 / 7** ngày).
- Đẩy thông báo vào **trung tâm thông báo in-app** (chuông ở header) + **hàng chờ email** (không gửi trực tiếp, chỉ enqueue).
- Cung cấp **bảng điều khiển "Tuân thủ"** tổng hợp sắp/đã hết hạn theo đơn vị.
- Không thay đổi **nguồn dữ liệu ngày hết hạn** hiện có (SSoT).

## 2. Nguồn dữ liệu ngày hết hạn (SSoT)

Không tạo cột hạn mới. Cảnh báo đọc từ các nguồn hiện có:

| Loại cảnh báo | Bảng nguồn / View | Cột hạn | Đối tượng gắn kết |
|---|---|---|---|
| `bao_hanh` | `thiet_bi` (qua view `v_sap_het_han`) | `han_bao_hanh` | `thiet_bi.id` |
| `giay_phep` | `giay_phep` + `giay_phep_khai_thac` (qua view `v_giay_phep`) | `ngay_het_han` | `thiet_bi_id` **hoặc** `he_thong_id` |
| `chung_chi_kd` | `chung_chi_thiet_bi` (loai `KIEM_DINH`) qua `v_sap_het_han` | `ngay_het_han` | `thiet_bi_id` |
| `chung_chi_hc` | `chung_chi_thiet_bi` (loai `HIEU_CHUAN`) qua `v_sap_het_han` | `ngay_het_han` | `thiet_bi_id` |

Ràng buộc:
- Bản ghi `bi_thay_the = true` (giấy phép cũ đã bị GP mới ghi đè) **không** sinh cảnh báo.
- Chứng chỉ chỉ sinh cảnh báo cho tài sản có `che_do_kd_hc <> 'KHONG'`.
- Đọc luôn qua module thuần `src/lib/mirats/han-canh-bao.ts` (đã tồn tại) — không hard-code ngưỡng ở nơi khác.

## 3. Ngưỡng nhắc

- Mặc định: **[30, 15, 7]** ngày còn lại (thay bộ 30/60/90 cũ **chỉ trong phạm vi thông báo N5**; module `han-canh-bao.ts` giữ nguyên cho legacy KPI, N5 dùng bộ riêng `NGUONG_THONG_BAO`).
- **Cấu hình được**: bảng `thong_bao_cau_hinh` (một dòng "mặc định" + có thể ghi đè theo `don_vi_id` hoặc theo `loai`). Admin/`phong_kt` chỉnh qua trang Cài đặt → Cảnh báo.
- Escalation: mỗi (đối tượng + loại + ngưỡng) **chỉ sinh 1 thông báo**; job chạy lại không trùng (khoá `khoa_chong_trung`).
- Bổ sung ngưỡng "đã hết hạn": khi `so_ngay_con_lai < 0` sinh thông báo `muc_do='overdue'` một lần khi vừa vượt hạn (khoá riêng `overdue`).

## 4. Schema mới

### 4.1 `public.thong_bao`

Cột chính:

- `id UUID PK default gen_random_uuid()`
- `loai TEXT NOT NULL` — enum-lite: `bao_hanh | giay_phep | chung_chi_kd | chung_chi_hc | he_thong | khac`
- `doi_tuong_bang TEXT NOT NULL` — ví dụ `thiet_bi`, `giay_phep`, `chung_chi_thiet_bi`, `he_thong`
- `doi_tuong_ref UUID NOT NULL` — id bản ghi nguồn
- `don_vi_id UUID NULL REFERENCES dm_don_vi(id)` — snapshot để lọc/RLS scope
- `muc_do TEXT NOT NULL CHECK (muc_do IN ('info','warning','critical','overdue'))`
- `nguong INT NULL` — số ngày ngưỡng khi tạo (30/15/7 hoặc NULL cho `overdue`)
- `tieu_de TEXT NOT NULL`
- `noi_dung TEXT NOT NULL`
- `den_han_at DATE NOT NULL` — ngày hết hạn của đối tượng
- `khoa_chong_trung TEXT NOT NULL UNIQUE` — `{loai}|{doi_tuong_ref}|{den_han_at}|{nguong|'overdue'}`
- `da_doc BOOLEAN NOT NULL DEFAULT false`
- `da_doc_at TIMESTAMPTZ NULL`
- `da_doc_boi UUID NULL`
- `kenh JSONB NOT NULL DEFAULT '{"in_app":true,"email":false}'::jsonb`
- `email_queued BOOLEAN NOT NULL DEFAULT false`
- `nguoi_nhan UUID NULL` — nếu NULL: broadcast theo `don_vi_id` + role
- `created_at`, `updated_at` chuẩn

Chỉ mục:
- `UNIQUE (khoa_chong_trung)` chống trùng.
- `INDEX (nguoi_nhan, da_doc, created_at DESC)` cho query chuông.
- `INDEX (don_vi_id, da_doc)`.
- `INDEX (den_han_at)`.

RLS:
- `SELECT`: người nhận trực tiếp (`nguoi_nhan = auth.uid()`) HOẶC (`nguoi_nhan IS NULL` AND user thuộc `don_vi_id` qua `user_scope`) HOẶC admin.
- `UPDATE`: chỉ đổi `da_doc`/`da_doc_at`/`da_doc_boi` cho chính người nhận (hoặc admin).
- `INSERT`/`DELETE`: chỉ `service_role` (job) và admin.

### 4.2 `public.thong_bao_cau_hinh`

- `id UUID PK`
- `scope TEXT NOT NULL CHECK (scope IN ('global','don_vi','loai'))`
- `don_vi_id UUID NULL`
- `loai TEXT NULL` — nếu `scope='loai'`
- `nguong INT[] NOT NULL DEFAULT ARRAY[30,15,7]`
- `email_enabled BOOLEAN NOT NULL DEFAULT false`
- `in_app_enabled BOOLEAN NOT NULL DEFAULT true`
- `updated_by UUID`, `updated_at`
- `UNIQUE (scope, don_vi_id, loai)` (một dòng mặc định `scope='global'`).

RLS: đọc mọi authenticated; ghi chỉ admin.

### 4.3 `public.thong_bao_email_queue`

Chỉ **enqueue**, chưa gửi (tích hợp nhà cung cấp email làm ở prompt riêng).

- `id UUID PK`
- `thong_bao_id UUID NOT NULL REFERENCES thong_bao(id) ON DELETE CASCADE`
- `to_email TEXT NOT NULL`
- `subject TEXT NOT NULL`
- `body TEXT NOT NULL`
- `trang_thai TEXT NOT NULL DEFAULT 'pending' CHECK (trang_thai IN ('pending','sent','failed','skipped'))`
- `attempt INT NOT NULL DEFAULT 0`
- `last_error TEXT`
- `created_at`, `sent_at`

RLS: chỉ `service_role`/admin.

## 5. Kiến trúc code

```
src/lib/mirats/
  canh-bao.ts                 # NEW: pure logic buildAlerts()
  __tests__/canh-bao.test.ts  # NEW
```

Không thay `canh-bao-het-han.ts` cũ (được tái sử dụng cho KPI/nhãn "sắp hết hạn" theo bộ 30/60/90).

### 5.1 API thuần

```ts
export interface AlertItem {
  loai: 'bao_hanh' | 'giay_phep' | 'chung_chi_kd' | 'chung_chi_hc';
  doi_tuong_bang: string;
  doi_tuong_ref: string;
  don_vi_id: string | null;
  ten: string | null;
  ngay_het_han: string;   // YYYY-MM-DD
}

export interface AlertOut extends AlertItem {
  so_ngay_con_lai: number;
  nguong: number | 'overdue';
  muc_do: 'info'|'warning'|'critical'|'overdue';
  khoa_chong_trung: string;
  tieu_de: string;
  noi_dung: string;
}

export function daysRemaining(ngayHetHan: string, now?: Date): number;
export function pickThreshold(soNgay: number, thresholds: number[]): number | null;
export function buildAlerts(
  items: AlertItem[],
  opts: { thresholds: number[]; now?: Date }
): AlertOut[];
```

Ràng buộc hành vi:
- `daysRemaining` dùng giờ VN (Asia/Ho_Chi_Minh) — reuse `ngayTheoMuiGio` từ `canh-bao-het-han.ts` để tránh drift.
- `pickThreshold` chọn ngưỡng nhỏ nhất ≥ số ngày còn lại; trả `null` nếu > max hoặc < 0.
- `buildAlerts` sinh **1 dòng cho mỗi (item, ngưỡng chạm)**; không sinh cho ngưỡng đã vượt (đã tạo dòng ở ngưỡng nhỏ hơn) — chống trùng qua `khoa_chong_trung`.
- Với `so_ngay_con_lai < 0`: tạo dòng `muc_do='overdue'`, `nguong='overdue'`.
- Mức độ: `nguong=30 → info`, `15 → warning`, `7 → critical`, `overdue → overdue`.

### 5.2 Job quét định kỳ

- Server function `src/lib/mirats/canh-bao.functions.ts`: `scanAndEnqueueAlerts()` chạy dưới `service_role`.
- Cron `pg_cron` mỗi ngày 06:00 giờ VN gọi route công khai `/api/public/hooks/scan-canh-bao` (bảo mật bằng `apikey` anon key theo chuẩn `schedule-jobs-modern`).
- Bước xử lý:
  1. Đọc `v_sap_het_han` + `v_giay_phep` (đã có, respect RLS invoker), gộp thành `AlertItem[]`.
  2. Đọc cấu hình ngưỡng từ `thong_bao_cau_hinh`.
  3. `buildAlerts` → upsert vào `thong_bao` theo `khoa_chong_trung` (ON CONFLICT DO NOTHING).
  4. Với dòng mới + `email_enabled=true`: giải quyết người nhận (owner `don_vi`) và enqueue `thong_bao_email_queue`.
  5. Ghi metric số dòng mới vào `audit_log` (source `n5.canh_bao.scan`).

### 5.3 UI

- **Chuông ở header**: badge số `da_doc=false` theo user hiện tại (realtime qua Supabase channel `thong_bao`).
- **Trung tâm thông báo** `/thong-bao`:
  - Danh sách gom nhóm theo `loai` + đơn vị, filter mức độ/khoảng thời gian.
  - Nút "Đánh dấu đã đọc" (một dòng / tất cả), nút mở đối tượng gốc (deep-link tới trang chi tiết).
- **Trang Tuân thủ** `/tuan-thu`:
  - KPI: tổng sắp hết hạn theo `loai` + đơn vị, số quá hạn, số đã xử lý (đọc từ `thong_bao` + view `v_sap_het_han`).
  - Bảng theo đơn vị + drill-down.
- **Cài đặt → Cảnh báo**: form chỉnh `nguong[]`, bật/tắt kênh; chỉ admin ghi.

Nav: thêm mục `Thông báo` (icon chuông trong header) + link "Tuân thủ" ở nhóm "Giám sát"; cập nhật `nav-config.ts` **kèm test** theo ràng buộc nav-contract.

## 6. Kênh gửi

- **In-app**: bản ghi `thong_bao` là kênh chính; đọc realtime qua Supabase Realtime channel.
- **Email**: chỉ **enqueue** vào `thong_bao_email_queue`. Không gửi trực tiếp trong N5; tích hợp nhà cung cấp email (Lovable Emails / Resend) làm ở **prompt riêng** như yêu cầu.

## 7. Test plan (RED trước)

`src/lib/mirats/__tests__/canh-bao.test.ts`:

1. `daysRemaining` — 3 case: cùng ngày VN, lệch múi giờ, ngày quá khứ (âm).
2. `pickThreshold` — chọn ngưỡng nhỏ nhất ≥ số ngày; `null` khi vượt max; `null` khi âm.
3. `buildAlerts`:
   - Item hết hạn sau 31 ngày → **không** cảnh báo (chưa chạm 30).
   - Item hết hạn sau 30 ngày → 1 dòng `nguong=30`, `muc_do=info`.
   - Item hết hạn sau 8 ngày → 1 dòng `nguong=15` (không sinh thêm dòng ngưỡng 30 vì đã qua).
   - Item hết hạn sau 5 ngày → 1 dòng `nguong=7`, `muc_do=critical`.
   - Item quá hạn 2 ngày → 1 dòng `nguong=overdue`, `muc_do=overdue`.
   - Chạy `buildAlerts` **hai lần** trên cùng input → set `khoa_chong_trung` không có trùng (idempotent).
   - `thresholds` tuỳ biến `[10,3]` áp dụng đúng.
4. Regression: mọi test hiện có (`canh-bao-het-han.test.ts`, `expiring.test.ts`, `kiem-dinh.test.ts`, `nav-config.test.ts`, `badges.test.ts`, `metrics.test.ts`) vẫn xanh.

pgTAP (tuỳ khả năng):
- `thong_bao` RLS: user ngoài đơn vị không SELECT được dòng broadcast; chỉ đánh dấu đọc dòng của chính mình.
- Unique `khoa_chong_trung` chặn insert trùng.

## 8. Ràng buộc & tương thích

- **Không đổi** nguồn dữ liệu hạn (không thêm cột `han_*` mới).
- **Không đổi** bộ ngưỡng KPI legacy 30/60/90 trong `han-canh-bao.ts` (dùng cho nhãn "sắp hết hạn").
- Bộ ngưỡng thông báo N5 **độc lập** (mặc định 30/15/7, cấu hình được).
- RLS là chốt cuối; job chạy `service_role` chỉ qua route bảo vệ.
- `audit_log` ghi mọi thay đổi cấu hình + số dòng scan sinh ra.
- Không thay `nav-contract.ts` khi chưa có test đặc tả; thêm entry mới phải có test.

## 9. Câu hỏi làm rõ (chờ trả lời trước khi sang BƯỚC 2)

1. **Ngưỡng mặc định 30/15/7** đã ổn hay muốn `60/30/14/7`? Có cần ngưỡng "T-1 ngày" cho `critical`?
2. **Người nhận in-app**: broadcast theo `don_vi_id` (mọi user thuộc đơn vị) hay chỉ role cụ thể (`phong_kt`, `admin`, `truong_don_vi`)?
3. **Quá hạn (`overdue`)**: 1 dòng duy nhất khi vừa vượt, hay nhắc lại theo lịch (ví dụ mỗi 7 ngày quá hạn)?
4. **Cấu hình theo đơn vị / theo loại**: có cho phép override cả hai chiều không, hoặc chỉ 1 cấp override?
5. **Email**: đối tượng nhận email mặc định là ai (owner đơn vị? tất cả `phong_kt`?) — cần một field `roles_nhan` trong `thong_bao_cau_hinh` hay lấy cứng theo role?
6. **Xoá thông báo**: cho phép user xoá dòng đã đọc, hay chỉ archive tự động sau N ngày (mặc định 90)?
7. **Deep-link**: từ dòng thông báo nên mở trang chi tiết `thiet_bi`, trang `giay_phep`, hay tab "Lý lịch" của thành phần liên quan?
8. **Realtime**: dùng Supabase Realtime channel trực tiếp trên bảng `thong_bao` (đơn giản) hay qua Postgres NOTIFY + edge? (Đề xuất: Realtime trực tiếp.)
9. **Trang Tuân thủ**: có cần export CSV/PDF ngay ở N5, hay để N11 (Dashboard KPI) xử lý?

---

Chờ `OK` + trả lời câu hỏi để tôi chuyển sang **BƯỚC 2 (TDD RED→GREEN→REFACTOR)** đúng theo lộ trình đã liệt kê.
