# 04 — Grant discipline

Tài liệu gốc: `docs/superpowers/specs/migration-grant-discipline.md`. Handbook link sang để không rơi mất.

## TL;DR

Event trigger auto-grant KHÔNG tin cậy — mọi migration public schema mới **BẮT BUỘC** kèm block GRANT ở cuối.

```sql
-- Bảng đích
GRANT SELECT, INSERT, UPDATE, DELETE, REFERENCES, TRIGGER
  ON public.<bang> TO authenticated;
GRANT ALL PRIVILEGES ON public.<bang> TO service_role, sandbox_exec, postgres;
GRANT UPDATE ON public.<bang> TO sandbox_exec, postgres;

-- Từng bảng cha FK (để trigger + FK row-lock chạy được)
GRANT SELECT, REFERENCES ON public.<bang_cha> TO authenticated;
GRANT ALL PRIVILEGES ON public.<bang_cha> TO sandbox_exec, postgres;
GRANT UPDATE ON public.<bang_cha> TO sandbox_exec, postgres;

-- Function
GRANT EXECUTE ON FUNCTION public.<sig> TO authenticated, service_role, sandbox_exec, postgres;
ALTER FUNCTION public.<sig> OWNER TO postgres;
```

## Vì sao

- PG17 yêu cầu `UPDATE` privilege để `SELECT ... FOR KEY SHARE` khi FK check; ACL owner `sandbox_exec` đã từng bị mất riêng bit `w`, nên phải có dòng `GRANT UPDATE` explicit, không chỉ dựa vào auto-grant.
- RPC `SECURITY DEFINER` với owner sai → 42501 khi ghi bảng cha.
- Trigger cascade đụng bảng khác → cần TRIGGER + UPDATE trên bảng đó.

## Test sau migration

1. Đăng nhập bằng user thật (không phải service_role).
2. Thực hiện use case đầy đủ: khai hệ thống → khai thành phần → thêm tài sản → lắp tài sản.
3. Nếu 42501 → thiếu grant. Bổ sung ngay migration mới.

## Checklist trong PR

- [ ] Có `GRANT` cho từng bảng mới.
- [ ] Có `GRANT` cho mọi bảng cha FK (kèm `REFERENCES`, `ALL PRIVILEGES` và explicit `UPDATE` cho `sandbox_exec, postgres`).
- [ ] Có `GRANT EXECUTE` cho function mới/sửa.
- [ ] `ALTER FUNCTION ... OWNER TO postgres` cho RPC ghi.
- [ ] Test bằng phiên user thật, rồi xoá dữ liệu test.
