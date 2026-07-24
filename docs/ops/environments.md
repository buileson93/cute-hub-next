# Environments — MIRATS 2.0

Tách biệt hoàn toàn **development / staging / production**. Mỗi môi trường có một Supabase project (Lovable Cloud) riêng, secret riêng, và dữ liệu riêng.

## 1. Ma trận môi trường

| Môi trường  | `VITE_APP_ENV` | `NODE_ENV`     | Supabase project        | Dữ liệu demo | Người dùng          |
|-------------|----------------|----------------|-------------------------|--------------|---------------------|
| development | `development`  | `development`  | `mirats-dev`            | ✅ nạp       | Dev nội bộ          |
| staging     | `staging`      | `production`   | `mirats-staging`        | ✅ nạp       | QA + demo khách hàng|
| production  | `production`   | `production`   | `mirats-prod`           | ❌ CẤM       | Người dùng thật     |

Quy tắc:

- Không dùng chung Supabase project giữa staging và production — RLS, secret, storage bucket đều tách.
- Không seed dữ liệu demo vào production dưới bất kỳ hình thức nào (xem §4).
- Không copy dump từ prod xuống staging mà chưa **anonymize** (email, số điện thoại, tên nhân viên).

## 2. Biến môi trường

Các biến `VITE_*` được nhúng vào bundle client, các biến còn lại chỉ ở server.

### 2.1. Client (an toàn để lộ)

| Biến                              | Ví dụ (staging)                                    |
|-----------------------------------|----------------------------------------------------|
| `VITE_APP_ENV`                    | `staging`                                          |
| `VITE_SUPABASE_URL`               | `https://<staging-ref>.supabase.co`                |
| `VITE_SUPABASE_PUBLISHABLE_KEY`   | `sb_publishable_...` (anon/publishable key)        |
| `VITE_SUPABASE_PROJECT_ID`        | `<staging-ref>`                                    |

### 2.2. Server-only (tuyệt đối không nhúng client)

| Biến                              | Ai đặt                          |
|-----------------------------------|---------------------------------|
| `SUPABASE_SERVICE_ROLE_KEY`       | Lovable Cloud tự inject         |
| `SUPABASE_DB_PASSWORD`            | Ops (dùng cho `supabase db push`) |
| Các API key ngoài (Telegram, …)   | `add_secret` / connector        |

### 2.3. URL cố định

- Preview:   `https://project--<id>-dev.lovable.app`
- Published: `https://project--<id>.lovable.app`
- Custom domain gắn ở project **production** khi cần.

## 3. Nguồn cấu hình theo môi trường

- **Development**: `.env.local` (không commit) + `bun run dev`.
- **Staging & Production**: cấu hình qua Lovable Cloud UI (Cloud → Environment) — không lưu secret trong repo.
- `.env.example` liệt kê **tên biến**, không kèm giá trị (xem `docs/security/secrets.md`).

## 4. Quy tắc "demo không vào prod"

Ba lớp bảo vệ độc lập:

1. **Cổng tĩnh CI** — `src/lib/mirats/__tests__/no-demo-in-production.test.ts` quét toàn bộ đồ thị import; nếu route/component prod import `@/data/*.json` hoặc `@/lib/mirats/demo-data`, test đỏ, PR không merge được.
2. **Guard runtime** — `src/lib/mirats/demo-data.ts` ném lỗi ngay khi được nạp trong môi trường `import.meta.env.PROD === true && VITE_APP_ENV === "production"`.
3. **Tách project** — production Supabase không có schema/seed demo; migration demo (`supabase/migrations/*_demo_*`, nếu có) chỉ được áp lên dev/staging (xem `docs/ci-cd.md`).

Khi cần demo cho khách hàng: dùng URL staging, KHÔNG seed vào prod.

## 5. Khi khởi tạo môi trường mới

1. Tạo Supabase project mới → lấy `project ref`, anon key.
2. Đặt biến `VITE_*` trong Lovable Cloud UI cho project tương ứng.
3. Chạy toàn bộ migration: `supabase link --project-ref <ref> && supabase db push`.
4. (Chỉ staging/dev) Nạp seed demo bằng script riêng — không chung migration prod.
5. Kiểm tra `/admin/health` hoặc smoke test đăng nhập, đọc 1 bảng có RLS.
