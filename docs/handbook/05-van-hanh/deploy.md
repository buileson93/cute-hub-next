# 05 — Deploy

## Preview vs Production

- **Preview**: mỗi push tự build ra `https://project--<id>-dev.lovable.app`.
- **Production**: publish qua Lovable UI → `https://cute-thing-portal.lovable.app` + custom domain `https://vatm.app`.

## Publish

Từ Lovable UI: nút Publish. Không có CI/CD GitHub (đã cắt tháng 7/26 — xem `docs/ci-cd.md`).

## Custom domain

Đã cấu hình `vatm.app` + `www.vatm.app`. Đổi/thêm domain: Lovable UI → Settings → Domains.

## Cron / scheduled jobs

pg_cron trong Supabase:

- `refresh_mv_asset_anomaly()` — `0 */6 * * *`.
- `canh_bao_het_han` — hằng ngày.
- Báo cáo Telegram nightly.

Setup: `docs/pg-cron-setup.md`.

## Webhook / API public

- `/api/public/*` bypass auth trên published — TỰ verify signature.
- Telegram webhook → `/api/public/telegram/*`.

## Rollback deploy

Lovable UI → History → Restore. Migration không rollback tự động — dùng migration đảo ngược.

## Sau khi deploy

1. Smoke test 5 use case chính: đăng nhập, xem overview, thêm sự cố, thêm thành phần, xuất báo cáo.
2. Kiểm `audit_log` có ghi đủ.
3. Kiểm alert Telegram không loop.
