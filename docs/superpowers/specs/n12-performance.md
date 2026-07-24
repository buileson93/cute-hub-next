# N12 — Performance ở quy mô lớn (SPEC)

Trạng thái: **DRAFT — chờ duyệt trước BƯỚC 2**
Phụ thuộc: không (cross-cutting). Ràng buộc: **không đổi hợp đồng dữ liệu/nav, không đổi ngữ nghĩa hiển thị**, mọi test hiện có phải xanh.

---

## 1. Mục tiêu

Giữ 3 bề mặt chính phản hồi tốt khi dữ liệu tăng lên hàng chục nghìn tài sản:

- **Bảng lớn**: `StandardTable`, `ThanhPhanTable`, `CatalogTable`.
- **Cây hệ thống**: `_app.he-thong.cay.tsx` (5 mức: Đơn vị → Nhóm → Hệ thống → Thành phần → Tài sản).
- **Tìm kiếm/lọc**: Command Palette + filter cột trong 3 view.

Ngưỡng chấp nhận (trên máy dev, dữ liệu mẫu lớn, xem §3):

| Bề mặt | Ngưỡng |
| --- | --- |
| First meaningful paint bảng 20k dòng | ≤ 800ms sau khi data sẵn sàng |
| Scroll bảng 20k dòng | ≥ 55fps, không jank khi kéo dài |
| Mở nhánh cây bất kỳ | ≤ 200ms server round-trip + ≤ 100ms render |
| Tìm kiếm cột (client-side, sau chỉ mục) | ≤ 50ms cho 20k dòng |
| Bộ nhớ tab | ≤ 350MB ổn định (không leak khi navigate qua lại) |

---

## 2. Điểm nghẽn hiện tại (giả thuyết, sẽ xác nhận bằng đo)

Chưa đo — BƯỚC 2 sẽ chạy seed + đo trước/sau. Giả thuyết dựa trên đọc mã:

1. **`StandardTable` render full DOM**: đã chuyển client-side filter toàn bộ dataset (theo lịch sử) → mọi dòng đều mount ⇒ với 20k dòng, hàng chục nghìn `<tr>` gây jank scroll & parse chậm.
2. **`ThanhPhanTable` (1170 rows hôm nay, sẽ 10k+)**: cascade filters + recursive fetch nạp 1 lần; không virtualize.
3. **`CatalogTable`**: cùng vấn đề, thêm cell rich (Combobox in edit mode).
4. **Cây hệ thống `_app.he-thong.cay.tsx` (5876 LOC)**: nhiều nhánh nạp eager; không có lazy per-node fetch → mở đơn vị lớn = nạp cả cây con.
5. **Tìm kiếm**: mỗi keystroke duyệt toàn bộ mảng + regex trên nhiều cột; không có chỉ mục pre-computed (normalized string cache).
6. **Loading/empty/error**: rải rác — có nơi spinner riêng, nơi trả `null`, nơi throw. Không có skeleton chung.

---

## 3. Bộ dữ liệu mẫu lớn (seed)

Script mới: `scripts/perf-seed.ts` (idempotent, có cờ `--wipe-perf`).

Tạo trên môi trường dev:

- 5 đơn vị `perf_*` (đánh cờ `is_perf_seed=true` qua namespace tên `PERF_`).
- 20 nhóm hệ thống, 200 hệ thống, 2.000 thành phần, **20.000 tài sản**.
- 100.000 dòng lịch sử (`audit_log`, `bao_tri`, `su_co` phân bố ngẫu nhiên).
- Xóa: `scripts/perf-seed.ts --wipe-perf` (chỉ dữ liệu có tiền tố `perf_`).

Chạy tách khỏi CI. Không đụng dữ liệu người dùng.

---

## 4. Chiến lược

### 4.1 Virtualization cho bảng lớn

- Thư viện: **`@tanstack/react-virtual`** (đã trong hệ TanStack, không thêm vendor mới lớn).
- Chuyển 3 bảng sang windowing theo hàng (row-virtualizer) trên container scroll cố định chiều cao.
- Giữ nguyên API props/columns hiện có → không đổi hợp đồng.
- Giữ header sticky; giữ hành vi selection, edit-mode, expand.
- Bật `overscan: 8`; đo lại nếu jank.

### 4.2 Lazy-load nhánh cây

- Cây chuyển sang model "load-on-expand":
  - Fetch mức 0 (đơn vị) khi vào trang.
  - Mỗi node giữ `children_count` (đã có ở query đếm) để hiển thị chevron mà không cần children.
  - Khi expand: gọi RPC/`select` phạm vi 1 mức con của node đó, cache trong TanStack Query `['cay', nodeId, level]`.
  - Prefetch trên hover 200ms để cảm giác tức thời.
- Không đổi shape state edit-mode hiện có; chỉ đổi lịch trình fetch.

### 4.3 Chỉ mục tìm kiếm nhanh

- Client: build `Map<id, {normalized: string, tokens: string[]}>` khi dataset mount (một lần, memo theo dataset id).
- Ưu tiên: normalize (strip diacritic + lowercase, dùng chung utility với N1) → so khớp `startsWith`/`includes` trên chuỗi đã normalized.
- Cho bảng đã virtualize: lọc trên id list rồi feed cho virtualizer → không tạo mảng dòng mới lớn.
- Server: tận dụng index sẵn có; **không** thêm migration ở phase này (SPEC-only, tránh chạm SSOT).

### 4.4 Trạng thái loading/empty/error nhất quán

- Component mới `DataState` với 3 chế độ: `skeleton | empty | error`.
- Skeleton bảng: 8 dòng placeholder khớp chiều cao dòng.
- Empty: icon + text + optional CTA (truyền qua props).
- Error: text + nút "Thử lại" gọi `router.invalidate()` (theo chuẩn TanStack).
- Áp cho 3 bảng + cây + Dashboard KPI.

---

## 5. Đo lường (trước–sau)

Trong BƯỚC 2, thêm `scripts/perf-measure.ts`:

- Chạy Playwright headless, mở 3 trang bảng lớn + cây, thu:
  - Thời gian tới first paint bảng.
  - Frames-per-second khi cuộn 3s (dùng `performance.now()` delta trong page).
  - Memory snapshot (`performance.memory` nếu có).
- Xuất `docs/superpowers/specs/n12-perf-measurements.md` với 2 cột: **Before** (commit trước áp) / **After**.

---

## 6. Rủi ro & giảm thiểu

- **Virtualization phá layout responsive**: giữ container `min-height`, test qua compact mode + mobile viewport.
- **Lazy tree phá edit-mode**: khi expand để edit, đảm bảo node hiện diện trong cache trước khi mở drawer.
- **Regression selection/expand toàn phần**: giữ helper "expand tất cả" nạp theo yêu cầu, không đổi API caller.
- **Test smoke**: `route-smoke.test.ts` phải xanh trên toàn bộ route hiện có.

---

## 7. Câu hỏi làm rõ

1. Chấp nhận thêm dep `@tanstack/react-virtual` (~7KB gz)? Hoặc dùng `react-window`?
2. Số 20.000 tài sản mẫu đủ hay muốn 50.000?
3. Prefetch on-hover cho tree (200ms) có phù hợp hay muốn tắt để tiết kiệm request?
4. Skeleton bảng: 8 dòng hay theo chiều cao viewport?
5. `scripts/perf-seed.ts` chạy qua service role (admin) trên dev — có được không?
6. Nếu ngưỡng ≥55fps không đạt trên máy yếu, có chấp nhận fallback `overscan` thấp hơn (2–4)?
7. Trang tree lớn (5876 LOC): có được tách nhỏ file trong phase này (thuần tổ chức, không đổi hành vi) hay giữ nguyên?

Chờ bạn duyệt spec + trả lời trước khi sang BƯỚC 2.
