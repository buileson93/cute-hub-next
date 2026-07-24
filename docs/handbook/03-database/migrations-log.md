# 03 — Database: Migration log

## Chính sách

- **Chỉ tạo migration mới**, không sửa migration cũ.
- Mỗi migration BẮT BUỘC kèm GRANT — xem `../04-quy-uoc/grant-discipline.md`.
- Đặt tên: Supabase tự sinh `<timestamp>_<uuid>.sql`; đừng đổi tay.
- Mô tả trong PR/commit message: mục đích, bảng/RPC ảnh hưởng, breaking change (nếu có).

## Ghi chép migration đáng chú ý

| Ngày | Nội dung | Ghi chú |
|---|---|---|
| 2026-07-23 → 2026-07-24 | Baseline setup + 218 migrations từ `mirats-clone-kit.zip` | Xem `supabase/migrations/` |
| 2026-07 | Bỏ unique constraint trên `gan_chuc_nang` — 1 tài sản ↔ N thành phần | Không khôi phục |
| 2026-07 | Baseline GRANT cho `sandbox_exec, postgres` | Fix 42501 khi RPC ghi qua FK |
| 2026-07 | Chuẩn hoá RPC ghi dữ liệu về owner=postgres | `khai_them_thanh_phan_he_thong` etc. |
| 2026-07 | `notifications` + RLS + realtime | N-UX2026 |
| 2026-07 | `system_signing_key` + `form_sign_otp` | Ký số form |
| 2026-07 | MV `mv_asset_anomaly` + pg_cron `0 */6 * * *` | N9 anomaly |

## Rollback migration

Không dùng `supabase migration down` — không đảm bảo idempotent.  
Rollback bằng **migration mới** đảo ngược thay đổi.

Xem thêm `docs/ops/migration-rollback.md`.

## Reset schema

Chỉ dùng khi setup lại từ đầu:
1. Backup toàn bộ (`admin.backup.tsx`).
2. Chạy các migration trong `supabase/migrations/` theo thứ tự.
3. Chạy `admin_reset_sequences()`.
4. Import lại dữ liệu.
