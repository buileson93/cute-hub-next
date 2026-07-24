# GĐ2-01 — RPC `rpc_daily_brief`

## Goal
Server aggregate mọi số liệu cho block "Hôm nay có gì thay đổi" trong 1 lượt gọi.

## Acceptance
- Function `public.rpc_daily_brief(p_user_id uuid)` trả JSONB:
  ```json
  {
    "expiring_gp_7d": <int>, "expiring_gp_30d": <int>,
    "open_incidents": <int>, "critical_incidents": <int>,
    "overdue_pm": <int>, "due_pm_7d": <int>,
    "my_shift_tasks": <int>, "unread_notif": <int>,
    "generated_at": "<iso>"
  }
  ```
- `SECURITY DEFINER`, `SET search_path = public`.
- GRANT EXECUTE authenticated.
- Trả trong < 200ms trên preview (đo bằng `explain analyze`).

## Tests (viết trước)
1. SQL test: seed 3 GP hết hạn trong 7 ngày → `SELECT rpc_daily_brief(uid)` → `expiring_gp_7d = 3`.
2. Test RLS: user A không thấy sự cố của user B khi count `my_shift_tasks`.
3. Test performance: `EXPLAIN ANALYZE` < 200ms với dataset thực.

## Steps
1. Migration: viết function; index bổ sung nếu thiếu (`giay_phep(ngay_het_han)`, `su_co(trang_thai)`).
2. Test SQL trong `supabase--read_query`.
3. Tạo hook `useDailyBrief()` gọi RPC + refetch mỗi 5 phút.

## Definition of Done
- [ ] Migration approved.
- [ ] Test SQL xanh.
- [ ] `EXPLAIN ANALYZE` < 200ms.

## Rollback
`DROP FUNCTION rpc_daily_brief`.
