# pg_cron Setup — Bắt buộc chạy khi deploy môi trường mới

Repo hiện KHÔNG chứa `cron.schedule` trong migration (cố ý — URL host + secret khác nhau theo môi trường). Sau khi deploy môi trường mới (preview / production / self-host), **phải** chạy khối SQL dưới đây một lần trong Supabase SQL editor để bật 3 job định kỳ.

## Điều kiện tiên quyết

1. Đã cấu hình secret `CRON_SECRET` (dùng cho `canh-bao-het-han` & `telegram-alerts`) và `BACKUP_CRON_SECRET` (dùng cho `daily-backup`) trong project.
2. Extension `pg_cron` + `pg_net` đã bật.
3. Biết URL cố định của môi trường:
   - Production: `https://project--<project-id>.lovable.app`
   - Preview:    `https://project--<project-id>-dev.lovable.app`

## SQL

Thay `<BASE_URL>`, `<CRON_SECRET>`, `<BACKUP_CRON_SECRET>` trước khi chạy.

```sql
create extension if not exists pg_cron;
create extension if not exists pg_net;

-- 1) Sinh cảnh báo hết hạn (bảo hành + giấy phép) — 03:00 hàng ngày
select cron.schedule(
  'sinh-canh-bao-het-han-hang-ngay',
  '0 3 * * *',
  $$
  select net.http_post(
    url    := '<BASE_URL>/api/public/hooks/canh-bao-het-han',
    headers:= '{"Content-Type":"application/json","x-cron-secret":"<CRON_SECRET>"}'::jsonb,
    body   := '{}'::jsonb
  );
  $$
);

-- 2) Gửi cảnh báo Telegram — 07:30 hàng ngày
select cron.schedule(
  'telegram-alerts-hang-ngay',
  '30 7 * * *',
  $$
  select net.http_post(
    url    := '<BASE_URL>/api/public/hooks/telegram-alerts',
    headers:= '{"Content-Type":"application/json","x-cron-secret":"<CRON_SECRET>"}'::jsonb,
    body   := '{}'::jsonb
  );
  $$
);

-- 3) Backup hàng ngày — 02:00
select cron.schedule(
  'daily-backup',
  '0 2 * * *',
  $$
  select net.http_post(
    url    := '<BASE_URL>/api/public/hooks/daily-backup',
    headers:= '{"Content-Type":"application/json","x-backup-secret":"<BACKUP_CRON_SECRET>"}'::jsonb,
    body   := '{}'::jsonb
  );
  $$
);
```

## Kiểm tra

```sql
select jobname, schedule, active from cron.job order by jobname;
select jobname, status, return_message, start_time
from cron.job_run_details
order by start_time desc limit 20;
```

## Gỡ job

```sql
select cron.unschedule('sinh-canh-bao-het-han-hang-ngay');
select cron.unschedule('telegram-alerts-hang-ngay');
select cron.unschedule('daily-backup');
```

## Checklist deploy môi trường mới

- [ ] `CRON_SECRET` đã set
- [ ] `BACKUP_CRON_SECRET` đã set
- [ ] Chạy khối SQL ở trên với `<BASE_URL>` đúng của env
- [ ] `select * from cron.job` cho thấy 3 job `active = true`
- [ ] Sau 24h kiểm `cron.job_run_details` không có lỗi
