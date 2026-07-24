# migrations-fresh — Bộ SQL nạp vào Supabase project mới

Dùng khi cutover từ Lovable Cloud sang Supabase tự chủ. **Không chạy trên backend hiện tại** (đã có schema).

## Chiến lược

Backend cũ đã có 321 file migration + trigger housekeeping. Tái tạo thủ công từng bảng không khả thi. Thay vào đó:

1. **Schema**: dump nguyên trạng từ backend cũ bằng `pg_dump --schema-only` → nạp thẳng vào backend mới. Chi tiết trong `scripts/export-schema.sh`.
2. **`migrations-fresh/`** ở đây chỉ chứa những thứ **CẦN CHẠY THÊM** sau khi nạp schema dump:
   - Extensions (đảm bảo bật đúng thứ tự trước schema).
   - **49 B-tree index còn thiếu** — vốn bị timeout ở backend cũ, giờ chạy được.
   - GIN index cho full-text search.
   - Cron jobs (URL endpoint cần cập nhật theo domain mới).
   - Seed reference data tối thiểu (nếu import-data không cover).

## Thứ tự chạy

```
00_extensions.sql          → chạy TRƯỚC schema dump
<schema.sql từ pg_dump>    → nạp toàn bộ table/function/policy
10_indexes_btree.sql       → 49 FK index còn thiếu
11_indexes_gin.sql         → pg_trgm cho search_index
12_cron_jobs.sql           → thay __PUBLIC_APP_URL__ + __ANON_KEY__ trước khi chạy
```

## Nguyên tắc bảo trì

- Mỗi lần thêm bảng mới ở backend hiện tại → không đụng file ở đây; chỉ cần re-dump schema.
- Khi phát hiện thêm FK không có index → thêm dòng vào `10_indexes_btree.sql`.
- Cron job mới → thêm vào `12_cron_jobs.sql` để lần cutover kế tiếp không sót.
