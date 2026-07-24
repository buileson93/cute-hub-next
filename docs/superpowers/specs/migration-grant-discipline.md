# Kỷ luật GRANT cho migration MIRATS

Mọi migration mới có thay đổi public schema phải có block GRANT ở cuối file. Không dựa vào event trigger auto-grant. Với bảng đích và mọi bảng cha FK, luôn cấp `ALL PRIVILEGES` **và nhắc lại explicit `UPDATE`** cho `sandbox_exec, postgres` để tránh FK RI trigger PG17 lỗi `FOR KEY SHARE`.

## Block bắt buộc cho bảng đích

```sql
GRANT SELECT, INSERT, UPDATE, DELETE, REFERENCES, TRIGGER
ON public.<bang_dich>
TO authenticated;

GRANT ALL PRIVILEGES
ON public.<bang_dich>
TO service_role, sandbox_exec, postgres;

-- Bắt buộc nhắc lại UPDATE: đã từng gặp ACL owner sandbox_exec thiếu `w`
-- dù còn SELECT/INSERT/DELETE/REFERENCES/TRIGGER/MAINTAIN.
GRANT UPDATE
ON public.<bang_dich>
TO sandbox_exec, postgres;
```

## Block bắt buộc cho TẤT CẢ bảng cha FK

Với mọi bảng được tham chiếu bằng foreign key, thêm quyền nền đầy đủ cho owner/runtime nội bộ để FK row-lock (`FOR KEY SHARE`) và trigger không rơi lỗi `42501 permission denied`.

```sql
GRANT SELECT, REFERENCES
ON public.<bang_cha_fk>
TO authenticated;

GRANT ALL PRIVILEGES
ON public.<bang_cha_fk>
TO sandbox_exec, postgres;

-- Không bỏ dòng này cho các bảng cha như dm_he_thong, dm_don_vi,
-- dm_loai_thiet_bi, dm_vi_tri, dm_trang_thai_thiet_bi, thiet_bi, v.v.
GRANT UPDATE
ON public.<bang_cha_fk>
TO sandbox_exec, postgres;
```

Nếu bảng cha có trigger cascade/sync hoặc được cập nhật gián tiếp bởi RPC, giữ nguyên `ALL PRIVILEGES` **và** `GRANT UPDATE`; không hạ xuống chỉ `SELECT/REFERENCES`. Riêng PG17, FK RI trigger có thể chạy row-lock `FOR KEY SHARE` dưới owner/runtime role của bảng cha, nên thiếu `UPDATE` trên `sandbox_exec` sẽ gây `42501 permission denied for table <bang_cha>` dù user `authenticated` đã đủ quyền.

## Block vá nền khi phát hiện owner ACL mất UPDATE

Chạy migration nhỏ, không phụ thuộc event trigger auto-grant:

```sql
GRANT UPDATE ON ALL TABLES IN SCHEMA public TO sandbox_exec, postgres;
```

## Function / RPC / trigger function

```sql
GRANT EXECUTE ON FUNCTION public.<function_signature> TO authenticated, service_role, sandbox_exec, postgres;
ALTER FUNCTION public.<function_signature> OWNER TO postgres;
```

Áp dụng đặc biệt cho các RPC/trigger ghi dữ liệu như khai thêm hệ thống, khai thêm thành phần hệ thống, lắp/tháo tài sản, đồng bộ đơn vị/vị trí, và các trigger cascade.

## Default privileges nếu migration tạo nhiều object

```sql
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public
GRANT SELECT, INSERT, UPDATE, DELETE, REFERENCES, TRIGGER ON TABLES TO authenticated;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public
GRANT ALL PRIVILEGES ON TABLES TO service_role, sandbox_exec, postgres;

ALTER DEFAULT PRIVILEGES FOR ROLE sandbox_exec IN SCHEMA public
GRANT SELECT, INSERT, UPDATE, DELETE, REFERENCES, TRIGGER ON TABLES TO authenticated;
ALTER DEFAULT PRIVILEGES FOR ROLE sandbox_exec IN SCHEMA public
GRANT ALL PRIVILEGES ON TABLES TO service_role, sandbox_exec, postgres;
```

## Checklist trước khi chốt migration

- Có GRANT cho từng bảng mới trong public.
- Có GRANT cho tất cả bảng cha FK, gồm `REFERENCES` cho `authenticated`, `ALL PRIVILEGES` và explicit `UPDATE` cho `sandbox_exec, postgres`.
- Có GRANT EXECUTE cho mọi function mới/sửa.
- Trigger function/RPC ghi dữ liệu quan trọng thuộc owner `postgres`.
- Test bằng phiên user thật, không chỉ bằng quyền admin/backend; sau test phải xoá hoặc rollback dữ liệu `TEST_*`.