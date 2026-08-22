# Permission architecture — chống regression permission-denied

Audit 2026-07-24 đã xác nhận gốc rễ hiện tại là event trigger
`mirats_auto_public_grants` do `postgres` sở hữu. Trigger này chạy sau **mọi DDL**
và gọi `mirats_apply_public_grants()`, trong đó sweep `GRANT ... ON ALL TABLES / ALL FUNCTIONS`
toàn schema. Khi tạo migration audit, migration fail ngay ở bước khởi tạo với
`statement timeout`, trước khi SQL mới được chạy. Đây không phải lỗi UI/RLS.

Triệu chứng dây chuyền: migration/DDL timeout giữa chừng → baseline GRANT không hoàn tất
hoặc object/ACL drift → UI báo `permission denied for table dm_he_thong` khi RPC/trigger
`SECURITY DEFINER` cần đọc/ghi lookup nội bộ.

Lưu ý quyền vận hành: trigger/event trigger thuộc owner `postgres`; session sandbox hiện tại
không phải member của `postgres`, nên không thể `DROP EVENT TRIGGER` bằng psql thường. Cần
chạy migration với owner đủ quyền hoặc nhờ Lovable Cloud gỡ trigger nặng này, rồi thay bằng
`postmigrate` + verify/audit nhẹ.

## Ba tầng phòng thủ

### 1. Baseline GRANT (idempotent)

`scripts/grants-baseline.sql`:

- `GRANT USAGE ON SCHEMA public` cho `anon / authenticated / service_role / sandbox_exec / postgres`.
- `GRANT SELECT/INSERT/UPDATE/DELETE ON ALL TABLES IN SCHEMA public TO authenticated`.
- `GRANT ALL ON ALL TABLES/SEQUENCES/FUNCTIONS ... TO service_role, sandbox_exec, postgres`.
- `ALTER DEFAULT PRIVILEGES` cho `postgres` và `sandbox_exec` → object mới **tự** có GRANT, không lệ thuộc event trigger.

### 2. Matrix + verify

`scripts/grants-matrix.json`: 82 ô quyền tối thiểu (bảng × role × privilege + EXECUTE cho RPC then-chốt).
`scripts/verify-grants.mjs`: dựng 1 câu SQL union → dùng `has_table_privilege` / `has_function_privilege` → **fail loud** (exit code 1) nếu thiếu; đồng thời cảnh báo nếu `mirats_auto_public_grants` vẫn đang bật.

### 3. Postmigrate hook

`package.json` → `"postmigrate": "node scripts/apply-grants.mjs && node scripts/verify-grants.mjs"`.
Sau mỗi migration: apply baseline (khôi phục GRANT nếu trigger timeout) → verify (chặn merge nếu vẫn thiếu).

## Khi thêm bảng / RPC mới

1. Thêm row vào `grants-matrix.json` (tables hoặc functions).
2. Chạy `bun run postmigrate` — nếu MISSING, sửa migration hoặc mở rộng `grants-baseline.sql`.
3. Không được xóa entry trong matrix để "cho pass".

## Debug khi lỗi permission

1. `node scripts/verify-grants.mjs` → thấy ngay ô nào thiếu.
2. `psql -c "\dp public.<bảng>"` → xem GRANT thực tế.
3. `psql -c "SELECT proname, proowner::regrole FROM pg_proc WHERE proname='<rpc>'"` → check owner trigger.
4. Trigger SECURITY DEFINER chạy dưới quyền owner (`sandbox_exec` / `postgres`) → owner cũng cần GRANT trên bảng lookup mà trigger đọc.

## Signature RPC trong matrix

`to_regprocedure` yêu cầu **type list** đúng thứ tự, KHÔNG cần param name:
`public.foo(uuid,text,integer)` chứ không phải `public.foo(p_id uuid, ...)`.
