# QA E2E — Kịch bản theo vai trò (SPEC)

Trạng thái: **DRAFT — chờ duyệt trước BƯỚC 2**
Kế thừa `qa-test-plan.md`, `qa-feature-tests.md`. Dùng seed cô lập 2 đơn vị + 3 vai trò.

Ràng buộc: E2E chạy trên **seed cô lập** (namespace `e2e_*`), KHÔNG đụng dữ liệu prod; **không nới RLS/role** để test pass; test hiện có phải xanh.

---

## 1. Vai trò & session seed

Ba tài khoản seed (chỉ tồn tại trên môi trường test):

| User | Role | Scope | Mục tiêu |
| --- | --- | --- | --- |
| `e2e.admin@test.local` | `admin` | tất cả | Duyệt change_request, thấy mọi đơn vị |
| `e2e.kt.a@test.local` | `phong_kt` | `DV_A` | Đề xuất change_request; edit trong đơn vị A |
| `e2e.viewer.a@test.local` | `viewer` | `DV_A` | Chỉ xem — không thấy nút sửa |

**Session seed (Playwright)**:
- Đăng nhập 1 lần → lưu `storageState.json` cho mỗi vai trò tại `e2e/.auth/<role>.json`.
- Test reuse storage state → không đăng nhập lại giữa các spec.
- Trước mỗi run: gọi RPC `e2e_reset_seed()` (server function admin-only) để reset đúng tập seed.
- Sau run: gọi `e2e_wipe_seed()`, chỉ xoá row có tiền tố `e2e_`.

---

## 2. Kịch bản chi tiết

### 2.1 Danh mục (N1) — role: `phong_kt.a` + `admin`

| ID | Kịch bản | Assert |
| --- | --- | --- |
| DM-01 | Thêm `dm_nha_san_xuat` mới hợp lệ | Toast success, row xuất hiện, `audit_log` có entry |
| DM-02 | Thiếu trường bắt buộc `ten` | Nút Save disabled + inline error; không có request insert |
| DM-03 | Nhập tên trùng gần đúng ("Thales" khi đã có "THALES  ") | Cảnh báo Levenshtein ≥0.86, cho phép override có ghi chú |
| DM-04 | Gộp 2 bản ghi trùng (admin) | Bản đích giữ, bản nguồn `is_active=false`; mọi `thiet_bi` cũ trỏ id đích; undo trong 24h khôi phục được |
| DM-05 | Xoá danh mục còn FK đang dùng | Bị chặn; hiển thị số row phụ thuộc |

### 2.2 Vận hành / Cây hệ thống — role: `phong_kt.a`

| ID | Kịch bản | Assert |
| --- | --- | --- |
| VH-01 | Bật Edit Mode | Nút Edit đổi màu, các cell hiện affordance |
| VH-02 | Đổi tên hệ thống ở view **Tree** | Gọi `renameEntity` 1 lần; `dm_he_thong.ten` cập nhật; `cay_node_edit.ten` **NULL** (không dual-write); `audit_log` có 1 entry |
| VH-03 | Đổi tên cùng node ở view **Table** | Cùng kết quả VH-02 (một-writer) |
| VH-04 | Đổi tên ở view **MindMap** | Cùng kết quả VH-02 |
| VH-05 | Thêm nhóm hệ thống mới trong DV_A | Xuất hiện ở cả 3 view; RLS block user DV_B thấy |
| VH-06 | Thêm hệ thống + thành phần + tài sản | Cây mở đúng phân cấp; count parent tự tăng |
| VH-07 | Xoá hệ thống có tài sản | Soft-delete + Toast Undo; bấm Undo trong 5s khôi phục toàn nhánh |
| VH-08 | Thử xoá trực tiếp tài sản qua Tree | Bị chặn (invariant `no-direct-device-delete`) |
| VH-09 | Chuyển giữa 3 view sau khi sửa | Dữ liệu đồng nhất; expand state giữ nguyên |
| VH-10 | Cột kế thừa từ `dm_model` | Không click edit được; tooltip "Kế thừa từ Model" |

### 2.3 Sổ lý lịch — role: `phong_kt.a`

| ID | Kịch bản | Assert |
| --- | --- | --- |
| SL-01 | Tạo sự cố mới cho tài sản DV_A | Trạng thái = `bao_cao`, `su_co.thiet_bi_id` đúng |
| SL-02 | Chuyển `bao_cao → tiep_nhan → dang_xu_ly` | OK; `downtime_start` được set tại `dang_xu_ly` |
| SL-03 | Thử nhảy `bao_cao → hoan_thanh` | Bị chặn (nút disable + toast lý do) |
| SL-04 | `dang_xu_ly → cho_vat_tu → dang_xu_ly → hoan_thanh` | `downtime_end` set; `wrench_time` = downtime − chờ vật tư |
| SL-05 | Admin nghiệm thu `hoan_thanh → nghiem_thu` | Chỉ admin thấy nút; `phong_kt` không thấy |
| SL-06 | Hoàn thành công việc PM đến hạn (N4) | Ghi 1 row `bao_tri`; sinh kỳ tiếp theo; xuất hiện trong tab Bảo trì |
| SL-07 | Xem tab **Lịch sử** (N3) | Timeline đúng thứ tự; gom nhóm event cùng actor ≤3s; nút Restore chỉ hiện với field whitelist |
| SL-08 | Restore giá trị cũ của trường `ghi_chu` | Áp thành công; audit log ghi entry `restore` |
| SL-09 | Cảnh báo hạn (N5): tài sản có `bao_hanh_den` cách 15 ngày | Badge cam ở dòng + xuất hiện ở trung tâm thông báo |

### 2.4 Liên kết / Graph View (N13) — role: `phong_kt.a`

| ID | Kịch bản | Assert |
| --- | --- | --- |
| GR-01 | Mở view `toan-canh` | Canvas render ≥ 100 node trong seed, không lỗi console |
| GR-02 | Zoom + pan | `zoom` state đổi; không nhảy layout |
| GR-03 | Hover 1 node | Node + hàng xóm sáng; phần còn lại mờ (opacity ≤0.2) |
| GR-04 | Search "e2e_ht_01" | View pan tới node; highlight |
| GR-05 | Lọc theo nhóm hệ thống | Số node giảm đúng; không cạnh mồ côi |
| GR-06 | Click node → mở drawer | Có link "Mở lý lịch" điều hướng tới trang chi tiết |
| GR-07 | RLS chéo: đăng nhập lại bằng viewer DV_A | Không có node nào của DV_B |

### 2.5 Phân quyền & Change Request (N2)

| ID | Kịch bản | Vai trò | Assert |
| --- | --- | --- | --- |
| PQ-01 | Viewer mở trang hệ thống | `viewer.a` | Không thấy nút Edit/Add/Delete; nút Edit Mode ẩn |
| PQ-02 | Viewer gọi RPC edit qua console | `viewer.a` | RLS chặn 403 |
| PQ-03 | phong_kt sửa cấu trúc nhóm (hành động nhạy cảm) | `kt.a` | Không ghi thẳng; hiện dialog "Đề xuất thay đổi"; tạo `change_request` status=pending |
| PQ-04 | admin duyệt request | `admin` | Apply thành công; audit_log ghi 2 entry (approve + apply); status=`approved` |
| PQ-05 | admin thử tự approve request do chính mình tạo | `admin` | Bị chặn (self-approve guard) |
| PQ-06 | admin từ chối | `admin` | status=`rejected`; không mutate dữ liệu |
| PQ-07 | Cross-unit: kt.a mở trang DV_B | `kt.a` | Danh sách rỗng, không lộ id |

### 2.6 Route-smoke (mọi vai trò)

| ID | Kịch bản | Assert |
| --- | --- | --- |
| RS-01 | Mở lần lượt mọi route trong `nav-contract.ts` với admin | HTTP 200, không lỗi console (`error`, `unhandledrejection`), không failed network |
| RS-02 | Lặp lại với `kt.a` | Chỉ thấy route được phép; route bị cấm → redirect `/403` sạch |
| RS-03 | Lặp lại với `viewer.a` | Tương tự, nghiêm ngặt hơn |
| RS-04 | Compact mode ON/OFF trên trang Table lớn | Không jank, không lỗi console |

---

## 3. Ảnh chụp so sánh (tùy chọn)

Chụp và diff bằng Playwright `toHaveScreenshot()`:

- Tree view mở toàn bộ DV_A
- Table `Thành phần hệ thống` compact mode
- Graph View sau layout ổn định (chờ `simulation.alpha() < 0.01`)
- Timeline Sổ lý lịch (N3)

Threshold `maxDiffPixelRatio: 0.02`. Baseline commit trong `e2e/__screenshots__/`.

---

## 4. Cấu hình chạy

- `playwright.config.ts`: 3 project `chromium-admin`, `chromium-kt-a`, `chromium-viewer-a`, mỗi project set `storageState` tương ứng.
- `webServer`: `npm run dev` (port 8080), reuse existing.
- Retries: 1 trên CI, 0 local.
- Trace: `on-first-retry`; video: `retain-on-failure`.
- Env: `E2E_BASE_URL` (mặc định `http://localhost:8080`).
- Seed reset: `globalSetup` gọi `POST /api/public/e2e/reset` (chỉ enable khi `E2E_ENABLED=1`).

Không chạy E2E trên PR mặc định — chỉ nightly + tag `run-e2e` (đã chốt ở test plan chung).

---

## 5. Câu hỏi làm rõ

1. **Seed reset endpoint** `/api/public/e2e/*`: chấp nhận thêm route công khai có token bí mật (env `E2E_SEED_TOKEN`)? Hay dùng service_role qua CLI ngoài app?
2. **Vai trò `viewer`** hiện chưa có trong `user_roles` enum — có cho phép thêm role mới trong PR này (migration nhỏ) hay tạm map bằng `user_scope` chỉ-đọc?
3. **Screenshot diff**: chấp nhận baseline chụp trên Linux CI runner (font khác local → cần Docker image chuẩn `mcr.microsoft.com/playwright:v1.x`)?
4. **E2E chạy ở đâu**: local `http://localhost:8080` là đủ, hay muốn thêm smoke lên preview URL `project--<id>-dev.lovable.app`?
5. **Timeout mặc định** action 5s, navigation 15s — OK hay tăng?
6. Ba vai trò trên đã đủ hay cần thêm `truong_phong` để test một cấp duyệt trung gian?
7. **Console/network assertion** ở route-smoke: chấp nhận **whitelist** một số warning HMR/dev? (Vì dev server có noise.)

Chờ bạn duyệt SPEC + trả lời trước khi sang BƯỚC 2 (dựng Playwright + viết specs).
