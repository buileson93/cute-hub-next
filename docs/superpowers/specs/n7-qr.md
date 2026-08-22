# N7 — QR thiết bị: quét mở lý lịch & báo sự cố tại chỗ — SPEC-only

> Trạng thái: **DRAFT — chờ duyệt**. Không viết code sản phẩm cho tới khi được `OK`. Superpowers: brainstorming → writing-plans → TDD → verification.

## 1. Bối cảnh & mục tiêu

Đã có nền tảng: `src/lib/mirats/nhan-qr.ts` (`buildLabelUrl` / `buildLabelPath`) + route `src/routes/q.$maThietBi.tsx` chuyển hướng theo `ma_thiet_bi`, cùng trang `_app.nhan.tsx` in nhãn. N7 nâng cấp thành hệ QR **hoàn chỉnh cho hiện trường**:

- QR mã hoá deep-link ngắn, không lộ dữ liệu nhạy cảm (không nhúng tên tài sản, đơn vị, model, mật khẩu).
- Trang xem tối ưu mobile (một tay, ngoài trời) — thông tin cốt lõi + hành động chính.
- Nút **"Báo sự cố"** mở luồng N6 (tạo `su_co` ở trạng thái `bao_cao`).
- **In tem hàng loạt** theo bộ lọc (đơn vị / nhóm hệ thống / hệ thống / trạng thái).
- Không bỏ qua auth / RLS ở bất kỳ trang QR nào.

## 2. Định dạng nội dung QR

### 2.1 Nguyên tắc

- QR chỉ chứa **URL deep-link**, không JSON, không token, không PII.
- Định danh trên QR = `ma_thiet_bi` (đã in trên vỏ máy) — người không có quyền quét cũng chỉ đọc được cùng thông tin đã in vật lý.
- Không nhúng `id UUID`: (a) dài, mật độ QR cao khó quét ngoài trời; (b) UUID rò rỉ nhiều hơn `ma_thiet_bi` (dễ dùng để enum).

### 2.2 URL

**Chuẩn hoá về một tuyến**:

```
https://<origin>/q/<encodeURIComponent(ma_thiet_bi)>
```

- `<origin>` = domain đang chạy (`vatm.app`, hoặc preview) — được truyền vào `buildLabelUrl(origin, ma)` khi in.
- `/q/:maThietBi`: **cổng quét công khai-hạn-chế** (route hiện tại giữ nguyên đường dẫn).
- Thêm alias `/qr/thiet-bi/:id` **CHỈ** cho luồng nội bộ (tính năng lịch sử / URL cũ) — route redirect 301 sang `/q/<ma>`. Do yêu cầu bài toán nhắc `/qr/thiet-bi/:id`, nhưng SSoT hiện tại đã dùng `/q/:maThietBi` (đơn giản, ngắn hơn cho QR): xem câu hỏi §10 về việc chọn một trong hai làm chính.

Không dùng query string chứa thông tin (không `?ten=...&don_vi=...`).

### 2.3 Ma trận nội dung

| Trường                | Trên QR? | Lý do                                      |
| --------------------- | -------- | ------------------------------------------ |
| `ma_thiet_bi`         | ✅       | Đã in trên vỏ; là khoá tra cứu.            |
| `id` (UUID)           | ❌       | Không cần thiết; dễ enum.                  |
| `ten_thiet_bi`        | ❌       | Xem sau khi auth.                          |
| `don_vi` / `he_thong` | ❌       | Xem sau khi auth.                          |
| Serial, model         | ❌       | Nhạy cảm cấu hình.                         |
| Token 1-lần           | ❌       | QR là nhãn dán tĩnh, không thể xoay token. |

### 2.4 API thuần

```ts
// src/lib/mirats/qr.ts
export interface QrPayload {
  origin: string;
  maThietBi: string;
}

/** Dựng URL đầy đủ cho tem in — reuse `buildLabelUrl` để không drift. */
export function buildAssetQrPayload(input: { origin: string; maThietBi: string }): {
  url: string;
  path: string;
  ma: string;
};

/** Parse một URL / chuỗi quét ra hành động điều hướng chuẩn. */
export type QrTarget =
  | { kind: "asset"; maThietBi: string; path: `/q/${string}` }
  | { kind: "legacy_id"; id: string; path: `/qr/thiet-bi/${string}` }
  | { kind: "unknown"; raw: string };

export function parseQr(raw: string): QrTarget;
```

Ràng buộc `parseQr`:

- Chấp nhận URL đầy đủ hoặc chỉ path.
- Nhận diện `/q/<ma>`, `/qr/thiet-bi/<id>` (legacy — dùng UUID), và trả `unknown` cho phần còn lại.
- Không tự động fetch — chỉ trả về `QrTarget`; điều hướng do UI làm.

## 3. Auth / RLS trên route quét

**KHÔNG bỏ qua auth**. Route `/q/:maThietBi` là route TOP-LEVEL nhưng luôn buộc đăng nhập:

- Người **chưa đăng nhập** quét → chuyển tới `/auth?redirect=/q/<ma>` (giữ đích).
- Sau khi đăng nhập, RLS trên `thiet_bi` quyết định user có được xem tài sản hay không. Không thấy → hiển thị **"Không có quyền xem"** (không leak thông tin — không phân biệt "không tồn tại" vs "không được phép" ở UI).
- Không đặt route dưới `src/routes/api/public/*` (đó là bypass auth cho webhook — không dùng cho UI người dùng).

Không dùng token 1-lần / signed URL vì nhãn dán tĩnh không xoay được — RLS là chốt cuối.

## 4. Trang xem tối ưu mobile (`/q/:maThietBi`)

Hành vi mặc định hiện tại (redirect tới sổ lý lịch chi tiết) **được thay** bằng **"landing card"** tối ưu di động:

### 4.1 Layout (single column, chiều rộng ≤ 480px)

```
┌────────────────────────────┐
│  [Ảnh đại diện / icon]     │
│  MA_TB · Tên tài sản       │
│  Đơn vị · Hệ thống         │
│  Trạng thái · Vị trí       │
├────────────────────────────┤
│ [⚠ Báo sự cố] (primary)    │
│ [📖 Xem lý lịch đầy đủ]    │
│ [🔧 Bảo trì gần nhất]      │
│ [📎 Giấy phép/Chứng chỉ]   │
├────────────────────────────┤
│ Sự cố mở gần nhất (nếu có) │
└────────────────────────────┘
```

### 4.2 Ràng buộc UX

- Trình bày **≤ 6 trường**: mã, tên, đơn vị, hệ thống, vị trí, trạng thái.
- Font ≥ 16px, nút cao ≥ 44px (touch target); tương thích compact-mode (không co lại dưới ngưỡng touch).
- Không hiển thị `ghi_chu`/tài liệu nhạy cảm ở landing — chuyển sang trang lý lịch đầy đủ.
- Fallback không mạng: hiện thông báo "Cần mạng để tra cứu"; không lưu offline (tránh cache PII).
- `noindex` (đã có ở route hiện tại — giữ).

### 4.3 Nút "Báo sự cố" (mở luồng N6)

- Chuyển tới `/su-co/moi?thietBi=<ma>&from=qr`.
- Trang `_app.su-co.moi.tsx` prefill `thiet_bi_id` từ mã, đặt trạng thái khởi tạo `bao_cao` (đúng máy trạng thái N6).
- Nếu N6 chưa merge: nút vẫn hoạt động vì trang tạo sự cố đã tồn tại; state machine sẽ áp dụng khi N6 lên.

## 5. Luồng in tem hàng loạt

Trang `_app.nhan.tsx` (hiện có) được nâng cấp:

### 5.1 Bộ lọc

- Đơn vị (`don_vi_id`) — multi-select.
- Nhóm hệ thống → Hệ thống → Thành phần hệ thống (cascade).
- Trạng thái tài sản (`dm_trang_thai_thiet_bi`).
- Loại tài sản (`dm_loai_thiet_bi`).
- Kho / vị trí.
- Chỉ tài sản chưa in / đã in > N ngày (tuỳ chọn).

Tất cả bộ lọc là **client-side** trên danh sách đã fetch qua RLS (không "quyền in tất cả").

### 5.2 Bố cục nhãn

- Kích thước preset: A4-30 (10×3), A4-24 (8×3), A4-40, khổ nhiệt 40×20mm, 60×40mm.
- Mỗi nhãn gồm: **QR** (URL từ `buildAssetQrPayload`), **mã tài sản** in text bên dưới (để đọc bằng mắt), **tên rút gọn** (≤ 24 ký tự, có thể tắt).
- ECC level `M` (đủ chống lấm bẩn ngoài trời).
- Không in đơn vị/model/serial trên nhãn (PII).

### 5.3 Kiểm soát in

- Nút "Preview" (PDF) và "In trực tiếp" (window.print với CSS `@page`).
- Ghi audit `n7.qr.print_batch` (số lượng nhãn, filter snapshot, không lưu danh sách mã đầy đủ để tránh phình `audit_log`).
- Không tạo bảng riêng cho "đã in" ở BƯỚC 2 (nếu cần theo dõi: thêm cột `qr_in_lan_cuoi timestamptz` trên `thiet_bi` — hỏi §10).

## 6. Kiến trúc code (BƯỚC 2)

```
src/lib/mirats/
  qr.ts                          # NEW: buildAssetQrPayload, parseQr (thuần)
  nhan-qr.ts                     # giữ nguyên; qr.ts internally reuse buildLabelUrl/Path
  __tests__/qr.test.ts           # NEW
src/routes/
  q.$maThietBi.tsx               # nâng cấp: landing card mobile + nút "Báo sự cố"
  qr.thiet-bi.$id.tsx            # NEW alias: parseQr({kind:'legacy_id'}) → redirect tới /q/<ma> tra qua UUID (bắt buộc auth)
  _app.nhan.tsx                  # nâng cấp bộ lọc + preview
```

Không đổi `nav-contract.ts` (không thêm nav) — nút in nhãn đã nằm trong menu công cụ hiện có.

## 7. Test plan (RED)

`src/lib/mirats/__tests__/qr.test.ts`:

1. **`buildAssetQrPayload`**:
   - `{origin:'https://vatm.app', maThietBi:'TB-001'}` → `url='https://vatm.app/q/TB-001'`, `path='/q/TB-001'`, `ma='TB-001'`.
   - Origin có `/` cuối được strip: `'https://vatm.app/'` → cùng kết quả.
   - Mã có ký tự đặc biệt được encode: `'AB/CD 01'` → `path='/q/AB%2FCD%2001'`.
   - Mã rỗng/whitespace → throw (nhãn không được in mã trống).

2. **`parseQr`**:
   - `'/q/TB-001'` → `{kind:'asset', maThietBi:'TB-001', path:'/q/TB-001'}`.
   - `'https://vatm.app/q/TB-001?utm=x'` → cùng kết quả (bỏ query).
   - `'https://vatm.app/qr/thiet-bi/uuid-xxxx'` → `{kind:'legacy_id', id:'uuid-xxxx', path:'/qr/thiet-bi/uuid-xxxx'}`.
   - `'https://vi.wikipedia.org/'` → `{kind:'unknown', raw:...}`.
   - Ký tự URL-encoded được decode (`%20`, `%2F`).
   - Không throw với chuỗi rác — luôn trả `unknown`.

3. **Idempotency**: `parseQr(buildAssetQrPayload(x).url).maThietBi === x.maThietBi`.

4. **Regression**: `nhan-qr.test.ts` (đang có) + toàn bộ suite phải xanh — `qr.ts` chỉ **compose** trên `buildLabelUrl/Path`, không đổi API cũ.

Test route (component-level, không bắt buộc BƯỚC 2 nhưng nên có):

- Người chưa đăng nhập → redirect `/auth`.
- Người đăng nhập, tài sản không thấy do RLS → hiển thị "Không có quyền xem".
- Nút "Báo sự cố" điều hướng đúng `/su-co/moi?thietBi=<ma>&from=qr`.

## 8. Ràng buộc

- **Không bỏ auth**: `/q/*` nằm ngoài `_authenticated/` **nhưng** component tự dùng session; nếu không có session → `<Navigate to="/auth" search={{redirect}}/>` (không SSR-gate vì auth ở client). Không thêm route dưới `api/public/*`.
- **RLS chốt cuối**: mọi read qua `supabase` client thường (không `supabaseAdmin`).
- **Không leak dữ liệu qua URL** (không `?ten=...`).
- **Nhãn in không chứa PII** ngoài `ma_thiet_bi` (đã in vật lý).
- Test hiện có (`nhan-qr.test.ts`, `nav-contract.test.ts`, …) phải xanh.
- Không đổi `nav-contract.ts`.

## 9. Rủi ro

- **Lộ danh sách mã**: quét ngẫu nhiên `/q/TB-XXX` → RLS chặn view, nhưng attacker có thể enum sự tồn tại. Mitigation: UI trả về cùng thông báo "Không có quyền / không tồn tại" (đã nêu §3).
- **QR bẩn ngoài trời**: dùng ECC=M, kích thước module ≥ 0.5mm, quiet zone 4 module — spec ở render layer khi cài BƯỚC 2.
- **Tài sản đổi mã**: nhãn dán cũ vẫn giữ mã cũ. Đề xuất giữ mã bất biến; nếu đổi thì cần bảng ánh xạ `ma_cu → id` (ngoài phạm vi N7).

## 10. Câu hỏi làm rõ

1. **Chọn đường dẫn chính**: giữ `/q/:maThietBi` (SSoT hiện tại, ngắn hơn, đã có test) hay chuyển sang `/qr/thiet-bi/:id` (theo brief)? Đề xuất: **giữ `/q/:ma`** làm chính, thêm `/qr/thiet-bi/:id` **chỉ** làm alias legacy (bằng UUID).
2. **Trang landing mobile**: hiện tại route redirect thẳng tới sổ lý lịch — muốn thay bằng landing card (đề xuất) hay giữ redirect + đặt nút "Báo sự cố" trong trang lý lịch chi tiết?
3. **Cột `qr_in_lan_cuoi`**: có cần theo dõi thời điểm in mỗi tài sản để lọc "chưa in" không? (Đề xuất: có, cột `timestamptz` + audit.)
4. **Kích thước nhãn mặc định** cho batch trước tiên (A4-30, 40×20mm, 60×40mm)? — ảnh hưởng preview đầu tiên khi TDD.
5. **Nhãn có in tên rút gọn** không? (Đề xuất: mặc định bật, có toggle tắt để giấu PII.)
6. **Enum protection**: có cần rate-limit `/q/*` không? Nếu có, ngưỡng bao nhiêu / thời gian bao lâu / theo user hay theo IP?
7. **Signed URL**: có muốn dùng URL ký thời hạn (khách vãng lai vào không cần đăng nhập, hết hạn sau N phút) cho một số trường hợp đặc biệt? (Đề xuất: **không** — mâu thuẫn với nhãn dán tĩnh; giữ auth + RLS.)

---

Chờ `OK` + trả lời câu hỏi để chuyển sang **BƯỚC 2 (TDD RED→GREEN)**.
