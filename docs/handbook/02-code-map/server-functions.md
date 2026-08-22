# 02 — Code map: Server functions

Server function = `createServerFn` từ `@tanstack/react-start`. Chạy trên Cloudflare Worker.

## File

| File                                               | Chức năng                                                  |
| -------------------------------------------------- | ---------------------------------------------------------- |
| `src/lib/admin-users.functions.ts`                 | CRUD user, đặt role (admin only).                          |
| `src/lib/backup.functions.ts` / `backup.server.ts` | Export/import backup DB (dùng `supabaseAdmin`).            |
| `src/lib/form-pdf.functions.ts`                    | Render PDF form (jsPDF).                                   |
| `src/lib/form-signing.functions.ts`                | Ký số submission bằng `system_signing_key`.                |
| `src/lib/form-word-export.functions.ts`            | Export Word (.docx).                                       |
| `src/lib/incident-report-word.functions.ts`        | Xuất báo cáo sự cố Word.                                   |
| `src/lib/node-notes.functions.ts`                  | Ghi chú node cây.                                          |
| `src/lib/passkey.functions.ts`                     | Đăng ký / xác thực WebAuthn.                               |
| `src/lib/password-reset.functions.ts`              | Reset mật khẩu qua email.                                  |
| `src/lib/rbac.functions.ts`                        | `getMyPermissions` — trả roles + permissions + scope.      |
| `src/lib/telegram.functions.ts`                    | Gửi Telegram message.                                      |
| `src/lib/mirats/ai/*.functions.ts`                 | AI: incident-parse, incident-image, config, conversations. |
| `src/lib/mirats/command-intent-ai.functions.ts`    | Parse intent Command Palette v2.                           |
| `src/lib/mirats/data-quality.functions.ts`         | Chấm điểm chất lượng dữ liệu.                              |
| `src/lib/mirats/import-*.functions.ts`             | Import alias/apply/staging/export.                         |
| `src/lib/mirats/thanh-phan-log.functions.ts`       | Ghi lịch sử lắp/tháo.                                      |

## Quy tắc bắt buộc

1. **Auth**: server fn cần user login phải dùng `.middleware([requireSupabaseAuth])`.
2. **KHÔNG** gọi server fn có `requireSupabaseAuth` từ loader của route public — SSR không có bearer, build fail.
3. Đọc `process.env.X` **trong `.handler()`**, không ở module scope.
4. `supabaseAdmin` chỉ import trong `.server.ts` hoặc dynamic import trong handler; không leak vào bundle client.
5. `functionMiddleware` trong `src/start.ts` đã gắn bearer — nếu thêm middleware mới, append, không replace.

## Ví dụ shape

```ts
export const getMyPermissions = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    // ...
    return { roles, permissions, scope, isGlobal };
  });
```

## Server routes (không phải server fn)

Nằm ở `src/routes/api/**`. Dùng cho:

- Webhook (Telegram, Stripe…)
- Cron (được pg_cron gọi qua HTTP)
- Public API (dưới `api/public/*` — bypass auth, TỰ verify signature).
