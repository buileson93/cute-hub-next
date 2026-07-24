# 03 — Database: Triggers

Truy vấn hiện tại:

```sql
SELECT event_object_table AS tbl, trigger_name, event_manipulation AS evt, action_timing AS timing
FROM information_schema.triggers WHERE trigger_schema='public' ORDER BY tbl, trigger_name;
```

## Trigger hiện có (theo query gần nhất)

| Bảng | Trigger | Sự kiện | Timing | Function |
|---|---|---|---|---|
| `audit_log` | `trg_audit_bulk_delete` | INSERT | AFTER | (thu dọn audit_log) |

> Ghi chú: nhiều trigger cũ (sync 3 lớp, cập nhật `updated_at`, sync đơn vị/vị trí) có thể đã được inline hoá vào RPC hoặc bị gỡ. **Khi thêm trigger mới, cập nhật bảng trên**.

## Trigger function thường dùng

- `audit_row_change()` — dùng làm `AFTER INSERT/UPDATE/DELETE` trên bảng nghiệp vụ. Không bắt buộc gắn tự động; xem migration.
- `_sync_3lop(...)` — có thể được gọi trực tiếp trong RPC thay vì trigger để tránh recursion.

## Nguyên tắc khi tạo trigger

1. Trigger function `SECURITY DEFINER`, owner=`postgres`.
2. `GRANT EXECUTE` cho `authenticated, sandbox_exec, postgres`.
3. Trigger đụng bảng cha FK → GRANT `TRIGGER, UPDATE, REFERENCES` cho `sandbox_exec` trên bảng cha (nếu không sẽ 42501 khi FK check).
4. Tránh trigger recursion — dùng flag `pg_trigger_depth()` hoặc `session_replication_role` khi cần.
5. Ghi audit trong RPC (chủ động) thay vì trigger (bị động) khi muốn kiểm soát metadata.

## Debug trigger

```sql
-- Xem trigger + function body
SELECT t.tgname, c.relname, p.proname, pg_get_triggerdef(t.oid)
FROM pg_trigger t JOIN pg_class c ON c.oid=t.tgrelid
JOIN pg_proc p ON p.oid=t.tgfoid
WHERE NOT t.tgisinternal AND c.relnamespace='public'::regnamespace;
```
