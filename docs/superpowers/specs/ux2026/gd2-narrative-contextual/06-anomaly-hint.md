# GĐ2-06 — Anomaly Hint

## Goal
Badge nhẹ trên tài sản có tần suất sự cố cao bất thường (2σ trên trung bình 90 ngày cùng loại), để tech chú ý sớm.

## Acceptance
- Materialized view `mv_asset_anomaly` (asset_id, incident_count_90d, z_score).
- Refresh qua pg_cron mỗi 6h.
- Badge cam nhỏ trên row bảng tài sản khi `z_score >= 2`.
- Tooltip: "5 sự cố / 90 ngày — cao bất thường vs cùng loại".

## Tests (viết trước)
1. SQL: seed data → MV compute đúng z_score.
2. UI: row có `z_score=2.3` → badge hiển thị.
3. Row `z_score=0.5` → không badge.
4. pg_cron job tồn tại và schedule đúng.

## Steps
1. Migration MV + index.
2. pg_cron: `SELECT cron.schedule('refresh_asset_anomaly', '0 */6 * * *', $$REFRESH MATERIALIZED VIEW CONCURRENTLY mv_asset_anomaly$$)`.
3. Query MV kèm bảng tài sản (join in `rpc_tai_san_toan_cuc`).
4. Component `<AnomalyBadge score />`.

## Definition of Done
- [ ] Migration approved.
- [ ] pg_cron job hoạt động (verify `cron.job`).
- [ ] Badge hiển thị đúng.

## Rollback
Drop MV + cron job; ẩn badge trong bảng.
