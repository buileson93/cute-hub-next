# Quản lý Secrets & Env — Task 35

Tài liệu này chốt "biến nào ở đâu" cho MIRATS 2.0. Mọi PR mới đụng đến
config phải bám bảng dưới đây.

## Nguyên tắc

1. **Chỉ anon/publishable key được phép ở client.** Service role key và các
   secret tuyệt mật CHỈ tồn tại trong `process.env` của server runtime.
2. **VITE_* = công khai.** Bất cứ biến nào có tiền tố `VITE_` đều được Vite
   inline vào bundle browser tại build-time → phải giả định người dùng cuối
   đọc được. Không đặt secret tuyệt mật vào biến `VITE_*`.
3. **Không đọc `process.env` ở module scope của file dùng chung.** Chỉ đọc bên
   trong handler `createServerFn` / server route / server-only helper
   (`*.server.ts`). File `*.functions.ts` được import từ component ⇒ top-level
   code sẽ lọt vào bundle client.
4. **`.env` không commit.** Chỉ commit `.env.example` (tệp mẫu ở gốc dự án).
5. **Không hardcode secret trong source.** Rà bằng `rg` trước mỗi release
   (đã kiểm ở task này: 0 secret hardcode trong `src/`).

## Bảng biến môi trường

| Biến                          | Phạm vi          | Người đọc                                         | Ghi chú |
|-------------------------------|------------------|---------------------------------------------------|---------|
| `VITE_SUPABASE_URL`           | Client + Server  | `src/integrations/supabase/client.ts`             | URL công khai |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | Client + Server | `src/integrations/supabase/client.ts`             | Publishable key (an toàn, RLS bảo vệ) |
| `VITE_SUPABASE_PROJECT_ID`    | Client + Server  | Metadata dùng ở UI                                | Không phải secret |
| `SUPABASE_URL`                | Server           | `client.server.ts`, `auth-middleware.ts`          | Server-side fallback |
| `SUPABASE_PUBLISHABLE_KEY`    | Server           | `auth-middleware.ts` (bearer-token, RLS-as-user)  | Không phải secret |
| `SUPABASE_SERVICE_ROLE_KEY`   | **Server, tuyệt mật** | `src/integrations/supabase/client.server.ts` | BYPASS RLS. Chỉ import trong `*.server.ts` hoặc `await import()` bên trong handler. |
| `LOVABLE_API_KEY`             | Server, tuyệt mật | AI Gateway, connectors                           | Auto-provisioned bởi Lovable Cloud |
| `TELEGRAM_BOT_TOKEN`          | Server           | Edge function cảnh báo                            | Optional |

## Kiểm soát runtime

- **Client bundle không được chứa `SUPABASE_SERVICE_ROLE_KEY`.** Kiểm bằng:
  ```bash
  rg "SERVICE_ROLE|sb_secret_" dist/ 2>/dev/null    # phải rỗng
  rg "SERVICE_ROLE" src/ | grep -v client.server.ts # phải rỗng
  ```
- **Middleware bearer token** (`src/start.ts`) chỉ đính token từ session Supabase
  hiện tại, không đính key.
- **Guard route** (`src/lib/mirats/auth/access.ts`) quyết định 3 trạng thái:
  - `dang_tai` → chờ trên route bảo vệ, cho phép ngay ở route công khai.
  - `chua_dang_nhap` → chuyển `/auth`.
  - `da_dang_nhap` + `is_active_user=false` → chuyển `/pending`.
- **Đăng xuất mềm** (`src/lib/mirats/auth/soft-signout.ts`) chạy 1 lần khi phát
  hiện 401 / refresh token lỗi → tránh vòng lặp redirect.

## Checklist khi thêm secret mới

1. Đặt tên KHÔNG có tiền tố `VITE_` nếu là secret.
2. Cập nhật `.env.example` (giá trị placeholder, không giá trị thật).
3. Thêm dòng vào bảng ở trên.
4. Đọc bằng `process.env.X` **bên trong handler** (không module scope).
5. Chạy `rg "X" src/` để đảm bảo không rò ra file client-reachable.
