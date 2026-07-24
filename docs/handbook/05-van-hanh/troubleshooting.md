# 05 — Troubleshooting

## `42501: permission denied for table X`

**Nguyên nhân**: migration DDL reset ownership hoặc thiếu GRANT trên bảng cha FK.

**Fix nhanh** (chạy trong Supabase SQL editor bằng superuser):

```sql
GRANT SELECT, INSERT, UPDATE, DELETE, REFERENCES, TRIGGER
  ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO service_role, sandbox_exec, postgres;
GRANT UPDATE ON ALL TABLES IN SCHEMA public TO sandbox_exec, postgres;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO service_role, sandbox_exec, postgres;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO authenticated, service_role, sandbox_exec, postgres;
```

Nếu lỗi nằm ở FK RI trigger, log thường có dạng:

```text
SELECT 1 FROM ONLY public.<bang_cha> ... FOR KEY SHARE OF x
```

Trường hợp này ưu tiên kiểm `has_table_privilege('sandbox_exec', '<bang_cha>', 'UPDATE')`. Nếu trả `false`, chạy migration nhỏ `GRANT UPDATE ON ALL TABLES IN SCHEMA public TO sandbox_exec, postgres;` rồi test lại bằng REST/RPC với user thật và xoá dữ liệu test.

**Fix bền vững**: mọi migration mới kèm block GRANT, trong đó `sandbox_exec, postgres` phải có `ALL PRIVILEGES` và explicit `UPDATE` trên bảng đích + mọi bảng cha FK — xem `../04-quy-uoc/grant-discipline.md`.

## Loop login / logout

**Triệu chứng**: đăng nhập thành công nhưng liên tục redirect về `/auth`.

**Nguyên nhân từng gặp**: `use-idle-logout.ts` đọc `localStorage` trước khi hydrate Supabase session → xoá session.

**Fix**: đảm bảo `use-idle-logout` chỉ chạy sau khi có session hợp lệ, KHÔNG reset dựa vào localStorage trước khi server xác thực.

## Build fail: `Unauthorized: No authorization header provided`

**Nguyên nhân**: server fn dùng `requireSupabaseAuth` được gọi trong loader của route public → SSR/prerender không có bearer.

**Fix**: chuyển sang gọi trong component qua `useServerFn` + `useQuery`, hoặc chuyển route xuống `_authenticated/`.

## `Expected 3 parts in JWT; got 1`

**Nguyên nhân**: hand-rolled Supabase client với key mới `sb_publishable_*` gửi thành `Authorization: Bearer` mà PostgREST decode như JWT.

**Fix**: dùng client tự sinh (`@/integrations/supabase/client`, `.server`, `auth-middleware`) — chúng strip header đúng.

## Preview không cập nhật sau khi sửa Vite config

Dùng `restart_dev_server` (tool nội bộ). KHÔNG `code--exec kill vite`.

## Realtime không nhận event

1. Kiểm bảng đã bật realtime trong Supabase (publication `supabase_realtime`).
2. Kiểm RLS — realtime cũng chịu RLS.
3. Kiểm channel name không trùng với channel khác đã subscribe.

## Import Excel treo

- File lớn: chia batch < 5k dòng.
- Kiểm log `import_batch.trang_thai` và `import_item.loi`.
- Dry-run trước qua `AllInOneImport`.

## Không thêm được thành phần (`khai_them_thanh_phan_he_thong`)

Xem [42501](#42501-permission-denied-for-table-x). Nếu vẫn lỗi:

```sql
SELECT proname, pg_get_userbyid(proowner)
FROM pg_proc WHERE proname='khai_them_thanh_phan_he_thong';
-- Owner phải là 'postgres'. Nếu không:
ALTER FUNCTION public.khai_them_thanh_phan_he_thong(...) OWNER TO postgres;
```

## AI trả kết quả trống

- Kiểm `ai_config` bật, model đúng.
- Kiểm rate limit AI Gateway (Lovable dashboard).
- Xem log `ai_message`.
