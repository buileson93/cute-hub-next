# Khôi phục dự án MIRATS từ GitHub (step-by-step)

Guide này đúc kết từ lần import thật (113 bảng, ~10.800 dòng) — làm theo đúng thứ tự sẽ tránh được toàn bộ lỗi đã gặp.

Gồm 2 phần:

- **Phần A — Build source code** (clone → chạy được dev server): ~5 phút
- **Phần B — Khôi phục database** (schema + dữ liệu + tài khoản): ~10 phút

---

# PHẦN A — BUILD SOURCE CODE

## A0. Yêu cầu

- Project Lovable mới, **đã bật Lovable Cloud** (tạo backend trước khi import code).
- `bun` (repo dùng `bun.lock` + `bunfig.toml`; không dùng npm/yarn để tránh lệch lockfile).

## A1. Lấy source

```bash
git clone https://github.com/buileson93/vatm3 /tmp/vatm3
rsync -a --exclude .git --exclude node_modules /tmp/vatm3/ ./
```

**Lỗi đã gặp:** copy cả `.git` và `node_modules` làm hỏng trạng thái repo của Lovable — luôn exclude.

## A2. Cài dependency + kiểm tra source

```bash
bash scripts/restore/setup-source.sh
```

Script gộp A2→A5 (`bun install`, xoá route trùng, kiểm tra `.env`, kiểm tra asset). Chi tiết từng bước bên dưới.

## A3. Biến môi trường

**Không** copy `.env` từ repo gốc. Lovable Cloud tự sinh `VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY`, `VITE_SUPABASE_PROJECT_ID` và các biến server. Nếu `.env` mang giá trị cũ → app đọc nhầm database của project cũ.

## A4. Xử lý route trùng

**Lỗi đã gặp:** template Lovable sinh `src/routes/index.tsx` placeholder, xung đột path `/` với `src/routes/_app.index.tsx` → router báo duplicate route, preview trắng trang.

```bash
rm -f src/routes/index.tsx
```

Không sửa `src/routeTree.gen.ts` bằng tay (file tự sinh).

## A5. Asset trang login

Repo dùng asset ngoài: `src/assets/*.asset.json` (logo VATM/MIRATS, ảnh nền `auth-hero.jpg`, ảnh đài kiểm soát). Mỗi JSON trỏ tới một asset đã upload kèm `project_id`.

**Lỗi đã gặp:** `.asset.json` mang `project_id` của project cũ → ảnh trang login 404.

```bash
node scripts/restore/check-assets.mjs
```

Script liệt kê asset lệch `project_id` và asset thiếu file. Asset lệch thì upload lại ảnh vào project hiện tại (kéo thả vào chat); ảnh có sẵn dạng nhị phân (`atc-tower-real.jpg`, `auth-hero.jpg`, `vatm-emblem.png`) dùng trực tiếp.

## A6. Chạy và kiểm tra

```bash
bunx tsgo --noEmit    # typecheck
bun run lint
bun run build         # build production, không chỉ build:dev
```

> Ở giai đoạn này typecheck **sẽ còn lỗi** nếu chưa khôi phục database — types Supabase sinh từ schema thật. Làm tiếp Phần B rồi typecheck lại.

---

# PHẦN B — KHÔI PHỤC DATABASE

## 0. Yêu cầu

- Sandbox có biến `PGHOST/PGUSER/PGPASSWORD/PGDATABASE` (kiểm tra: `test -n "$PGHOST"`).
- Repo đã clone đầy đủ: `supabase/dump/schema.sql`, `supabase/dump/data/*.csv`, `supabase/migrations/`.

---

## 1. Chạy nhanh (một lệnh)

```bash
bash scripts/restore/restore-all.sh
```

Script làm tuần tự các bước 2→7 bên dưới và in báo cáo cuối. Nếu muốn hiểu/chạy từng bước, đọc tiếp.

---

## 2. Bước 1 — Helper `__restore_exec` (bắt buộc)

**Lỗi đã gặp:** role của Lovable Cloud không phải superuser → `CREATE EXTENSION`, `ALTER TABLE ... DISABLE TRIGGER`, một số `GRANT` bị từ chối.

**Cách xử lý:** tạo một hàm SECURITY DEFINER tạm để chạy SQL đặc quyền, xoá sau khi xong.

```bash
psql -f scripts/restore/sql/01-helper.sql
```

> Bắt buộc phải xoá helper ở bước 7. Để sót lại là một lỗ hổng bảo mật nghiêm trọng.

---

## 3. Bước 2 — Extensions vào schema `extensions`

**Lỗi đã gặp:** `schema.sql` gọi `unaccent()`/`pg_trgm` nhưng extension chưa có; cài vào `public` sẽ vỡ khi Supabase dọn schema.

```bash
psql -f scripts/restore/sql/02-extensions.sql
```

Bao gồm cả `TEXT SEARCH DICTIONARY public.unaccent` — trigger full-text của các bảng tiếng Việt cần đúng tên `public.unaccent`, nếu thiếu sẽ lỗi `text search dictionary "public.unaccent" does not exist` ngay khi INSERT.

---

## 4. Bước 3 — Áp schema

**Lỗi đã gặp:** `schema.sql` từ `pg_dump` chứa các dòng `SET`/`ALTER ... OWNER TO`/`CREATE SCHEMA public` gây fail.

```bash
python3 scripts/restore/apply-schema.py
```

Script tự lọc các câu lệnh không hợp lệ rồi chạy qua `__restore_exec`.

---

## 5. Bước 4 — Import CSV nhiều lượt (multi-pass)

**Lỗi đã gặp:** import theo alphabet → vi phạm khoá ngoại; RLS chặn insert; trigger tính toán làm chậm/khác dữ liệu.

```bash
python3 scripts/restore/import-data.py
```

Cơ chế: `GRANT BYPASSRLS` cho role hiện tại, lặp tối đa 6 lượt, bảng nào fail vì FK thì để lượt sau. In danh sách bảng còn lỗi nếu có.

---

## 6. Bước 5 — Migration còn thiếu của repo

**Lỗi đã gặp (quan trọng nhất):** dump cũ hơn code → typecheck 176 lỗi vì thiếu bảng `dot_bao_duong*`, `r2_*`, `luu_tru_health_log`, `weekly_report_import` và thiếu cột (`created_by`…).

```bash
python3 scripts/restore/apply-migrations.py
```

Script chạy lần lượt mọi file trong `supabase/migrations/`, bỏ qua migration đã áp (idempotent theo lỗi "already exists").

---

## 7. Bước 6 — Đồng bộ sequence

**Lỗi đã gặp:** insert từ app báo trùng khoá chính vì sequence vẫn ở 1 sau khi COPY.

```bash
psql -f scripts/restore/sql/06-sync-sequences.sql
```

---

## 8. Bước 7 — Dọn dẹp + tài khoản admin

```bash
psql -f scripts/restore/sql/07-cleanup.sql
python3 scripts/restore/create-admin.py buileson93@gmail.com 12345
```

- `07-cleanup.sql`: xoá `__restore_exec`, xoá bảng rác `_dbg_tmp`, thu hồi `BYPASSRLS`.
- `create-admin.py`: dump **không có `auth.users`**, nên phải tạo user qua Admin API (`SUPABASE_SERVICE_ROLE_KEY`), rồi thêm `profiles` (`active = true`) và `user_roles` (`admin`). Thiếu 1 trong 3 → login được nhưng app trắng trang.

---

## 9. Bước 8 — Đồng bộ code

```bash
rm -f src/routes/index.tsx     # trùng route với src/routes/_app.index.tsx
bunx tsgo --noEmit             # phải sạch
```

**Lỗi đã gặp:** template Lovable sinh `src/routes/index.tsx` placeholder, xung đột path `/` với `_app.index.tsx` → router báo duplicate route.

Sau đó regenerate types Supabase (tool `supabase--migration` chạy xong sẽ tự sinh lại `src/integrations/supabase/types.ts`).

---

## Checklist lỗi thường gặp

| Triệu chứng                                               | Nguyên nhân                       | Fix                             |
| --------------------------------------------------------- | --------------------------------- | ------------------------------- |
| `permission denied for schema public`                     | không phải superuser              | dùng `__restore_exec` (bước 1)  |
| `text search dictionary "public.unaccent" does not exist` | thiếu dictionary                  | bước 2                          |
| `violates foreign key constraint` khi COPY                | thứ tự bảng                       | multi-pass (bước 4)             |
| `new row violates row-level security`                     | RLS bật                           | `BYPASSRLS` trong bước 4        |
| typecheck báo thiếu bảng/cột                              | dump cũ hơn code                  | bước 5                          |
| duplicate key khi tạo bản ghi mới                         | sequence chưa sync                | bước 6                          |
| Router: duplicate path `/`                                | index placeholder                 | bước 8                          |
| Login OK nhưng không vào được app                         | thiếu `profiles`/`user_roles`     | `create-admin.py`               |
| Bảng đọc được bằng psql nhưng app báo permission          | thiếu `GRANT` cho `authenticated` | `node scripts/apply-grants.mjs` |

---

## Phần C — Asset logo & màn hình đăng nhập (nguyên nhân mất ảnh)

### Nguyên nhân

Repo chỉ commit **con trỏ** `*.asset.json`, không commit ảnh gốc. Mỗi con trỏ chứa
`project_id`/`asset_id` của **dự án Lovable cũ**:

```
"project_id": "01d1f769-…", "url": "/__l5e/assets-v1/<asset_id>/vatm-mirats-full.svg"
```

CDN `/__l5e/assets-v1/…` phục vụ **theo từng dự án**. Khi khôi phục sang dự án mới,
16 URL này đều trả **404** → logo trắng, ảnh nền đăng nhập trống. Ảnh gốc không nằm
trong git nên không thể tự phục hồi từ con trỏ.

### Cách xử lý (đã áp dụng)

Dùng đúng ảnh **có sẵn trong `src/assets/`** và import trực tiếp (Vite bundle,
không phụ thuộc CDN, khôi phục lần sau không bao giờ thiếu):

| Vị trí dùng                                                 | Trước (404)                                       | Sau (ảnh trong repo)               |
| ----------------------------------------------------------- | ------------------------------------------------- | ---------------------------------- |
| Logo trang đăng nhập `src/routes/auth.tsx`                  | `vatm-mirats-full-v2.svg.asset.json`              | `@/assets/vatm-emblem.png`         |
| Logo sidebar/watermark `src/components/mirats/AppShell.tsx` | `vatm-mark-square.svg`, `vatm-mirats-full-v2.svg` | `@/assets/vatm-emblem.png`         |
| Logo mặc định `src/lib/mirats/branding.ts`                  | `vatm-mirats-full.svg`, `vatm-mirats-compact.svg` | `@/assets/vatm-emblem.png`         |
| Ảnh đài chỉ huy `AtcTowerScene.tsx`                         | `atc-tower-phucat.jpg.asset.json`                 | `@/assets/atc-tower-real.jpg`      |
| Ảnh trong đài `AtcTowerScene.tsx`                           | `twr-interior.jpg.asset.json`                     | `@/assets/auth-hero.jpg`           |
| Máy bay bay ngang `AtcTowerScene.tsx`                       | `fighter-jet.png.asset.json`                      | không có ảnh gốc → vẽ vệt sáng CSS |

16 file `src/assets/*.asset.json` hỏng đã được xoá.

### Thư viện ảnh gốc hiện có (dùng lại khi khôi phục)

```
src/assets/vatm-emblem.png       — logo VATM (1024×1024, nền trong suốt)
src/assets/atc-tower-real.jpg    — đài kiểm soát không lưu (ảnh nền đăng nhập)
src/assets/auth-hero.jpg         — nội thất đài chỉ huy
src/assets/cmdk/*.jpg            — 6 ảnh nền Command Palette
src/assets/so-do/*.png           — 6 biểu tượng thiết bị sơ đồ
public/favicon*, icon-192/512, apple-touch-icon.png
```

### Quy tắc tránh lặp lại

1. **Không dùng `*.asset.json` cho ảnh thương hiệu** trong dự án cần khôi phục nhiều lần —
   commit ảnh thật vào `src/assets/` và `import` trực tiếp.
2. Nếu buộc phải dùng CDN asset: sau khi clone sang dự án mới, chạy
   `node scripts/restore/check-assets.mjs` — script báo mọi con trỏ có `project_id`
   khác dự án hiện tại (đó chính là các ảnh sẽ 404) rồi **tải lại ảnh gốc** bằng
   `lovable-assets create --file <ảnh>` và ghi đè file `.asset.json`.
3. Kiểm tra nhanh sau khôi phục: mở `/auth` — phải thấy logo VATM và ảnh đài chỉ huy;
   DevTools → Network không có request `/__l5e/assets-v1/…` nào 404.

### Còn thiếu (chưa có bản gốc trong repo)

`src/assets/fonts/NotoSans-Regular.ttf.asset.json` và `NotoSans-Bold.ttf.asset.json`
vẫn trỏ CDN dự án cũ → chỉ ảnh hưởng xuất PDF tiếng Việt (`src/lib/mirats/pdf-render.server.ts`).
Khắc phục: tải Noto Sans về `src/assets/fonts/` rồi upload lại bằng `lovable-assets create`.
