# 02 — Code map: Integrations

## Lovable Cloud (Supabase)

- Browser client: `src/integrations/supabase/client.ts` (auto-gen — không sửa).
- Server publishable: tạo inline trong handler với `process.env.SUPABASE_URL` + `SUPABASE_PUBLISHABLE_KEY`.
- Server admin (`supabaseAdmin`): `src/integrations/supabase/client.server.ts` — chỉ import trong `.server.ts` hoặc dynamic import trong handler.
- Auth middleware: `src/integrations/supabase/auth-middleware.ts` → dùng `.middleware([requireSupabaseAuth])`.
- Auth attacher (client): `src/integrations/supabase/auth-attacher.ts` → đăng ký trong `src/start.ts` `functionMiddleware`.
- Types: `src/integrations/supabase/types.ts` (auto-gen sau mỗi migration).

## AI Gateway

- Server: `src/lib/ai/gateway.server.ts` — wrapper cho chat / vision / STT / TTS.
- Server fn: `src/lib/ai/*.functions.ts`.
- UI: `AiChatButton`, `VoiceQuickLog`, `VisionImageHint`.
- Cấu hình model: bảng `ai_config`, admin ở `/admin/ai`.

## Telegram

- Server: `src/lib/telegram.server.ts`, `telegram-alerts.server.ts`.
- Server fn: `src/lib/telegram.functions.ts`.
- Bảng: `telegram_subscriber`, `telegram_da_gui`.
- Dùng cho: cảnh báo hết hạn (N5), OTP ký form, báo cáo nightly.

## MCP (Model Context Protocol)

- Manifest: `.lovable/mcp/manifest.json`, `src/routes/mcp.ts`, `src/routes/[.mcp]/`.
- Tools: `src/lib/mcp/tools/`.
- Cho phép agent bên ngoài gọi vào MIRATS (đọc dữ liệu, không ghi).

## Storage (Supabase Storage)

- Wrapper: `src/lib/storage/adapter.ts`, `index.ts`, `server.ts`.
- Bucket đã cấu hình: xem migration + `/admin/backup`.
- Upload ảnh: `PhotoUpload`, `ImageCropDialog`.

## Observability

- Client capture: `src/lib/observability/capture.ts`, `src/lib/error-capture.ts`, `src/lib/lovable-error-reporting.ts`.
- Error boundary: `AppErrorBoundary`.

## Realtime

- Channel wrapper: `src/lib/realtime/channel.ts`.
- Global subscription: `useGlobalRealtime`.
- Cache patch: `patch-paged-cache.ts` — O(1) cho paged query.

## OAuth (per-user connectors)

- `src/routes/[.]lovable.oauth.consent.tsx` — OAuth consent screen cho MCP.

## PDF / Word

- PDF: `jspdf` + `html2canvas` (server: `src/lib/mirats/pdf-render.server.ts`; client: `form-pdf.functions.ts`).
- Word: `src/lib/form-word-export.functions.ts`, `incident-report-word.functions.ts`.
- Excel: `exceljs` cho export báo cáo.
