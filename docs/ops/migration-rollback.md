# Migration Rollback & Forward-Fix — MIRATS 2.0

Postgres migration là **một chiều theo mặc định**: một khi `ALTER`/`DROP` đã áp lên prod, không có nút "undo" tự động. Tài liệu này chuẩn hoá cách viết migration để luôn có phương án hoàn tác hoặc forward-fix an toàn.

## 1. Nguyên tắc

1. **Ưu tiên forward-fix hơn rollback.** Trong đa số trường hợp, viết migration mới sửa lỗi nhanh và an toàn hơn `pg_restore`.
2. **Rollback chỉ khi**: migration vừa áp gây mất dữ liệu, phá RLS, hoặc app không thể vận hành và không kịp forward-fix trong SLA (< 30 phút).
3. **Không sửa migration đã merge vào `main`.** Sai thì viết migration mới bù. File cũ là bằng chứng lịch sử; sửa sẽ khiến các môi trường lệch nhau.
4. **Mọi migration phá huỷ (DROP COLUMN/TABLE, thay type, NOT NULL trên cột có dữ liệu) phải kèm plan hoàn tác** trong PR description.

## 2. Phân loại theo mức độ rủi ro

| Loại                                        | Rủi ro | Phương án hoàn tác                     |
|---------------------------------------------|--------|----------------------------------------|
| `CREATE TABLE`, `CREATE INDEX CONCURRENTLY` | Thấp   | Forward: `DROP TABLE`/`DROP INDEX`     |
| `ADD COLUMN` nullable + default trống       | Thấp   | Forward: `DROP COLUMN`                 |
| `CREATE POLICY`, `GRANT`                    | Thấp   | Forward: `DROP POLICY` / `REVOKE`      |
| `ALTER COLUMN TYPE`                         | **Cao** | Cần backup + kịch bản đảo type        |
| `DROP COLUMN` / `DROP TABLE`                | **Cao** | PITR / restore dump — KHÔNG đảo được  |
| `UPDATE`/`DELETE` diện rộng                 | **Cao** | PITR về thời điểm trước migration     |
| `ALTER … NOT NULL` khi có NULL trong dữ liệu| Cao    | Backfill trước, rồi set NOT NULL      |

## 3. Cấu trúc migration khuyến nghị

Mỗi file trong `supabase/migrations/` bắt đầu bằng comment mô tả forward + rollback:

```sql
-- 20260714_120000_them_cot_ghi_chu.sql
-- Forward: thêm cột `ghi_chu` (text, nullable) vào public.thiet_bi.
-- Rollback: ALTER TABLE public.thiet_bi DROP COLUMN ghi_chu;
-- Rủi ro: thấp (nullable, không đổi type).

ALTER TABLE public.thiet_bi ADD COLUMN ghi_chu text;
```

Đối với migration rủi ro cao, kèm cả script rollback tương ứng dưới dạng file `.rollback.sql` cạnh migration để dùng khi cần:

```
supabase/migrations/
  20260714_140000_doi_kieu_cot.sql
  20260714_140000_doi_kieu_cot.rollback.sql
```

File `.rollback.sql` **không** được Supabase CLI áp tự động — chỉ chạy tay khi rollback (§5).

## 4. Pattern "expand → migrate → contract"

Bắt buộc cho mọi thay đổi phá huỷ trên bảng đang có dữ liệu prod:

1. **Expand** (migration #1): thêm cột/bảng mới, backfill từ cột cũ. App vẫn ghi vào cột cũ.
2. **Deploy code**: app đọc/ghi cả hai; dual-write.
3. **Migrate** (migration #2): backfill xong, chuyển app sang đọc cột mới.
4. **Contract** (migration #3, sau ≥ 1 tuần ổn định): drop cột cũ.

Mỗi bước là một PR/migration riêng — rollback từng bước không mất dữ liệu.

## 5. Quy trình rollback khẩn (production)

Điều kiện kích hoạt: app hỏng, forward-fix > 30 phút.

1. **Đóng cổng viết** — bật maintenance mode (feature flag `ops.maintenance = true`).
2. **Xác định phương án**:
   - Có file `.rollback.sql` và không mất dữ liệu → **áp rollback SQL**.
   - `DROP` đã chạy, dữ liệu mất → **PITR** về ngay trước migration (xem `backup-restore.md §3.1`).
3. **Áp rollback**:
   ```bash
   supabase link --project-ref $PROD_SUPABASE_PROJECT_REF
   psql "$PROD_DB_URL" -v ON_ERROR_STOP=1 -f supabase/migrations/<file>.rollback.sql
   ```
4. **Đánh dấu migration đã hoàn tác**: xoá bản ghi khỏi `supabase_migrations.schema_migrations` — CHỈ khi rollback SQL đã chạy sạch:
   ```sql
   DELETE FROM supabase_migrations.schema_migrations WHERE version = '<version>';
   ```
5. **Deploy code cũ tương ứng** (revert commit ứng dụng).
6. **Tắt maintenance mode**, verify smoke test.
7. **Post-mortem trong 48h**: điền vào `docs/ops/log-incidents.md` (tạo khi có sự cố đầu tiên) — nguyên nhân, thời gian phát hiện, thời gian khôi phục, hành động phòng ngừa.

## 6. Checklist trước khi merge migration

Điền vào phần "Migration checklist" trong PR:

- [ ] File nằm trong `supabase/migrations/` với timestamp đúng thứ tự.
- [ ] Có comment mô tả **Forward / Rollback / Rủi ro** ở đầu file.
- [ ] Với bảng public mới: có đủ `CREATE TABLE → GRANT → ENABLE RLS → CREATE POLICY`.
- [ ] Rủi ro Cao: có file `.rollback.sql` đi kèm, hoặc plan PITR ghi trong PR.
- [ ] Rủi ro Cao: theo pattern **expand → migrate → contract**, không drop cột trong cùng migration thêm cột mới.
- [ ] Đã chạy `supabase db reset` cục bộ hoặc CI job `migration` đã pass.
- [ ] Không chứa dữ liệu demo/seed cho môi trường prod (xem `environments.md §4`).
- [ ] Không đụng schema cấm: `auth`, `storage`, `realtime`, `supabase_functions`, `vault`.

## 7. Forward-fix mẫu

Trường hợp phổ biến: migration đã áp lên staging phát hiện sai constraint.

```sql
-- 20260714_150000_sua_constraint_su_co.sql
-- Forward-fix cho 20260714_140000_them_constraint_su_co.sql:
-- constraint cũ quá chặt, gây insert fail cho 3% dữ liệu hợp lệ.
ALTER TABLE public.su_co DROP CONSTRAINT IF EXISTS su_co_muc_do_check;
ALTER TABLE public.su_co ADD CONSTRAINT su_co_muc_do_check
  CHECK (muc_do IN ('thap', 'trung_binh', 'cao', 'nghiem_trong'));
```

Không sửa file `20260714_140000_*.sql` — tạo file mới `20260714_150000_*.sql` bù.
