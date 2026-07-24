-- Cron jobs. Trước khi chạy, thay 2 placeholder:
--   __PUBLIC_APP_URL__  → ví dụ https://vatm.app
--   __ANON_KEY__        → sb_publishable_... của project MỚI

-- Dọn job cũ (idempotent)
SELECT cron.unschedule(jobname)
FROM cron.job
WHERE jobname IN ('scan-canh-bao-het-han', 'reliability-report-daily', 'pm-generate-daily');

-- Cảnh báo giấy phép/hiệu chuẩn sắp hết hạn (mỗi 6h)
SELECT cron.schedule(
  'scan-canh-bao-het-han',
  '0 */6 * * *',
  $$
  SELECT net.http_post(
    url := '__PUBLIC_APP_URL__/api/public/hooks/scan-canh-bao',
    headers := '{"Content-Type":"application/json","apikey":"__ANON_KEY__"}'::jsonb,
    body := '{}'::jsonb
  );
  $$
);

-- Báo cáo độ tin cậy hàng ngày 6:00 sáng
SELECT cron.schedule(
  'reliability-report-daily',
  '0 6 * * *',
  $$
  SELECT net.http_post(
    url := '__PUBLIC_APP_URL__/api/public/hooks/reliability-report',
    headers := '{"Content-Type":"application/json","apikey":"__ANON_KEY__"}'::jsonb,
    body := '{"period":"daily"}'::jsonb
  );
  $$
);

-- Sinh kế hoạch PM tự động 5:00 sáng
SELECT cron.schedule(
  'pm-generate-daily',
  '0 5 * * *',
  $$
  SELECT net.http_post(
    url := '__PUBLIC_APP_URL__/api/public/hooks/pm-generate',
    headers := '{"Content-Type":"application/json","apikey":"__ANON_KEY__"}'::jsonb,
    body := '{}'::jsonb
  );
  $$
);

-- Kiểm tra
SELECT jobname, schedule, active FROM cron.job ORDER BY jobname;
