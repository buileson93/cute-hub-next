# 05 — Local dev

## Yêu cầu

- Node 20+, `bun` (khuyến nghị) hoặc npm.
- Không cần chạy Supabase local — dùng Lovable Cloud có sẵn.

## Cài & chạy

```bash
bun install
bun run dev             # Vite dev server (port 8080)
```

## Env

`.env` được template tạo sẵn với `VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY`, `VITE_SUPABASE_PROJECT_ID`. **KHÔNG** commit key khác vào `.env`; secret server-side dùng `add_secret` (Lovable UI) hoặc Supabase Dashboard.

## Bấm chạy nhanh

- Đăng nhập test: `buileson93@gmail.com` / `12345` (admin sandbox).
- Command Palette: `Cmd/Ctrl + K`.
- Compact mode: toggle ở header (persist qua `data-density` trên `<html>`).

## Tài liệu tham khảo khi làm việc

- Handbook này (`docs/handbook/`).
- Spec nội bộ: `docs/superpowers/specs/`.
- HDSD người dùng: `docs/huong-dan/`.

## Đừng làm

- **Không sửa** `src/routeTree.gen.ts`, `src/integrations/supabase/client.ts`, `client.server.ts`, `auth-middleware.ts`, `auth-attacher.ts`, `types.ts`, `supabase/config.toml`, `.env`.
- **Không** tạo `src/pages/` — TanStack Router file-based trong `src/routes/`.
- **Không** dùng `@import "url"` trong `src/styles.css` — thêm `<link>` trong `__root.tsx`.
