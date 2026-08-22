# 00 — Kiến trúc tổng quan

## Stack

| Lớp            | Công nghệ                                                                       | Phiên bản |
| -------------- | ------------------------------------------------------------------------------- | --------- |
| Frontend       | React 19 + TanStack Start v1 + TanStack Router (file-based) + TanStack Query    | latest    |
| Build          | Vite 7                                                                          | 7.x       |
| Styling        | Tailwind CSS v4 (native `@import`, `@theme` trong `src/styles.css`) + shadcn/ui | v4        |
| Backend        | Lovable Cloud (Supabase) — Postgres 17, RLS, RPC                                | —         |
| Runtime server | Cloudflare Workers (workerd) + nodejs_compat, qua TanStack Start                | —         |
| AI             | Lovable AI Gateway (chat/vision/STT/TTS)                                        | —         |
| Realtime       | Supabase Realtime channels                                                      | —         |
| Ký số          | RSA private key (`system_signing_key`) + OTP Telegram                           | —         |

## Sơ đồ khối

```
                        ┌───────────────────────────────────────────┐
                        │            Browser (React 19)             │
                        │  routes/*.tsx  hooks/*  components/mirats │
                        └──────────────┬────────────────────────────┘
                    createServerFn │        │ supabase-js (publishable key + RLS)
                                   ▼        ▼
                        ┌───────────────────────────────────────────┐
                        │  TanStack Start server (Cloudflare Worker) │
                        │  src/routes/api/*    src/lib/*.functions.ts │
                        │  auth-middleware (bearer)  attachSupabase   │
                        └──────────────┬────────────────────────────┘
                                       │ (SQL / RPC / storage)
                                       ▼
                        ┌───────────────────────────────────────────┐
                        │       Lovable Cloud (Supabase / PG17)      │
                        │  113+ bảng public   │  Storage buckets    │
                        │  RLS + policy       │  Realtime channels  │
                        │  RPC (SECURITY DEF) │  pg_cron (cảnh báo) │
                        └──────────────┬────────────────────────────┘
                                       │
                     ┌─────────────────┼──────────────────┐
                     ▼                 ▼                  ▼
              AI Gateway         Telegram Bot        pg_cron jobs
              (Lovable)          (alert + OTP)       (canh_bao_het_han)
```

## Luồng dữ liệu điển hình

**Đọc (list tài sản)**

1. Route `/thiet-bi` gọi hook TanStack Query.
2. Hook gọi `supabase.rpc('rpc_tai_san_toan_cuc', {...})` từ browser.
3. Postgres kiểm RLS bằng `auth.uid()`, trả rows.
4. `usePagedQuery` cache theo trang; realtime patch cache khi có INSERT/UPDATE.

**Ghi (khai thêm thành phần hệ thống)**

1. `KhaiThemDialogs.tsx` → `supabase.rpc('khai_them_thanh_phan_he_thong', ...)`.
2. RPC `SECURITY DEFINER` (owner=postgres) chạy: insert vào `he_thong_thanh_phan` + trigger đồng bộ đơn vị.
3. RLS bỏ qua vì owner=postgres; nhưng RPC vẫn tự kiểm quyền qua `has_role(auth.uid(),...)`.
4. Trả record → TanStack Query invalidate → UI cập nhật.

**Server function (báo cáo độ tin cậy)**

1. Component gọi `useServerFn(getReliabilityReport)`.
2. `functionMiddleware` gắn bearer token Supabase.
3. `createServerFn().handler()` chạy trên Worker: đọc DB qua `context.supabase`, tính MTBF/MTTR, trả JSON.

## Nguyên tắc thiết kế còn hiệu lực

1. **1 tài sản có thể lắp ở NHIỀU thành phần hệ thống** — không có unique 1-1 trên `gan_chuc_nang`.
2. **Đơn vị quản lý**: nguồn chính là `dm_he_thong.don_vi_id`. Tài sản kế thừa đơn vị qua thành phần đang lắp. Vị trí cũng kế thừa ngược.
3. **RLS + GRANT bắt buộc**: mọi bảng public phải có GRANT rõ ràng; xem `04-quy-uoc/grant-discipline.md`.
4. **Tông màu VATM #1C51E0**, compact mode qua `data-density` trên `<html>`.
5. **Không dùng `src/pages/`** — TanStack Router flat routing trong `src/routes/`.

## Điểm khác biệt so với TanStack Start mặc định

- Có sẵn `requireSupabaseAuth` middleware và client `supabase` / `supabaseAdmin` / server-publishable.
- Route `_authenticated` được TanStack Cloud template lo; auth flow qua `/auth`.
- Có custom `usePagedQuery` để vượt giới hạn 1000 rows PostgREST.

## Thư mục src/

| Đường dẫn                                         | Vai trò                                                 |
| ------------------------------------------------- | ------------------------------------------------------- |
| `src/routes/`                                     | Route file-based; `_app.*` = layout đã đăng nhập        |
| `src/components/mirats/`                          | Component nghiệp vụ (128 file)                          |
| `src/components/ui/`                              | shadcn primitives                                       |
| `src/hooks/`                                      | Custom hooks (14 file)                                  |
| `src/lib/mirats/`                                 | Logic domain thuần (141 file), unit-test được           |
| `src/lib/*.functions.ts`                          | `createServerFn` — RPC client→server                    |
| `src/lib/*.server.ts`                             | Chỉ import từ file `.server` khác; không leak ra client |
| `src/integrations/supabase/`                      | Client tự sinh — **không sửa**                          |
| `src/start.ts`, `src/server.ts`, `src/router.tsx` | Bootstrap                                               |
